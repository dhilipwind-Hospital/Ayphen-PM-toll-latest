// Enterprise Theme Colors for Ayphen Jira
export const colors = {
  // Primary Enterprise Colors - Light Pink
  primary: {
    50: '#FDF2F8',
    100: '#FCE7F3',
    200: '#FBCFE8',
    300: '#F9A8D4',
    400: '#F472B6',
    500: '#EC4899', // Main primary - Light Pink
    600: '#DB2777',
    700: '#BE185D',
    800: '#9D174D',
    900: '#831843',
  },
  
  // Secondary/Accent Colors - Soft Pink
  secondary: {
    50: '#FDF2F8',
    100: '#FCE7F3',
    200: '#FBCFE8',
    300: '#F9A8D4',
    400: '#F472B6',
    500: '#F8BBD0', // Soft pink accent
    600: '#F06292',
    700: '#E91E63',
    800: '#C2185B',
    900: '#AD1457',
  },
  
  // Neutral/Gray Scale
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    1000: '#000000',
  },
  
  // Status Colors
  status: {
    success: {
      light: '#E8F5E9',
      main: '#4CAF50',
      dark: '#2E7D32',
    },
    warning: {
      light: '#FFF3E0',
      main: '#FF9800',
      dark: '#E65100',
    },
    error: {
      light: '#FFEBEE',
      main: '#F44336',
      dark: '#C62828',
    },
    info: {
      light: '#E3F2FD',
      main: '#2196F3',
      dark: '#1565C0',
    },
    // Workflow status colors
    todo: '#DFE1E6',
    inProgress: '#0052CC',
    done: '#00875A',
  },
  
  // Priority Colors
  priority: {
    highest: '#D32F2F',
    high: '#F44336',
    medium: '#FF9800',
    low: '#4CAF50',
    lowest: '#2196F3',
  },
  
  // Issue Type Colors
  issueType: {
    epic: '#EC4899',
    story: '#F472B6',
    task: '#F9A8D4',
    bug: '#EF4444',
    subtask: '#FBCFE8',
  },
  
  // Background Colors - Light Pink Tinted
  background: {
    default: '#FEF7F0',
    paper: '#FFFBFA',
    elevated: '#FFFFFF',
    sidebar: '#FDF2F8',
    hover: '#FCE7F3',
    selected: '#FBCFE8',
    disabled: '#F9FAFB',
  },
  
  // Border Colors
  border: {
    light: '#E0E0E0',
    main: '#BDBDBD',
    dark: '#9E9E9E',
  },
  
  // Text Colors
  text: {
    primary: '#172B4D',
    secondary: '#5E6C84',
    disabled: '#A5ADBA',
    hint: '#8993A4',
    inverse: '#FFFFFF',
  },
  
  // Navigation Colors - Updated for Glass Header
  navigation: {
    background: 'rgba(255, 255, 255, 0.8)', // Light glass
    backgroundHover: 'rgba(236, 72, 153, 0.1)', // Soft pink hover
    text: '#172B4D', // Dark text for contrast
    textHover: '#EC4899', // Pink hover
    active: '#FCE7F3',
  },
  
  // Sidebar Colors
  sidebar: {
    background: '#FDF2F8',
    backgroundHover: '#FCE7F3',
    text: '#374151',
    textHover: '#EC4899',
    active: '#EC4899',
    activeBackground: '#FCE7F3',
  },

  // Glassmorphism System
  glass: {
    background: 'rgba(255, 255, 255, 0.7)',
    backgroundHover: 'rgba(255, 255, 255, 0.8)',
    border: 'rgba(255, 255, 255, 0.6)',
    shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
    blur: '16px',
    text: '#1F2937',
  }
};

export type Colors = typeof colors;
