import { useCallback, useEffect, useRef } from "react";

type UseHistoryLayerOptions = {
  stateKey: string;
  onPopOut?: () => void;
};

type UseHistoryLayerResult = {
  pushEntry: () => void;
  popEntryOr: (fallback: () => void) => void;
};

// Reads window.history.state safely and normalizes non-object states.
const getHistoryState = (): Record<string, unknown> => {
  if (typeof window === "undefined") {
    return {};
  }

  const currentState = window.history.state;

  console.log(currentState);

  if (typeof currentState === "object" && currentState !== null) {
    return currentState as Record<string, unknown>;
  }

  return {};
};

export function useHistoryLayer({
  stateKey,
  onPopOut,
}: UseHistoryLayerOptions): UseHistoryLayerResult {
  // Marker for the entry this layer pushed. Null means no active layer entry.
  const markerRef = useRef<string | null>(null);

  const isCurrentEntry = useCallback(() => {
    if (typeof window === "undefined" || markerRef.current === null) {
      return false;
    }

    const markerFromState = getHistoryState()[stateKey];

    return typeof markerFromState === "string" && markerFromState === markerRef.current;
  }, [stateKey]);

  const pushEntry = useCallback(() => {
    // Only push once per active layer to avoid duplicate history entries.
    if (typeof window === "undefined" || markerRef.current !== null) {
      return;
    }

    const marker = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const nextState = {
      ...getHistoryState(),
      [stateKey]: marker,
    };

    markerRef.current = marker;
    window.history.pushState(nextState, "");
  }, [stateKey]);

  const popEntryOr = useCallback(
    (fallback: () => void) => {
      if (typeof window === "undefined") {
        markerRef.current = null;
        fallback();
        return;
      }

      // If this layer owns the current entry, consume it via browser back.
      if (isCurrentEntry()) {
        window.history.back();
        return;
      }

      // Otherwise no matching history entry exists, so close immediately.
      markerRef.current = null;
      fallback();
    },
    [isCurrentEntry],
  );

  useEffect(() => {
    if (!onPopOut || typeof window === "undefined") {
      return;
    }

    const handlePopState = () => {
      // When our marker disappears from current state, this layer was popped.
      if (markerRef.current === null || isCurrentEntry()) {
        return;
      }

      markerRef.current = null;
      onPopOut();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isCurrentEntry, onPopOut]);

  return {
    pushEntry,
    popEntryOr,
  };
}
