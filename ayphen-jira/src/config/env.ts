// Centralized Environment Configuration
// All API URLs should be imported from here to ensure consistency

const PRODUCTION_API_URL = 'https://ayphen-pm-toll-latest.onrender.com';

// Determine the API URL:
// 1. In production mode, always use production URL unless explicitly overridden
// 2. In development mode, use environment variable or default to production
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If in production mode (Vercel, etc.), use production URL
  // unless VITE_API_URL is explicitly set to a non-localhost value
  if (import.meta.env.PROD) {
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }
    return PRODUCTION_API_URL;
  }
  
  // In development mode, use env variable or default to production
  return envUrl || PRODUCTION_API_URL;
};

export const ENV = {
  // Base URL for API calls
  API_BASE_URL: getApiBaseUrl(),
  
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
