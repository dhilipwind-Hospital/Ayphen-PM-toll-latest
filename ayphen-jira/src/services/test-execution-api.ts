import axios from 'axios';

const API_BASE = 'http://localhost:8500/api/test-execution';

// Test Runs API
export const testRunsApi = {
  create: (data: any) => axios.post(`${API_BASE}/runs`, data),
  getAll: (params?: any) => axios.get(`${API_BASE}/runs`, { params }),
  getById: (id: string) => axios.get(`${API_BASE}/runs/${id}`),
  update: (id: string, data: any) => axios.put(`${API_BASE}/runs/${id}`, data),
  abort: (id: string) => axios.post(`${API_BASE}/runs/${id}/abort`),
};

// Test Results API
export const testResultsApi = {
  create: (data: any) => axios.post(`${API_BASE}/results`, data),
  getAll: (params?: any) => axios.get(`${API_BASE}/results`, { params }),
  update: (id: string, data: any) => axios.put(`${API_BASE}/results/${id}`, data),
  createDefect: (id: string, data?: any) => axios.post(`${API_BASE}/results/${id}/create-defect`, data),
  linkDefect: (id: string, data: any) => axios.post(`${API_BASE}/results/${id}/link-defect`, data),
};

// Test Cycles API
export const testCyclesApi = {
  create: (data: any) => axios.post(`${API_BASE}/cycles`, data),
  getAll: (params?: any) => axios.get(`${API_BASE}/cycles`, { params }),
  getById: (id: string) => axios.get(`${API_BASE}/cycles/${id}`),
  update: (id: string, data: any) => axios.put(`${API_BASE}/cycles/${id}`, data),
};

// Test Data API
export const testDataApi = {
  create: (data: any) => axios.post(`${API_BASE}/test-data`, data),
  getAll: (params?: any) => axios.get(`${API_BASE}/test-data`, { params }),
};
