import { useMobileSearchOverlay } from "@/hooks/app/useMobileSearchOverlay";

export function MobileSearchOverlayContent() {
  const { closeOverlay } = useMobileSearchOverlay();
  return (
    <div>
      <button onClick={closeOverlay}>Click me!</button>
    </div>
  );
}
