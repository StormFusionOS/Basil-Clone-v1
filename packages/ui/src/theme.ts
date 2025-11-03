import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { alpha } from '@mui/material';

const darkPalette = {
  mode: 'dark' as const,
  primary: {
    main: '#7C5CFC',
    contrastText: '#FFFFFF'
  },
  secondary: {
    main: '#4ADE80',
    contrastText: '#050505'
  },
  background: {
    default: '#050505',
    paper: '#111827'
  },
  error: {
    main: '#F87171'
  },
  warning: {
    main: '#FBBF24'
  },
  success: {
    main: '#34D399'
  },
  text: {
    primary: '#F9FAFB',
    secondary: alpha('#F9FAFB', 0.72)
  }
};

export const theme = responsiveFontSizes(
  createTheme({
    palette: darkPalette,
    typography: {
      fontFamily:
        'Inter, "Lucida Grande", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      h4: {
        fontWeight: 600
      },
      button: {
        fontWeight: 600,
        letterSpacing: 0.6
      }
    },
    shape: {
      borderRadius: 16
    },
    spacing: 8,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: '#050505'
          }
        }
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true
        },
        styleOverrides: {
          root: {
            minHeight: 56,
            padding: '0 32px',
            borderRadius: 16
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiInputBase-root': {
              fontSize: '1.125rem',
              paddingTop: 12,
              paddingBottom: 12
            }
          }
        }
      }
    }
  })
);

export type BookForgeTheme = typeof theme;
