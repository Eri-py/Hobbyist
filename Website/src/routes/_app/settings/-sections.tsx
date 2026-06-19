import { type ReactNode } from "react";

import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";

export type SettingsSection = {
  label: string;
  description: string;
  to: string;
  icon: ReactNode;
};

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    label: "Account",
    description: "Email, username, password and account actions",
    to: "/settings/account",
    icon: <ManageAccountsOutlinedIcon />,
  },
  {
    label: "Profile",
    description: "Avatar, display name, location and hobbies",
    to: "/settings/profile",
    icon: <PersonOutlineOutlinedIcon />,
  },
];
