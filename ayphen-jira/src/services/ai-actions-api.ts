import axios from 'axios';
import { ENV } from '../config/env';

const API_BASE = ENV.API_URL;

export const aiActionsApi = {
  // Smart Prioritization
  analyzePriority: async (issueId: string) => {
    const response = await axios.post(`${API_BASE}/ai-smart-prioritization/analyze/${issueId}`);
    return response.data;
  },

  applySmartPriority: async (issueId: string, autoApply: boolean = true) => {
    const response = await axios.post(`${API_BASE}/ai-smart-prioritization/apply/${issueId}`, { autoApply });
    return response.data;
  },

  // AI Description Generation
  generateDescription: async (params: {
    issueType: string;
    issueSummary: string;
    userInput: string;
    projectId?: string;
    epicId?: string;
    parentIssueId?: string;
    format?: string;
  }) => {
    const response = await axios.post(`${API_BASE}/ai-description/generate`, params);
    return response.data;
  },

  quickGenerateDescription: async (params: {
    issueType: string;
    issueSummary: string;
    userInput: string;
  }) => {
    const response = await axios.post(`${API_BASE}/ai-description/quick-generate`, params);
    return response.data;
  },

  // AI Smart Features
  autoCompleteDescription: async (partialDescription: string, issueType: string) => {
    const response = await axios.post(`${API_BASE}/ai-smart/auto-complete-description`, {
      partialDescription,
      issueType
    });
    return response.data;
  },

  generateAcceptanceCriteria: async (summary: string, description: string) => {
    const response = await axios.post(`${API_BASE}/ai-smart/generate-acceptance-criteria`, {
      summary,
      description
    });
    return response.data;
  },

  // Predict Completion Time
  predictCompletion: async (issueId: string) => {
    const response = await axios.get(`${API_BASE}/ai-smart/predict-completion/${issueId}`);
    return response.data;
  },

  // Check Duplicates
  checkDuplicates: async (params: {
    summary: string;
    description?: string;
    projectId: string;
    issueType?: string;
  }) => {
    const response = await axios.post(`${API_BASE}/ai-description/check-duplicates`, params);
    return response.data;
  },
};

export default aiActionsApi;
