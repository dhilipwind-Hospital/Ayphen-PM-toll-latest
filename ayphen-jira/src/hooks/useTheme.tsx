import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1a1a1a' : '#ffffff');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Theme colors
export const lightTheme = {
  // Background
  bgPrimary: '#ffffff',
  bgSecondary: '#f5f5f5',
  bgTertiary: '#fafafa',
  bgHover: '#f0f0f0',
  
  // Text
  textPrimary: '#262626',
  textSecondary: '#595959',
  textTertiary: '#8c8c8c',
  textDisabled: '#bfbfbf',
  
  // Border
  border: '#d9d9d9',
  borderLight: '#f0f0f0',
  
  // Brand
  primary: '#1890ff',
  primaryHover: '#40a9ff',
  primaryActive: '#096dd9',
  
  // Status
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff',
  
  // Shadow
  shadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  shadowLarge: '0 4px 16px rgba(0, 0, 0, 0.12)',
};

export const darkTheme = {
  // Background
  bgPrimary: '#1a1a1a',
  bgSecondary: '#2a2a2a',
  bgTertiary: '#333333',
  bgHover: '#3a3a3a',
  
  // Text
  textPrimary: '#e0e0e0',
  textSecondary: '#b0b0b0',
  textTertiary: '#808080',
  textDisabled: '#505050',
  
  // Border
  border: '#3a3a3a',
  borderLight: '#2a2a2a',
  
  // Brand
  primary: '#1890ff',
  primaryHover: '#40a9ff',
  primaryActive: '#096dd9',
  
  // Status
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff',
  
  // Shadow
  shadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  shadowLarge: '0 4px 16px rgba(0, 0, 0, 0.4)',
};

export const getThemeColors = (theme: Theme) => {
  return theme === 'light' ? lightTheme : darkTheme;
};
