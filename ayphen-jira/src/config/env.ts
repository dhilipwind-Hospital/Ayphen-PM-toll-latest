// Centralized Environment Configuration
// All API URLs should be imported from here to ensure consistency

export const ENV = {
  // Base URL for API calls - uses environment variable or defaults to production
  API_BASE_URL: import.meta.env.VITE_API_URL || 'https://ayphen-pm-toll-latest.onrender.com',
  
  // Computed API URL with /api suffix
  get API_URL() {
    return `${this.API_BASE_URL}/api`;
  },
  
  // WebSocket URL (same as base URL)
  get WS_URL() {
    return this.API_BASE_URL;
  },
  
  // Environment flags
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
};
