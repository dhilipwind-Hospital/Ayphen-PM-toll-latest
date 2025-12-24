import axios from 'axios';
import { ENV } from '../config/env';

const API_BASE = `${ENV.API_URL}/ai-insights`;

export const aiInsightsApi = {
  analyzeFlakyTest: (testCaseId: string) => 
    axios.post(`${API_BASE}/analyze-flaky-test`, { testCaseId }),
  
  predictFailure: (testCaseId: string, recentChanges: string[]) =>
    axios.post(`${API_BASE}/predict-failure`, { testCaseId, recentChanges }),
  
  suggestOptimization: (testCaseId: string, executionTime: number) =>
    axios.post(`${API_BASE}/suggest-optimization`, { testCaseId, executionTime }),
  
  generateTestData: (testCaseId: string, environment: string) =>
    axios.post(`${API_BASE}/generate-test-data`, { testCaseId, environment }),
  
  identifyCoverageGaps: (projectId?: string) =>
    axios.post(`${API_BASE}/identify-coverage-gaps`, { projectId }),
  
  chat: (question: string, context: any) =>
    axios.post(`${API_BASE}/chat`, { question, context }),
  
  smartTestSelection: (changedFiles: string[], projectId?: string) =>
    axios.post(`${API_BASE}/smart-test-selection`, { changedFiles, projectId }),
};
