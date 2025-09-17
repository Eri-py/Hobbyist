import { useAuth } from "@/hooks/app/useAuth";
import { useRouteSetup } from "@/hooks/app/useRouteSetup";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/profile/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isAuthenticated } = useAuth();

  useRouteSetup({
    activeNavigationTab: "",
    desktopSearchBar: <div></div>,
    desktopRightButtonGroup: <div></div>,
    mobileSearchOverlay: <div></div>,
  });

  return isAuthenticated ? <div>Page not found</div> : <div>Please login</div>;
}
