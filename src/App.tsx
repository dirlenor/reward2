import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PhoneInput from './pages/PhoneInput';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme({
  typography: {
    fontFamily: 'Kanit, sans-serif',
  },
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f0f2f5',
      paper: 'rgba(255, 255, 255, 0.8)',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '25px',
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
            },
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<PhoneInput />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
