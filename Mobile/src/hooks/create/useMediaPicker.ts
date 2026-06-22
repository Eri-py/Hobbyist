import { useCallback, useEffect, useRef, useState } from "react";
import * as MediaLibrary from "expo-media-library";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { MAX_FILES } from "@hobbyist/hooks";

export { MAX_FILES };

const PAGE_SIZE = 50;
const MAX_DIMENSION = 1920;

// --- Upload processing ---

function getVideoMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const mimeTypes: Record<string, string> = {
    mp4: "video/mp4",
    mov: "video/quicktime",
    mpeg: "video/mpeg",
    mpg: "video/mpeg",
    webm: "video/webm",
    ogv: "video/ogg",
    avi: "video/x-msvideo",
  };
  return mimeTypes[ext] ?? "video/mp4";
}

async function processAssetForUpload(asset: MediaLibrary.AssetInfo, index: number) {
  const uri = asset.uri;
  if (asset.mediaType === MediaLibrary.MediaType.VIDEO) {
    const filename = asset.filename ?? `media_${index}.mp4`;
    return { uri, name: filename, type: getVideoMimeType(filename) };
  }
  const context = ImageManipulator.manipulate(uri);
  if (asset.width > MAX_DIMENSION || asset.height > MAX_DIMENSION) {
    if (asset.width >= asset.height) {
      context.resize({ width: MAX_DIMENSION });
    } else {
      context.resize({ height: MAX_DIMENSION });
    }
  }
  const image = await context.renderAsync();
  // Keep PNG to preserve transparency; everything else compresses to JPEG.
  const isPng = (asset.filename ?? "").toLowerCase().endsWith(".png");
  if (isPng) {
    const result = await image.saveAsync({ format: SaveFormat.PNG });
    return { uri: result.uri, name: `media_${index}.png`, type: "image/png" };
  }
  const result = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  return { uri: result.uri, name: `media_${index}.jpg`, type: "image/jpeg" };
}

export async function processMediaForUpload(assets: MediaLibrary.AssetInfo[]) {
  return Promise.all(assets.map(processAssetForUpload));
}

// --- Hook ---

export function useMediaPicker() {
  const [media, setMedia] = useState<MediaLibrary.Asset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<MediaLibrary.AssetInfo[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const grantedRef = useRef(false);
  const selectedRef = useRef<MediaLibrary.AssetInfo[]>([]);

  // Mirror selection into a ref so toggleAsset can stay a stable callback (keeps tiles memoized).
  useEffect(() => {
    selectedRef.current = selectedAssets;
  }, [selectedAssets]);

  // Auto-clear transient errors (e.g. the selection limit message).
  useEffect(() => {
    if (!mediaError) return;
    const timer = setTimeout(() => setMediaError(null), 5000);
    return () => clearTimeout(timer);
  }, [mediaError]);

  // Fetch one page of recents. Returns raw Asset[] (sync ids); per-tile metadata
  // resolves lazily, so there's no getInfo flood that hangs the scroll.
  const fetchPage = useCallback(async (offset: number) => {
    const assets = await new MediaLibrary.Query()
      .orderBy({ key: MediaLibrary.AssetField.CREATION_TIME, ascending: false })
      .limit(PAGE_SIZE)
      .offset(offset)
      .exe();
    hasMoreRef.current = assets.length === PAGE_SIZE;
    return assets;
  }, []);

  // Load the first page on every mount, checking permission directly so it never
  // depends on a reactive hook re-resolving across modal close/reopen.
  useEffect(() => {
    let active = true;
    loadingRef.current = true;
    (async () => {
      try {
        let perm = await MediaLibrary.getPermissionsAsync();
        if (!perm.granted && perm.canAskAgain) {
          perm = await MediaLibrary.requestPermissionsAsync();
        }
        if (!perm.granted) {
          if (active) setMediaError("Photo access is needed to add media.");
          return;
        }
        grantedRef.current = true;
        const assets = await fetchPage(0);
        if (active) setMedia(assets);
      } catch {
        if (active) setMediaError("Couldn't load your photos.");
      } finally {
        loadingRef.current = false;
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchPage]);

  // Append the next page as the grid nears its end.
  const loadMore = useCallback(() => {
    if (!grantedRef.current || loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    (async () => {
      try {
        const assets = await fetchPage(media.length);
        setMedia((prev) => [...prev, ...assets]);
      } catch {
        // best-effort; keep what we already have
      } finally {
        loadingRef.current = false;
      }
    })();
  }, [fetchPage, media.length]);

  const toggleAsset = useCallback((asset: MediaLibrary.AssetInfo) => {
    const current = selectedRef.current;
    const alreadySelected = current.some((a) => a.id === asset.id);
    if (!alreadySelected && current.length >= MAX_FILES) {
      setMediaError(`You can select up to ${MAX_FILES} files.`);
      return;
    }
    setSelectedAssets((prev) =>
      prev.some((a) => a.id === asset.id)
        ? prev.filter((a) => a.id !== asset.id)
        : [...prev, asset],
    );
  }, []);

  return { media, selectedAssets, toggleAsset, loadMore, mediaError };
}
