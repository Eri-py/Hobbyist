import { useCallback, useEffect, useRef, useState } from "react";
import * as MediaLibrary from "expo-media-library";
import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { MAX_FILE_SIZE, MAX_TOTAL_SIZE, MAX_FILES } from "@hobbyist/hooks";

export type ValidActiveAlbumTypes = "Recents" | "Videos" | "Favorites";

export { MAX_FILES };

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

const MAX_DIMENSION = 1920;

async function processAssetForUpload(asset: MediaLibrary.AssetInfo, index: number) {
  const uri = asset.localUri ?? asset.uri;
  if (asset.mediaType === MediaLibrary.MediaType.video) {
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
  // Preserve PNG format so transparency survives; compress everything else as JPEG.
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

export function useMediaPicker() {
  const [permission] = MediaLibrary.usePermissions();
  const [media, setMedia] = useState<MediaLibrary.Asset[]>();
  const [activeAlbum, setAlbum] = useState<ValidActiveAlbumTypes>("Recents");
  const [selectedAssets, setSelectedAssets] = useState<MediaLibrary.Asset[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const assetSizes = useRef(new Map<string, number>());

  useEffect(() => {
    if (!mediaError) return;
    const timer = setTimeout(() => setMediaError(null), 5000);
    return () => clearTimeout(timer);
  }, [mediaError]);

  useEffect(() => {
    if (!permission?.granted) return;
    (async () => {
      const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
      const album = albums.find((a) => a.title === activeAlbum);
      if (!album) return;
      // Loads up to 1000 assets — users with larger libraries won't see older items.
      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: ["photo", "video"],
        sortBy: MediaLibrary.SortBy.creationTime,
        first: 1000,
        album,
      });
      setMedia(assets);
    })();
  }, [activeAlbum, permission?.granted]);

  const toggleAsset = useCallback(
    async (asset: MediaLibrary.Asset) => {
      const isSelected = selectedAssets.some((a) => a.id === asset.id);

      if (isSelected) {
        const cachedSize = assetSizes.current.get(asset.id) ?? 0;
        assetSizes.current.delete(asset.id);
        setSelectedAssets((prev) => prev.filter((a) => a.id !== asset.id));
        setTotalSize((prev) => Math.max(0, prev - cachedSize));
        return;
      }

      if (selectedAssets.length >= MAX_FILES) {
        setMediaError(`You can select up to ${MAX_FILES} files.`);
        return;
      }

      const info = await MediaLibrary.getAssetInfoAsync(asset);
      const uri = info.localUri ?? info.uri;
      const size = new File(uri).size;

      // Images are compressed before upload, so skip the per-file check; videos aren't, so enforce.
      const isVideo = asset.mediaType === MediaLibrary.MediaType.video;
      if (isVideo && size > MAX_FILE_SIZE) {
        setMediaError(
          `"${asset.filename}" exceeds the ${MAX_FILE_SIZE / 1024 / 1024}MB per-file limit.`,
        );
        return;
      }
      if (totalSize + size > MAX_TOTAL_SIZE) {
        setMediaError(`Total upload limit of ${MAX_TOTAL_SIZE / 1024 / 1024}MB reached.`);
        return;
      }

      assetSizes.current.set(asset.id, size);
      setSelectedAssets((prev) => [...prev, asset]);
      setTotalSize((prev) => prev + size);
    },
    [selectedAssets, totalSize],
  );

  return {
    media,
    activeAlbum,
    setAlbum,
    selectedAssets,
    toggleAsset,
    mediaError,
  };
}
