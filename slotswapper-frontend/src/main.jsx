import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// 1. Import MUI components
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// 2. Create a default theme
const theme = createTheme({
  palette: {
    mode: 'light', // You can change this to 'dark' for instant dark mode
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* 3. Wrap your app in the ThemeProvider */}
      <ThemeProvider theme={theme}>
        <CssBaseline /> {/* This resets CSS for consistency */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);