import { Outlet } from "@tanstack/react-router";

import Stack from "@mui/material/Stack";

type CustomOutletProps = {
  padding: number;
  minHeight?: number;
};

export function CustomOutlet({ padding, minHeight }: CustomOutletProps) {
  return (
    <Stack
      component="main"
      sx={{
        flex: 1,
        minHeight: minHeight,
        overflow: "auto",
        padding: padding,
        scrollbarWidth: "none",
        msOverflowStyle: "none",

        "&::-webkit-scrollbar": {
          display: "none",
        }
      }}>
      <Outlet />
    </Stack>
  );
}
