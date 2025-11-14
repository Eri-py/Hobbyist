import { createTheme } from "@mui/material/styles";

export const mainTheme = (isDarkMode: boolean) =>
  createTheme({
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
      },
    },
    palette: {
      mode: isDarkMode ? "dark" : "light",
      primary: {
        main: "#1565c0",
        dark: "#0d47a1",
        light: "#42a5f5",
        contrastText: "#ffffff",
      },
      secondary: {
        main: "#df2a2a",
        dark: "#b11b1b",
        light: "#ef5f5f",
        contrastText: "#ffffff",
      },
      ...(isDarkMode
        ? {
            background: {
              default: "#0f1113",
              paper: "#121418",
            },
          }
        : {
            background: {
              default: "#fafafa",
              paper: "#ffffff",
            },
          }),
    },
    components: {
      MuiSvgIcon: {
        styleOverrides: {
          root: {
            color: isDarkMode ? "white" : "black",
          },
        },
      },
      MuiButtonBase: {
        defaultProps: {
          disableTouchRipple: true,
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            borderRadius: 8,
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            margin: 0,
            textWrap: "nowrap",
            fontSize: 12,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active":
              {
                WebkitBoxShadow: "0 0 0 1000px transparent inset !important",
                transition: "background-color 5000s ease-in-out 0s",
              },
          },
        },
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      button: {
        fontWeight: 500,
      },
    },
  });
