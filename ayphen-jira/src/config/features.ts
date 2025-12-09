export const FEATURE_FLAGS = {
  AI_ASSISTANT: import.meta.env.VITE_ENABLE_AI === 'true',
  REAL_TIME_COLLABORATION: import.meta.env.VITE_ENABLE_REALTIME === 'true',
  ADVANCED_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  GAMIFICATION: import.meta.env.VITE_ENABLE_GAMIFICATION === 'true',
  BLOCKCHAIN: import.meta.env.VITE_ENABLE_BLOCKCHAIN === 'true',
  AR_VR: import.meta.env.VITE_ENABLE_AR_VR === 'true',
} as const;

export const isFeatureEnabled = (feature: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[feature] || false;
};