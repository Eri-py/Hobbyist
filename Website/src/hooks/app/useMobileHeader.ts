import { createContext, useContext, useEffect, type ReactNode } from "react";

export type MobileHeaderContextTypes = {
  leftSlot: ReactNode;
  setLeftSlot: (left: ReactNode) => void;
  centerSlot: ReactNode;
  setCenterSlot: (center: ReactNode) => void;
  rightSlot: ReactNode;
  setRightSlot: (right: ReactNode) => void;
};

export const MobileHeaderContext = createContext<MobileHeaderContextTypes | null>(null);

export function useMobileHeader() {
  const context = useContext(MobileHeaderContext);
  if (!context) {
    throw new Error("useMobileHeader must be used within a MobileHeaderProvider.");
  }
  return context;
}

type MobileHeaderConfigTypes = {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
};
// Helper hook for routes to configure mobile header
export function useMobileHeaderConfig({ left, center, right }: MobileHeaderConfigTypes) {
  const { setLeftSlot, setCenterSlot, setRightSlot } = useMobileHeader();

  // Set and clear left slot
  useEffect(() => {
    setLeftSlot(left || null);
    return () => setLeftSlot(null);
  }, [left, setLeftSlot]);

  // Set and clear center slot
  useEffect(() => {
    setCenterSlot(center || null);
    return () => setCenterSlot(null);
  }, [center, setCenterSlot]);

  // Set and clear right slot
  useEffect(() => {
    setRightSlot(right || null);
    return () => setRightSlot(null);
  }, [right, setRightSlot]);
}
