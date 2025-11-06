import React, { useContext } from 'react';
import { Routes, Route, Navigate, Link as RouterLink } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// 1. Import MUI components
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'; // An icon

// Import Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import MarketplacePage from './pages/MarketplacePage';
import RequestsPage from './pages/RequestsPage';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const { isAuthenticated, logout } = useContext(AuthContext);

  return (
    <div>
      {/* 2. Replace <nav> with <AppBar> */}
      <AppBar position="static">
        <Toolbar>
          <SwapHorizIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            SlotSwapper
          </Typography>
          
          {/* 3. Use MUI <Button> for links */}
          {isAuthenticated ? (
            <>
              <Button color="inherit" component={RouterLink} to="/">Dashboard</Button>
              <Button color="inherit" component={RouterLink} to="/marketplace">Marketplace</Button>
              <Button color="inherit" component={RouterLink} to="/requests">My Requests</Button>
              <Button color="inherit" onClick={logout}>Logout</Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">Login</Button>
              <Button color="inherit" component={RouterLink} to="/signup">Sign Up</Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      
      {/* 4. Wrap all content in a <Container> for nice padding and centering */}
      <Container component="main" sx={{ mt: 4, mb: 4 }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/marketplace" element={<PrivateRoute><MarketplacePage /></PrivateRoute>} />
          <Route path="/requests" element={<PrivateRoute><RequestsPage /></PrivateRoute>} />
        </Routes>
      </Container>
    </div>
  );
}

export default App;