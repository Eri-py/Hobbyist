# Conventions

## Comments
- Keep them short — one line, ideally under ~100 chars. Two lines only when truly needed.
- Explain *why*, not *what* the code already says. Skip the comment if the code is self-evident.
- No multi-line block comments restating the obvious.

## Responsive styling (Website)
- Never use MUI breakpoint shorthands (`xs`, `sm`, `md`, `lg`, `xl`) in `sx` or `Grid`.
- Branch on `isDesktop` from `useDeviceType` instead, so the desktop/laptop threshold stays defined in one place.
- Constant spacing scalars (`p: 3`) are fine — only breakpoint *keys* are banned.
