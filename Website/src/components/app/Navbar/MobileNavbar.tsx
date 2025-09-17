import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import StoreOutlinedIcon from "@mui/icons-material/StoreOutlined";
import StoreIcon from "@mui/icons-material/Store";

import { NavbarContainer } from "./NavbarContainer";
import { useMobileSearchOverlay } from "@/hooks/app/useMobileSearchOverlay";
import { useNavigation } from "@/hooks/app/useNavigation";
import { useNavigationButtons } from "@/hooks/shared/useNavigationButtons";

export function MobileNavbar() {
  const { openOverlay } = useMobileSearchOverlay();
  const { activeTab } = useNavigation();
  const { handleTradeClick } = useNavigationButtons();

  return (
    <NavbarContainer>
      <Toolbar
        variant="dense"
        sx={{
          justifyContent: "space-between",
          paddingInline: "0.25rem !important",
        }}
      >
        <IconButton onClick={handleTradeClick}>
          {activeTab === "Trade" ? (
            <StoreIcon style={{ fontSize: "1.75rem" }} />
          ) : (
            <StoreOutlinedIcon style={{ fontSize: "1.75rem" }} />
          )}
        </IconButton>

        <IconButton onClick={openOverlay}>
          <SearchIcon />
        </IconButton>
      </Toolbar>
    </NavbarContainer>
  );
}
