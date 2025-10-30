import { useState, type ReactNode, useMemo } from "react";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import StoreOutlinedIcon from "@mui/icons-material/StoreOutlined";
import StoreIcon from "@mui/icons-material/Store";

import { useNavigation } from "@/hooks/app/useNavigation";
import { MobileHeaderContext, type MobileHeaderContextTypes } from "@/hooks/app/useMobileHeader";

// Default mobile header components
const DefaultLeftSlot = () => {
  const { activeTab } = useNavigation();
  return (
    <IconButton>
      {activeTab === "Trade" ? (
        <StoreIcon style={{ fontSize: 28 }} />
      ) : (
        <StoreOutlinedIcon style={{ fontSize: 28 }} />
      )}
    </IconButton>
  );
};
const DefaultCenterSlot = () => <div></div>;
const DefaultRightSlot = () => {
  return (
    <IconButton>
      <SearchIcon />
    </IconButton>
  );
};

type MobileHeaderProviderTypes = {
  children: ReactNode;
};

export function MobileHeaderProvider({ children }: MobileHeaderProviderTypes) {
  const [customLeftSlot, setCustomLeftSlot] = useState<ReactNode | null>(null);
  const [customCenterSlot, setCustomCenterSlot] = useState<ReactNode | null>(null);
  const [customRightSlot, setCustomRightSlot] = useState<ReactNode | null>(null);

  const leftSlot = customLeftSlot ?? <DefaultLeftSlot />;
  const centerSlot = customCenterSlot ?? <DefaultCenterSlot />;
  const rightSlot = customRightSlot ?? <DefaultRightSlot />;

  const value: MobileHeaderContextTypes = useMemo(
    () => ({
      leftSlot,
      centerSlot,
      rightSlot,
      setLeftSlot: setCustomLeftSlot,
      setCenterSlot: setCustomCenterSlot,
      setRightSlot: setCustomRightSlot,
    }),
    [leftSlot, centerSlot, rightSlot]
  );

  return <MobileHeaderContext.Provider value={value}>{children}</MobileHeaderContext.Provider>;
}
