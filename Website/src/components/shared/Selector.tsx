import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { useMemo } from "react";

type MenuItem = {
  id: string;
  label: string;
};

type SelectorProps = {
  label: string;
  menuItems: MenuItem[];
  value: string;
  onChange: (value: string) => void;
  flex?: number;
};

export function Selector({ label, menuItems, value, onChange, flex }: SelectorProps) {
  const menuElements = useMemo(
    () =>
      menuItems.map((item) => (
        <MenuItem key={item.id} value={item.id}>
          {item.label}
        </MenuItem>
      )),
    [menuItems],
  );
  return (
    <FormControl fullWidth sx={{ flex: flex }}>
      <InputLabel id="label">{label}</InputLabel>
      <Select
        labelId="label"
        value={value || ""}
        label={label}
        onChange={(e) => onChange(e.target.value)}
      >
        {menuElements}
      </Select>
    </FormControl>
  );
}
