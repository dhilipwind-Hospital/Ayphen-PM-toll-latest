import { useQuery } from '@tanstack/react-query';
import { issuesApi, projectsApi } from '../services/api';

export interface IssueContextType {
    issue: any;
    project: any;
    epic: any;
    parent: any;
    isLoading: boolean;
    breadcrumbs: Array<{ label: string; path: string | null }>;
}

export const useIssueContext = (issueIdOrKey?: string): IssueContextType => {
    // 1. Fetch Issue
    const issueQuery = useQuery({
        queryKey: ['issue', issueIdOrKey],
        queryFn: async () => {
            if (!issueIdOrKey) return null;
            // Determine if input is Key (PROJECT-123) or ID (UUID)
            // Heuristic: Keys usually have a hyphen and end with numbers. UUIDs are long hex strings.
            const isKey = /^[A-Z]+-\d+$/.test(issueIdOrKey) || issueIdOrKey.includes('-');
            // Note: UUIDs also have hyphens. But Jira Keys are typically [A-Z]+-[0-9]+.
            // Let's rely on valid Key format.
            const isValidKey = /^[A-Z0-9]+-\d+$/.test(issueIdOrKey);

            const method = isValidKey ? issuesApi.getByKey : issuesApi.getById;

            try {
                const { data } = await method(issueIdOrKey);
                return data;
            } catch (error) {
                // Fallback: If getByKey fails, it might be an ID or vice versa? 
                // For now, assume the heuristic is good enough or the API handles both.
                throw error;
            }
        },
        enabled: !!issueIdOrKey,
        staleTime: 1000 * 60 * 2, // 2 mins
        retry: 1,
    });

    const issue = issueQuery.data;

    // 2. Fetch Project (Dependent)
    // projectQuery depends on issue.projectId
    const projectId = issue?.projectId;
    const projectQuery = useQuery({
        queryKey: ['project', projectId],
        queryFn: async () => {
            const { data } = await projectsApi.getById(projectId);
            return data;
        },
        enabled: !!projectId,
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    // 3. Fetch Epic (Dependent)
    // Check 'epicLink' (Key) or 'epicId' (ID).
    // If issue.epicLink exists, it is likely the Key string (e.g. "PROJ-5").
    // If issue.epicId exists, it is the UUID.
    // We prefer fetching by ID if available, else Key.
    const epicIdentifier = issue?.epicId || issue?.epicLink;
    const epicQuery = useQuery({
        queryKey: ['issue', epicIdentifier],
        queryFn: async () => {
            // If it's a key
            if (/^[A-Z0-9]+-\d+$/.test(epicIdentifier)) {
                const { data } = await issuesApi.getByKey(epicIdentifier);
                return data;
            } else {
                const { data } = await issuesApi.getById(epicIdentifier);
                return data;
            }
        },
        // Don't fetch if this issue IS the epic, or if no identifier
        enabled: !!epicIdentifier && issue?.type !== 'epic',
        staleTime: 1000 * 60 * 5,
    });

    // 4. Fetch Parent (Dependent - for subtasks)
    const parentId = issue?.parentId;
    const parentQuery = useQuery({
        queryKey: ['issue', parentId],
        queryFn: async () => {
            const { data } = await issuesApi.getById(parentId);
            return data;
        },
        enabled: !!parentId,
        staleTime: 1000 * 60 * 5,
    });

    const isLoading = issueQuery.isLoading || (!!projectId && projectQuery.isLoading) || (!!epicIdentifier && epicQuery.isLoading) || (!!parentId && parentQuery.isLoading);

    // Construct Breadcrumbs
    const breadcrumbs: Array<{ label: string; path: string | null }> = [
        { label: 'Projects', path: '/projects' }, // Adjust if needed
    ];

    if (projectQuery.data) {
        breadcrumbs.push({
            label: projectQuery.data.name,
            path: `/project/${projectQuery.data.id}`
        });
    }

    // Hierarchy Logic
    // If Epic exists, show Epic.
    // If Parent exists (Subtask), show Parent.
    // Note: A subtask might belong to a Story which belongs to an Epic.
    // In that case, we might want Epic > Parent > Subtask.
    // But currently we only fetch one level of "Epic" and "Parent".
    // If the Parent has an Epic link, we might miss it unless we recursively fetch.
    // For 'Day 1', let's stick to direct relations.

    if (epicQuery.data) {
        breadcrumbs.push({
            label: epicQuery.data.key, // Summary might be too long?
            path: `/issue/${epicQuery.data.key}`
        });
    }

    if (parentQuery.data) {
        breadcrumbs.push({
            label: parentQuery.data.key,
            path: `/issue/${parentQuery.data.key}`
        });
    }

    if (issue) {
        breadcrumbs.push({
            label: issue.key,
            path: null // Current page, not clickable
        });
    } else if (!isLoading && issueIdOrKey) {
        // If failed to load issue but we have Key, show it?
        // No, better to show nothing or error state handled by component.
    }

    return {
        issue,
        project: projectQuery.data,
        epic: epicQuery.data,
        parent: parentQuery.data,
        isLoading,
        breadcrumbs
    };
};
