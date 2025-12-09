export const FEATURE_FLAGS = {
  AI_ASSISTANT: process.env.ENABLE_AI === 'true',
  REAL_TIME_COLLABORATION: process.env.ENABLE_REALTIME === 'true',
  ADVANCED_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
  GAMIFICATION: process.env.ENABLE_GAMIFICATION === 'true',
  BLOCKCHAIN: process.env.ENABLE_BLOCKCHAIN === 'true',
  AR_VR: process.env.ENABLE_AR_VR === 'true',
} as const;

export const isFeatureEnabled = (feature: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[feature] || false;
};