import type { ThemeConfig } from 'antd';
import { colors } from './colors';

export const antdTheme: ThemeConfig = {
  token: {
    // Primary Colors
    colorPrimary: colors.primary[500],
    colorSuccess: colors.status.success.main,
    colorWarning: colors.status.warning.main,
    colorError: colors.status.error.main,
    colorInfo: colors.status.info.main,
    
    // Text Colors
    colorText: colors.text.primary,
    colorTextSecondary: colors.text.secondary,
    colorTextDisabled: colors.text.disabled,
    
    // Background Colors
    colorBgContainer: colors.background.paper,
    colorBgElevated: colors.background.elevated,
    colorBgLayout: colors.background.default,
    
    // Border
    colorBorder: colors.border.light,
    colorBorderSecondary: colors.border.main,
    
    // Font
    fontSize: 14,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    
    // Border Radius
    borderRadius: 4,
    
    // Spacing
    controlHeight: 32,
    
    // Link
    colorLink: colors.primary[600],
    colorLinkHover: colors.primary[700],
    colorLinkActive: colors.primary[800],
  },
  components: {
    Layout: {
      headerBg: colors.navigation.background,
      headerColor: colors.navigation.text,
      headerHeight: 56,
      siderBg: colors.sidebar.background,
      bodyBg: colors.background.default,
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: colors.sidebar.activeBackground,
      itemSelectedColor: colors.sidebar.active,
      itemHoverBg: colors.sidebar.backgroundHover,
      itemHoverColor: colors.sidebar.textHover,
      itemColor: colors.sidebar.text,
    },
    Button: {
      primaryColor: colors.neutral[0],
      colorPrimary: colors.primary[500],
      colorPrimaryHover: colors.primary[600],
      colorPrimaryActive: colors.primary[700],
    },
    Input: {
      colorBorder: colors.border.light,
      colorBgContainer: colors.background.paper,
      hoverBorderColor: colors.primary[400],
      activeBorderColor: colors.primary[500],
    },
    Select: {
      colorBorder: colors.border.light,
      colorBgContainer: colors.background.paper,
    },
    Card: {
      colorBgContainer: colors.background.paper,
      colorBorderSecondary: colors.border.light,
    },
    Table: {
      headerBg: colors.background.sidebar,
      headerColor: colors.text.primary,
      rowHoverBg: colors.background.hover,
    },
    Modal: {
      headerBg: colors.background.paper,
      contentBg: colors.background.paper,
    },
    Dropdown: {
      colorBgElevated: colors.background.elevated,
    },
  },
};

export const theme = {
  colors,
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },
  breakpoints: {
    xs: '480px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    xxl: '1600px',
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};

export type Theme = typeof theme;
