import axios from 'axios';

const API_BASE_URL = 'http://localhost:8500/api';

export const analyticsApi = {
  getProjectAnalytics: (projectId: string) =>
    axios.get(`${API_BASE_URL}/analytics/project/${projectId}`),
  
  getUserPerformance: (userId: string) =>
    axios.get(`${API_BASE_URL}/analytics/user/${userId}`),
  
  getSprintVelocity: (projectId: string) =>
    axios.get(`${API_BASE_URL}/analytics/velocity/${projectId}`),
};

export const timeTrackingApi = {
  logWork: (data: {
    issueId: string;
    userId: string;
    timeSpent: string;
    description: string;
    date?: Date;
  }) => axios.post(`${API_BASE_URL}/time-tracking/log`, data),
  
  getIssueWorkLogs: (issueId: string) =>
    axios.get(`${API_BASE_URL}/time-tracking/issue/${issueId}`),
  
  getUserTimeReport: (userId: string, startDate?: string, endDate?: string) =>
    axios.get(`${API_BASE_URL}/time-tracking/user/${userId}`, {
      params: { startDate, endDate }
    }),
};
