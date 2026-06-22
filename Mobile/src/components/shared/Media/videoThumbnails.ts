import { useEffect, useState } from "react";
import { createVideoPlayer, type VideoPlayer, type VideoThumbnail } from "expo-video";

// Poster frames are expensive (each spins up a native player), so cache results
// and cap how many generate at once to keep memory bounded.

const cache = new Map<string, VideoThumbnail>();
const inflight = new Map<string, Promise<VideoThumbnail | null>>();

const MAX_CONCURRENT = 3;
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
  if (next) next(); // hand the slot to the next waiter
  else active -= 1;
}

// generateThumbnailsAsync returns nothing until the asset has loaded, so wait for
// readyToPlay (with a fallback timeout) before asking for a frame.
function waitUntilReady(player: VideoPlayer, timeoutMs = 8000): Promise<void> {
  if (player.status === "readyToPlay") return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout>;
    const settle = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      sub.remove();
      if (err) reject(err);
      else resolve();
    };
    const sub = player.addListener("statusChange", ({ status, error }) => {
      if (status === "readyToPlay") settle();
      else if (status === "error") settle(new Error(error?.message ?? "player error"));
    });
    timer = setTimeout(() => settle(), timeoutMs);
  });
}

// id is the ph:// reference; PHAsset URIs load via the default player constructor.
export function getVideoThumbnail(id: string): Promise<VideoThumbnail | null> {
  const cached = cache.get(id);
  if (cached) return Promise.resolve(cached);

  const existing = inflight.get(id);
  if (existing) return existing;

  const task = (async () => {
    await acquire();
    let player: ReturnType<typeof createVideoPlayer> | undefined;
    try {
      player = createVideoPlayer({ uri: id });
      await waitUntilReady(player);
      const thumbs = await player.generateThumbnailsAsync(0, { maxWidth: 300 });
      const thumb = thumbs[0];
      if (thumb) cache.set(id, thumb);
      return thumb ?? null;
    } catch (e) {
      console.warn("[vthumb] failed:", id, e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      player?.release();
      inflight.delete(id);
      release();
    }
  })();

  inflight.set(id, task);
  return task;
}

export function peekVideoThumbnail(id: string): VideoThumbnail | null {
  return cache.get(id) ?? null;
}

// Returns the cached/generated poster frame for a video, or null while loading / for non-videos.
// Value is derived from the cache during render, so it's correct even when a cell recycles.
export function useVideoThumbnail(id: string, isVideo: boolean): VideoThumbnail | null {
  const [resolved, setResolved] = useState<{ id: string; thumb: VideoThumbnail | null } | null>(
    null,
  );

  useEffect(() => {
    if (!isVideo || peekVideoThumbnail(id)) return;
    let alive = true;
    // Defer so videos flicked past during a fast scroll never spin up a player.
    const timer = setTimeout(() => {
      getVideoThumbnail(id).then((t) => {
        if (alive) setResolved({ id, thumb: t });
      });
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [id, isVideo]);

  if (!isVideo) return null;
  return peekVideoThumbnail(id) ?? (resolved?.id === id ? resolved.thumb : null);
}
