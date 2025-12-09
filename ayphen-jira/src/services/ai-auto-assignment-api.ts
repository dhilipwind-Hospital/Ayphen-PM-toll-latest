import axios from 'axios';

const API_BASE_URL = 'http://localhost:8500/api';

export const aiAutoAssignmentApi = {
  /**
   * Get AI assignment suggestion for an issue
   */
  suggest: (issueId: string) =>
    axios.post(`${API_BASE_URL}/ai-auto-assignment/suggest/${issueId}`),

  /**
   * Auto-assign issue (get suggestion and apply)
   */
  assign: (issueId: string, autoApply: boolean = true) =>
    axios.post(`${API_BASE_URL}/ai-auto-assignment/assign/${issueId}`, { autoApply }),

  /**
   * Bulk suggest assignments for multiple issues
   */
  bulkSuggest: (issueIds: string[]) =>
    axios.post(`${API_BASE_URL}/ai-auto-assignment/bulk-suggest`, { issueIds }),

  /**
   * Bulk assign multiple issues
   */
  bulkAssign: (issueIds: string[]) =>
    axios.post(`${API_BASE_URL}/ai-auto-assignment/bulk-assign`, { issueIds }),

  /**
   * Record feedback for learning
   */
  recordFeedback: (data: {
    issueId: string;
    recommendedUserId: string;
    actualUserId: string;
    wasAccepted: boolean;
  }) =>
    axios.post(`${API_BASE_URL}/ai-auto-assignment/feedback`, data),

  /**
   * Get auto-assignment statistics
   */
  getStats: (projectId: string) =>
    axios.get(`${API_BASE_URL}/ai-auto-assignment/stats/${projectId}`),
};
