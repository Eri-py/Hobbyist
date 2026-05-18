import { useCallback, useEffect, useRef, useState } from "react";
import * as MediaLibrary from "expo-media-library";
import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

export type ValidActiveAlbumTypes = "Recents" | "Videos" | "Favorites";

export const MAX_FILES = 15;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB total

async function processAssetForUpload(asset: MediaLibrary.AssetInfo, index: number) {
  const uri = asset.localUri ?? asset.uri;
  if (asset.mediaType === MediaLibrary.MediaType.video) {
    return { uri, name: asset.filename ?? `media_${index}.mp4`, type: "video/mp4" };
  }
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: 1920 });
  const image = await context.renderAsync();
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

      if (selectedAssets.length >= MAX_FILES) return;

      const info = await MediaLibrary.getAssetInfoAsync(asset);
      const uri = info.localUri ?? info.uri;
      const size = new File(uri).size;

      if (size > MAX_FILE_SIZE) {
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
