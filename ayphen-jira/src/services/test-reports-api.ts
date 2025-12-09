import axios from 'axios';

const API_BASE = 'http://localhost:8500/api/test-reports';

export const testReportsApi = {
  getSummary: (params?: any) => axios.get(`${API_BASE}/summary`, { params }),
  getTrends: (params?: any) => axios.get(`${API_BASE}/trends`, { params }),
  getPassRate: (params?: any) => axios.get(`${API_BASE}/pass-rate`, { params }),
  getFlakyTests: (params?: any) => axios.get(`${API_BASE}/flaky-tests`, { params }),
  getExecutionTime: (params?: any) => axios.get(`${API_BASE}/execution-time`, { params }),
  getDefects: (params?: any) => axios.get(`${API_BASE}/defects`, { params }),
  getCoverage: (params?: any) => axios.get(`${API_BASE}/coverage`, { params }),
};
