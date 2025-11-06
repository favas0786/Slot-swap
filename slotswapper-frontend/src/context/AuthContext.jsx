import React, { createContext, useReducer, useEffect, useState }from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { io } from "socket.io-client";
import setAuthToken from '../utils/setAuthToken';

// --- This URL should be your backend API ---
// Make sure your backend is running on http://localhost:5000
const API_URL = "http://localhost:5000";

// 1. Initial State
const initialState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('token'),
};

// 2. Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      const token = action.payload.token;
      localStorage.setItem('token', token);
      setAuthToken(token);
      return {
        ...state,
        isAuthenticated: true,
        user: jwtDecode(token).user,
        token: token,
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      setAuthToken(null);
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
      };
    default:
      return state;
  }
};

// 3. Create Context
export const AuthContext = createContext(initialState);

// 4. Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [socket, setSocket] = useState(null);

  // Check for token on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        setAuthToken(token);
        const decoded = jwtDecode(token);
        // You can add token expiration check here
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { token: token },
        });
      } catch (err) {
        console.error("Token invalid, logging out");
        dispatch({ type: 'LOGOUT' });
      }
    }
  }, []);

  // Socket.io connection logic
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      const newSocket = io(API_URL);
      setSocket(newSocket);

      newSocket.emit("addUser", state.user.id);
      
      newSocket.on("connect", () => {
        console.log("Socket.io connected:", newSocket.id);
      });

      return () => {
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [state.isAuthenticated, state.user]);


  // --- Actions ---
  const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: res.data,
    });
  };

  const signup = async (name, email, password) => {
    const res = await axios.post(`${API_URL}/api/auth/signup`, { name, email, password });
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: res.data,
    });
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        socket,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};