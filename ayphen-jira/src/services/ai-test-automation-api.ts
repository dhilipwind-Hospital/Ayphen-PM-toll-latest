import axios from 'axios';

const API_BASE_URL = 'http://localhost:8500/api/ai-test-automation';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Requirements API
export const aiRequirementsApi = {
  getAll: () => api.get('/requirements'),
  getById: (id: string) => api.get(`/requirements/${id}`),
  create: (data: any) => api.post('/requirements', data),
  update: (id: string, data: any) => api.put(`/requirements/${id}`, data),
  delete: (id: string) => api.delete(`/requirements/${id}`),
  getVersions: (id: string) => api.get(`/requirements/${id}/versions`),
};

// Stories API
export const aiStoriesApi = {
  getAll: (params?: any) => api.get('/stories', { params }),
  getById: (id: string) => api.get(`/stories/${id}`),
  update: (id: string, data: any) => api.put(`/stories/${id}`, data),
  delete: (id: string) => api.delete(`/stories/${id}`),
};

// Test Cases API
export const aiTestCasesApi = {
  getAll: (params?: any) => api.get('/test-cases', { params }),
  getById: (id: string) => api.get(`/test-cases/${id}`),
  update: (id: string, data: any) => api.put(`/test-cases/${id}`, data),
  delete: (id: string) => api.delete(`/test-cases/${id}`),
};

// Test Suites API
export const aiTestSuitesApi = {
  getAll: (params?: any) => api.get('/suites', { params }),
  getById: (id: string) => api.get(`/suites/${id}`),
  update: (id: string, data: any) => api.put(`/suites/${id}`, data),
  delete: (id: string) => api.delete(`/suites/${id}`),
};

// Generation API
export const aiGenerationApi = {
  generateStories: (requirementId: string) => 
    api.post('/generate/stories', { requirementId }),
  generateTestCases: (storyId: string) => 
    api.post('/generate/test-cases', { storyId }),
  generateComplete: (requirementId: string) =>
    api.post('/generate/complete', { requirementId }),
};

// Sync API
export const aiSyncApi = {
  syncRequirement: (requirementId: string) => 
    api.post(`/sync/${requirementId}`),
  getChanges: (requirementId: string) => 
    api.get(`/sync/changes/${requirementId}`),
};
