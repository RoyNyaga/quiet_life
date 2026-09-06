'use client';

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#C88A79',
      light: '#D99B8B',
      dark: '#A66E5E',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#749D81',
      light: '#8BAF96',
      dark: '#587C64',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FDFBF7',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2C2420',
      secondary: '#6E5549',
    },
    divider: '#E8E2DA',
  },
  typography: {
    fontFamily: ['"Plus Jakarta Sans"', '"Outfit"', 'sans-serif'].join(','),
    h1: {
      fontFamily: ['"Playfair Display"', '"Lora"', 'serif'].join(','),
      fontWeight: 700,
      color: '#3D2E26',
    },
    h2: {
      fontFamily: ['"Playfair Display"', '"Lora"', 'serif'].join(','),
      fontWeight: 700,
      color: '#3D2E26',
    },
    h3: {
      fontFamily: ['"Playfair Display"', '"Lora"', 'serif'].join(','),
      fontWeight: 600,
      color: '#3D2E26',
    },
    h4: {
      fontFamily: ['"Playfair Display"', '"Lora"', 'serif'].join(','),
      fontWeight: 600,
      color: '#3D2E26',
    },
    h5: {
      fontFamily: ['"Playfair Display"', '"Lora"', 'serif'].join(','),
      fontWeight: 600,
      color: '#3D2E26',
    },
    h6: {
      fontFamily: ['"Playfair Display"', '"Lora"', 'serif'].join(','),
      fontWeight: 600,
      color: '#3D2E26',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(200, 138, 121, 0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          borderColor: '#E8E2DA',
          boxShadow: '0px 4px 20px rgba(112, 90, 78, 0.05)',
        },
      },
    },
  },
});
