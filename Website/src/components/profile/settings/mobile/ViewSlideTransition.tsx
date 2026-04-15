import { useState, type ReactNode } from "react";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { keyframes } from "@mui/material/styles";

export type SlideDirection = "forward" | "backward";

type ViewTransitionState<TView extends string> = {
  from: TView;
  to: TView;
  direction: SlideDirection;
};

type ViewSlideTransitionProps<TView extends string> = {
  view: TView;
  direction: SlideDirection;
  durationMs?: number;
  easing?: string;
  views: Record<TView, ReactNode>;
};

const slideOutToLeft = keyframes`
  from { transform: translateX(0%); }
  to { transform: translateX(-100%); }
`;

const slideInFromRight = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0%); }
`;

const slideOutToRight = keyframes`
  from { transform: translateX(0%); }
  to { transform: translateX(100%); }
`;

const slideInFromLeft = keyframes`
  from { transform: translateX(-100%); }
  to { transform: translateX(0%); }
`;

export function ViewSlideTransition<TView extends string>({
  view,
  direction,
  durationMs = 300,
  easing = "cubic-bezier(0.22, 1, 0.36, 1)",
  views,
}: ViewSlideTransitionProps<TView>) {
  const [displayedView, setDisplayedView] = useState<TView>(view);
  const transition: ViewTransitionState<TView> | null =
    displayedView === view
      ? null
      : {
          from: displayedView,
          to: view,
          direction,
        };

  const fromAnimation =
    transition?.direction === "forward" ? `${slideOutToLeft}` : `${slideOutToRight}`;

  const toAnimation =
    transition?.direction === "forward" ? `${slideInFromRight}` : `${slideInFromLeft}`;

  return (
    <Stack sx={{ height: "100%", overflow: "hidden", pointerEvents: transition ? "none" : "auto" }}>
      {transition ? (
        <Box sx={{ position: "relative", height: "100%", overflow: "hidden" }}>
          <Box
            key={`${transition.from}-to-${transition.to}-from`}
            sx={{
              position: "absolute",
              inset: 0,
              animation: `${fromAnimation} ${durationMs}ms ${easing} forwards`,
            }}
          >
            {views[transition.from]}
          </Box>

          <Box
            key={`${transition.from}-to-${transition.to}-to`}
            sx={{
              position: "absolute",
              inset: 0,
              animation: `${toAnimation} ${durationMs}ms ${easing} forwards`,
            }}
            onAnimationEnd={() => {
              setDisplayedView(transition.to);
            }}
          >
            {views[transition.to]}
          </Box>
        </Box>
      ) : (
        views[displayedView]
      )}
    </Stack>
  );
}
