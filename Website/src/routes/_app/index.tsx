import { createFileRoute } from "@tanstack/react-router";
import { PostTile } from "@/shared/components/PostTile";
import { useMobileSearchOverlay } from "@/features/app/hooks/useMobileSearchOverlay";

export const Route = createFileRoute("/_app/")({
  component: HomePage,
});

function HomePage() {
  const { isMobileSearchOverlayOpen } = useMobileSearchOverlay();
  return isMobileSearchOverlayOpen ? (
    <div>Overlay</div>
  ) : (
    <>
      <PostTile />
      <PostTile />
      <PostTile />
      <PostTile />
      <PostTile />
    </>
  );
}
