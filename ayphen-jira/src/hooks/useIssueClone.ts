import { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import axios from 'axios';
import type { Issue } from '../types';

interface CloneOptions {
  linkToOriginal?: boolean;
  includeAttachments?: boolean;
  includeComments?: boolean;
  includeSubtasks?: boolean;
  customSummary?: string;
}

export const useIssueClone = () => {
  const [isCloning, setIsCloning] = useState(false);
  const { success, error } = useToast();

  const cloneIssue = async (
    issueId: string,
    options: CloneOptions = {}
  ): Promise<Issue | null> => {
    setIsCloning(true);

    try {
      // Fetch original issue
      const { data: originalIssue } = await axios.get<Issue>(`/api/issues/${issueId}`);

      // Prepare cloned issue data
      const clonedData = {
        ...originalIssue,
        id: undefined, // Let backend generate new ID
        key: undefined, // Let backend generate new key
        summary: options.customSummary || `Copy of ${originalIssue.summary}`,
        createdAt: undefined,
        updatedAt: undefined,
        // Optional fields based on options
        attachments: options.includeAttachments ? originalIssue.attachments : [],
        comments: options.includeComments ? originalIssue.comments : [],
        subtasks: options.includeSubtasks ? originalIssue.subtasks : [],
      };

      // Create cloned issue
      const { data: clonedIssue } = await axios.post<Issue>('/api/issues', clonedData);

      // Link to original if requested
      if (options.linkToOriginal) {
        await axios.post(`/api/issues/${clonedIssue.id}/links`, {
          type: 'clones',
          targetIssueId: originalIssue.id,
        });
      }

      success(`Issue cloned successfully: ${clonedIssue.key}`);
      return clonedIssue;
    } catch (err) {
      error('Failed to clone issue');
      console.error(err);
      return null;
    } finally {
      setIsCloning(false);
    }
  };

  return {
    cloneIssue,
    isCloning,
  };
};
