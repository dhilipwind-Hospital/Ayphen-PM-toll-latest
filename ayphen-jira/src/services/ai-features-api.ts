import axios from 'axios';
import { ENV } from '../config/env';

const API_BASE = ENV.API_URL;

export interface PMBotActivitySummary {
  autoAssignments: number;
  staleIssuesDetected: number;
  issuesTriaged: number;
  recentActivity: Array<{
    action: string;
    issueKey: string;
    timestamp: string;
    details: string;
  }>;
}

export interface AutoAssignResult {
  success: boolean;
  assignedTo: string;
  confidence: number;
  reasoning: string;
}

export interface StaleIssue {
  issueId: string;
  issueKey: string;
  summary: string;
  daysSinceActivity: number;
  shouldEscalate: boolean;
}

export interface StaleSweepResult {
  success: boolean;
  staleIssues: StaleIssue[];
  actionsTaken: string[];
}

export interface TriageResult {
  success: boolean;
  suggestedLabels: string[];
  suggestedPriority: string;
  suggestedEpic?: string;
  confidence: number;
  reasoning: string;
}

export interface MeetingScribeResult {
  success: boolean;
  issuesCreated: Array<{
    id: string;
    key: string;
    summary: string;
    type: string;
    description: string;
  }>;
  actionItems: Array<{
    text: string;
    assignee?: string;
    dueDate?: string;
  }>;
  decisions: string[];
  summary: string;
}

export interface PredictiveAlert {
  id: string;
  projectId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data: any;
  createdAt: string;
  dismissed: boolean;
}

export const aiFeaturesAPI = {
  // PMBot APIs
  pmbot: {
    async getActivity(projectId: string, days: number = 7): Promise<{ success: boolean; summary: PMBotActivitySummary }> {
      const response = await axios.get(
        `${API_BASE}/pmbot/activity/${projectId}?days=${days}`
      );
      return response.data;
    },

    async autoAssign(issueId: string): Promise<AutoAssignResult> {
      const response = await axios.post(
        `${API_BASE}/pmbot/auto-assign/${issueId}`
      );
      return response.data;
    },

    async staleSweep(projectId: string): Promise<StaleSweepResult> {
      const response = await axios.post(
        `${API_BASE}/pmbot/stale-sweep/${projectId}`
      );
      return response.data;
    },

    async triageIssue(issueId: string): Promise<TriageResult> {
      const response = await axios.post(
        `${API_BASE}/pmbot/triage/${issueId}`
      );
      return response.data;
    }
  },

  // Meeting Scribe APIs
  meetingScribe: {
    async processTranscript(data: {
      transcript: string;
      projectId: string;
      meetingTitle?: string;
      attendees?: string[];
    }): Promise<MeetingScribeResult> {
      const response = await axios.post(
        `${API_BASE}/meeting-scribe/process`,
        data
      );
      return response.data;
    },

    async quickProcess(notes: string, projectId: string): Promise<MeetingScribeResult> {
      const response = await axios.post(
        `${API_BASE}/meeting-scribe/quick`,
        { notes, projectId }
      );
      return response.data;
    }
  },

  // Predictive Alerts APIs
  alerts: {
    async getAlerts(projectId: string): Promise<{ success: boolean; alerts: PredictiveAlert[]; count: number }> {
      const response = await axios.get(
        `${API_BASE}/predictive-alerts/${projectId}`
      );
      return response.data;
    },

    async dismissAlert(alertId: string, userId: string): Promise<{ success: boolean; message: string }> {
      const response = await axios.post(
        `${API_BASE}/predictive-alerts/dismiss/${alertId}`,
        { userId }
      );
      return response.data;
    }
  }
};
