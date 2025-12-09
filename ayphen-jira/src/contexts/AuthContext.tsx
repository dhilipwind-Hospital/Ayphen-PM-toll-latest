import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { message } from 'antd';
import { useStore } from '../store/useStore';

const API_URL = 'http://localhost:8500/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  jobTitle?: string;
  department?: string;
  location?: string;
  timezone?: string;
  language?: string;
  dateFormat?: string;
  timeFormat?: string;
}

interface AuthContextType {
  user: User | null;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { setCurrentUser, setProjects, setIssues, setBoards, setSprints, setCurrentProject } = useStore();

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const sessionId = localStorage.getItem('sessionId');
    const storedUser = localStorage.getItem('user');

    if (sessionId && storedUser) {
      try {
        // Verify session is still valid
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${sessionId}` },
        });
        setUser(response.data);
        setCurrentUser(response.data); // Sync with store
      } catch (error) {
        // Session invalid, clear storage
        localStorage.removeItem('sessionId');
        localStorage.removeItem('user');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      // 🔒 Store userId separately for API calls
      localStorage.setItem('sessionId', response.data.sessionId);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('userId', response.data.user.id);
      
      setUser(response.data.user);
      setCurrentUser(response.data.user); // Sync with store
      
      console.log('✅ Login successful - userId:', response.data.user.id);
      message.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Login failed');
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
      });

      // 🔒 Store userId separately for API calls
      localStorage.setItem('sessionId', response.data.sessionId);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('userId', response.data.user.id);
      
      setUser(response.data.user);
      setCurrentUser(response.data.user); // Sync with store
      
      console.log('✅ Registration successful - userId:', response.data.user.id);
      message.success('Registration successful!');
      navigate('/dashboard');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Registration failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      if (sessionId) {
        await axios.post(`${API_URL}/auth/logout`, { sessionId });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 🔒 Clear ALL user data and store
      localStorage.removeItem('sessionId');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      localStorage.removeItem('lastProjectId'); // Clear last project
      
      setUser(null);
      setCurrentUser(null);
      
      // Clear Zustand store
      setProjects([]);
      setIssues([]);
      setBoards([]);
      setSprints([]);
      setCurrentProject(null);
      
      console.log('✅ Logged out - all data cleared (including lastProjectId)');
      message.success('Logged out successfully');
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser: user,
        setCurrentUser: setUser,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
