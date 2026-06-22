import { useEffect, useState } from "react";
import type { Asset, AssetInfo } from "expo-media-library";

// Resolving asset.getInfo() for a whole page at once floods the bridge and hangs
// scrolling. Instead resolve per visible tile: cached, bounded, and debounced.

const cache = new Map<string, AssetInfo>();
const inflight = new Map<string, Promise<AssetInfo | null>>();

const MAX_CONCURRENT = 6;
let active = 0;
const queue: (() => void)[] = [];

function acquire(): Promise<void> {
  if (active < MAX_CONCURRENT) {
    active += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => queue.push(resolve));
}

function release() {
  const next = queue.shift();
  if (next) next();
  else active -= 1;
}

export function peekAssetInfo(id: string): AssetInfo | null {
  return cache.get(id) ?? null;
}

export function getAssetInfo(asset: Asset): Promise<AssetInfo | null> {
  const hit = cache.get(asset.id);
  if (hit) return Promise.resolve(hit);

  const existing = inflight.get(asset.id);
  if (existing) return existing;

  const task = (async () => {
    await acquire();
    try {
      const info = await asset.getInfo();
      cache.set(asset.id, info);
      return info;
    } catch {
      return null;
    } finally {
      inflight.delete(asset.id);
      release();
    }
  })();

  inflight.set(asset.id, task);
  return task;
}

// Lazily resolves an asset's info for display + selection. Value is derived from the
// cache during render, so it's correct even when a cell recycles to a new asset.
export function useAssetInfo(asset: Asset): AssetInfo | null {
  const [resolved, setResolved] = useState<{ id: string; info: AssetInfo | null } | null>(null);

  useEffect(() => {
    if (peekAssetInfo(asset.id)) return;
    let alive = true;
    // Defer so tiles flicked past during a fast scroll never resolve.
    const timer = setTimeout(() => {
      getAssetInfo(asset).then((i) => {
        if (alive) setResolved({ id: asset.id, info: i });
      });
    }, 120);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [asset]);

  return peekAssetInfo(asset.id) ?? (resolved?.id === asset.id ? resolved.info : null);
}
