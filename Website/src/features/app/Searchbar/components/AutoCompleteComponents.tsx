import { type HTMLAttributes, type Key, type ReactNode } from "react";

import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import Stack from "@mui/material/Stack";
import type { SearchOption } from "../../hooks/useSearch";

type AutoCompleteOptionItemProps = {
  props: HTMLAttributes<HTMLLIElement> & { key: Key };
  option: SearchOption;
  onRemove?: (option: SearchOption) => void;
};

export const AutoCompleteOptionItem = ({
  props,
  option,
  onRemove,
}: AutoCompleteOptionItemProps) => {
  return (
    <Stack
      {...props}
      key={props.key}
      component="li"
      direction="row"
      borderRadius="2rem"
      justifyContent="space-between !important"
      maxHeight="2.5rem"
      paddingInline="0.75rem 0 !important"
    >
      <Stack direction="row" alignItems="center" gap=".5rem">
        <SearchIcon />
        {option.name}
      </Stack>
      {onRemove && (
        <IconButton
          disableRipple
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(option);
          }}
        >
          <CloseIcon />
        </IconButton>
      )}
    </Stack>
  );
};

type AutoCompleteGroupProps = {
  groupKey: number;
  groupName: string;
  inputValue: string;
  children: ReactNode;
};

export const AutoCompleteGroup = ({ groupKey, groupName, children }: AutoCompleteGroupProps) => {
  return (
    <Box key={groupKey}>
      <Typography color="primary" fontSize={"0.85rem"} paddingInline={"1rem"}>
        {groupName}
      </Typography>
      {children}
    </Box>
  );
};
