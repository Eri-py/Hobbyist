import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useEffect } from "react";

import Box from "@mui/material/Box";

import { useDeviceType } from "@/hooks/shared/useDeviceType";
import { useAuth } from "@hobbyist/hooks";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isDesktop } = useDeviceType();

  // Redirect authenticated users away from auth routes
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  // Don't render the form if user is authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100dvh",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <IconButton
        onClick={() => navigate({ to: "/" })}
        sx={{
          position: "absolute",
          top: isDesktop ? 32 : 16,
          left: isDesktop ? 48 : 16,
        }}
        aria-label="Back to home"
      >
        <ArrowBackIcon sx={{ fontSize: isDesktop ? 32 : 24 }} />
      </IconButton>
      <Outlet />
    </Box>
  );
}
