import axios from 'axios';

const API_BASE_URL = 'https://ayphen-pm-toll-latest.onrender.com/api';

export const teamNotificationsApi = {
  // Send notification to team
  notifyTeam: (teamId: string, data: {
    title: string;
    message: string;
    type?: string;
    priority?: string;
    actionUrl?: string;
  }) => axios.post(`${API_BASE_URL}/team-notifications/team/${teamId}/notify`, data),

  // Get team notifications
  getTeamNotifications: (teamId: string, userId: string) => 
    axios.get(`${API_BASE_URL}/team-notifications/team/${teamId}`, { params: { userId } }),

  // Broadcast to all users
  broadcast: (data: {
    title: string;
    message: string;
    priority?: string;
    projectId?: string;
  }) => axios.post(`${API_BASE_URL}/team-notifications/broadcast`, data),
};

export const activityFeedApi = {
  // Get user activity feed
  getUserActivity: (userId: string, limit = 50, offset = 0) =>
    axios.get(`${API_BASE_URL}/activity-feed/user/${userId}`, { params: { limit, offset } }),

  // Get project activity feed
  getProjectActivity: (projectId: string, limit = 100) =>
    axios.get(`${API_BASE_URL}/activity-feed/project/${projectId}`, { params: { limit } }),

  // Log activity
  logActivity: (data: {
    userId: string;
    issueId?: string;
    projectId?: string;
    action: string;
    description: string;
    metadata?: any;
  }) => axios.post(`${API_BASE_URL}/activity-feed`, data),
};

export const mentionsApi = {
  // Process mentions in content
  processMentions: (data: {
    content: string;
    issueId: string;
    mentionedBy: string;
    context?: string;
  }) => axios.post(`${API_BASE_URL}/mentions/process`, data),

  // Get user mentions
  getUserMentions: (userId: string) =>
    axios.get(`${API_BASE_URL}/mentions/user/${userId}`),
};
