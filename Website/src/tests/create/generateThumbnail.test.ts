import { vi, beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";

import { generateThumbnail } from "@/hooks/create/generateThumbnail";

// ---------------------------------------------------------------------------
// Mock URL helpers (jsdom doesn't implement them)
// ---------------------------------------------------------------------------
const mockObjectURL = "blob:mock-url";
const createObjectURL = vi.fn(() => mockObjectURL);
const revokeObjectURL = vi.fn();

beforeAll(() => {
  vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
});

// ---------------------------------------------------------------------------
// Mock HTMLImageElement so we control when onload / onerror fires
// ---------------------------------------------------------------------------
class MockImage {
  private _src = "";
  width = 1600;
  height = 900;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  get src() {
    return this._src;
  }

  // Setting src triggers onload asynchronously (simulates browser behaviour)
  set src(val: string) {
    this._src = val;
    Promise.resolve().then(() => this.onload?.());
  }
}

// ---------------------------------------------------------------------------
// Mock canvas so we never touch a real GPU context
// ---------------------------------------------------------------------------
const mockToDataURL = vi.fn(() => "data:image/jpeg;base64,mockthumbnail");
const mockDrawImage = vi.fn();
const mockCanvas = {
  getContext: vi.fn(() => ({ drawImage: mockDrawImage })),
  toDataURL: mockToDataURL,
  width: 0,
  height: 0,
};

let originalCreateElement: typeof document.createElement;

beforeAll(() => {
  vi.stubGlobal("Image", MockImage);
  originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tag) => {
    if (tag === "canvas") return mockCanvas as unknown as HTMLCanvasElement;
    return originalCreateElement(tag);
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

beforeEach(() => {
  mockToDataURL.mockClear();
  mockDrawImage.mockClear();
  mockCanvas.getContext.mockClear();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeFile = (name: string, type: string) => new File(["content"], name, { type });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("generateThumbnail", () => {
  it("returns an object URL immediately for non-image files", async () => {
    // Arrange
    const file = makeFile("video.mp4", "video/mp4");

    // Act
    const result = await generateThumbnail(file);

    // Assert
    expect(result).toBe(mockObjectURL);
    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(mockCanvas.getContext).not.toHaveBeenCalled();
  });

  it("returns a data URL (canvas thumbnail) for image files", async () => {
    // Arrange
    const file = makeFile("photo.jpg", "image/jpeg");

    // Act
    const result = await generateThumbnail(file);

    // Assert
    expect(result).toBe("data:image/jpeg;base64,mockthumbnail");
    expect(mockDrawImage).toHaveBeenCalled();
    expect(mockToDataURL).toHaveBeenCalledWith("image/jpeg", 0.9);
  });

  it("cleans up the original image object URL after drawing the canvas", async () => {
    // Arrange
    const file = makeFile("photo.png", "image/png");

    // Act
    await generateThumbnail(file);

    // Assert
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith(mockObjectURL);
  });

  it("scales down a landscape image that exceeds the max size", async () => {
    // Arrange — MockImage defaults: width=1600, height=900
    // Expected: width scaled to 900, height = (900*900)/1600 ≈ 506
    const file = makeFile("wide.jpg", "image/jpeg");

    // Act
    await generateThumbnail(file);

    // Assert
    expect(mockCanvas.width).toBe(900);
    expect(Math.round(mockCanvas.height)).toBe(506);
  });

  it("falls back to an object URL when the canvas 2d context is unavailable", async () => {
    // Arrange
    mockCanvas.getContext.mockReturnValueOnce(
      null as unknown as { drawImage: typeof mockDrawImage },
    );
    const file = makeFile("photo.jpg", "image/jpeg");

    // Act
    const result = await generateThumbnail(file);

    // Assert
    expect(result).toBe(mockObjectURL);
    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(mockDrawImage).not.toHaveBeenCalled();
  });

  it("falls back to an object URL when the image fails to load", async () => {
    // Arrange — override Image so onerror fires instead of onload
    class ErrorImage {
      private _src = "";
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      get src() {
        return this._src;
      }
      set src(val: string) {
        this._src = val;
        Promise.resolve().then(() => this.onerror?.());
      }
    }

    vi.stubGlobal("Image", ErrorImage);
    const file = makeFile("broken.jpg", "image/jpeg");

    // Act
    const result = await generateThumbnail(file);

    // Assert
    expect(result).toBe(mockObjectURL);
    expect(createObjectURL).toHaveBeenCalledWith(file);

    // Restore normal MockImage for subsequent tests
    vi.stubGlobal("Image", MockImage);
  });
});
