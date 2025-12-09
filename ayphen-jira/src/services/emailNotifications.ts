import axios from 'axios';

const API_URL = 'https://ayphen-pm-toll-latest.onrender.com/api';

export const emailNotifications = {
  // Send issue assignment notification
  sendIssueAssigned: async (issueId: string, assigneeEmail: string) => {
    return axios.post(`${API_URL}/notifications-v2/email/send`, {
      to: assigneeEmail,
      subject: 'New Issue Assigned to You',
      template: 'issue_assigned',
      data: { issueId },
    });
  },

  // Send comment notification
  sendCommentAdded: async (issueId: string, userEmail: string, comment: string) => {
    return axios.post(`${API_URL}/notifications-v2/email/send`, {
      to: userEmail,
      subject: 'New Comment on Your Issue',
      template: 'comment_added',
      data: { issueId, comment },
    });
  },

  // Send status change notification
  sendStatusChanged: async (issueId: string, userEmail: string, oldStatus: string, newStatus: string) => {
    return axios.post(`${API_URL}/notifications-v2/email/send`, {
      to: userEmail,
      subject: 'Issue Status Updated',
      template: 'status_changed',
      data: { issueId, oldStatus, newStatus },
    });
  },

  // Send sprint started notification
  sendSprintStarted: async (sprintId: string, teamEmails: string[]) => {
    return axios.post(`${API_URL}/notifications-v2/bulk`, {
      userIds: teamEmails,
      notification: {
        type: 'sprint_started',
        title: 'Sprint Started',
        message: 'A new sprint has been started',
        data: { sprintId },
      },
    });
  },

  // Send daily digest
  sendDailyDigest: async (userEmail: string) => {
    return axios.get(`${API_URL}/notifications-v2/digest`, {
      params: { userId: userEmail, period: 'daily' },
    });
  },

  // Subscribe to notifications
  subscribe: async (userId: string, eventTypes: string[], projectIds: string[]) => {
    return axios.post(`${API_URL}/notifications-v2/subscribe`, {
      userId,
      eventTypes,
      projectIds,
    });
  },

  // Unsubscribe from notifications
  unsubscribe: async (userId: string, subscriptionId: string) => {
    return axios.post(`${API_URL}/notifications-v2/unsubscribe`, {
      userId,
      subscriptionId,
    });
  },
};
