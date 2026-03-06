import { useState, type ReactNode, useMemo } from "react";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import StoreOutlinedIcon from "@mui/icons-material/StoreOutlined";
import StoreIcon from "@mui/icons-material/Store";

import { useFeatureFlags } from "@hobbyist/hooks";
import { FeatureFlags } from "@hobbyist/types";
import { useNavigation } from "@/hooks/app/useNavigation";
import { MobileHeaderContext, type MobileHeaderContextTypes } from "@/hooks/app/useMobileHeader";

// Default mobile header components
const DefaultLeftSlot = () => {
  const { activeTab } = useNavigation();
  const flags = useFeatureFlags();

  if (!flags[FeatureFlags.Trade]) return <div style={{ width: 40 }} />;

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
  const flags = useFeatureFlags();

  if (!flags[FeatureFlags.Search]) return <div style={{ width: 40 }} />;

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

  const value: MobileHeaderContextTypes = useMemo(
    () => ({
      leftSlot: customLeftSlot ?? <DefaultLeftSlot />,
      centerSlot: customCenterSlot ?? <DefaultCenterSlot />,
      rightSlot: customRightSlot ?? <DefaultRightSlot />,
      setLeftSlot: setCustomLeftSlot,
      setCenterSlot: setCustomCenterSlot,
      setRightSlot: setCustomRightSlot,
    }),
    [customLeftSlot, customCenterSlot, customRightSlot],
  );

  return <MobileHeaderContext.Provider value={value}>{children}</MobileHeaderContext.Provider>;
}
