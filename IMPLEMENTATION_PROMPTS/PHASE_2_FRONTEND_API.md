# Phase 2: Frontend API Client

**Estimated Time:** 30 minutes  
**Priority:** 🔥 Critical  
**Complexity:** Easy

---

## Overview

Add API client methods for project invitations to the existing `api.ts` file. This will allow frontend components to communicate with the backend invitation endpoints.

---

## Task 2.1: Add Invitation API Methods

**File:** `/ayphen-jira/src/services/api.ts`

### Instructions

Add the following code after the `projectMembersApi` definition (after line 40):

```typescript
// Project Invitations API
export const projectInvitationsApi = {
  /**
   * Get all invitations for a project
   */
  getByProject: (projectId: string) => 
    api.get(`/project-invitations/project/${projectId}`),
  
  /**
   * Create a new invitation
   */
  create: (data: {
    projectId: string;
    email: string;
    role: string;
    invitedById: string;
  }) => api.post('/project-invitations', data),
  
  /**
   * Verify invitation details (without accepting)
   */
  verify: (token: string) => 
    api.get(`/project-invitations/verify/${token}`),
  
  /**
   * Accept an invitation
   */
  accept: (token: string, userId?: string) => 
    api.post(`/project-invitations/accept/${token}`, { userId }),
  
  /**
   * Reject an invitation
   */
  reject: (token: string) => 
    api.post(`/project-invitations/reject/${token}`),
  
  /**
   * Cancel/delete an invitation
   */
  cancel: (id: string) => 
    api.delete(`/project-invitations/${id}`),
  
  /**
   * Resend invitation email
   */
  resend: (id: string) => 
    api.post(`/project-invitations/resend/${id}`),
};
```

### Full Context

The code should be inserted here in `api.ts`:

```typescript
// Project Members API
export const projectMembersApi = {
  getByProject: (projectId: string) => api.get(`/project-members/project/${projectId}`),
  getByUser: (userId: string) => api.get(`/project-members/user/${userId}`),
  checkAccess: (projectId: string, userId: string) => api.get(`/project-members/check/${projectId}/${userId}`),
  add: (data: any) => api.post('/project-members', data),
  updateRole: (id: string, data: any) => api.patch(`/project-members/${id}`, data),
  remove: (id: string) => api.delete(`/project-members/${id}`),
  bulkAdd: (data: any) => api.post('/project-members/bulk-add', data),
  bulkRemove: (data: any) => api.post('/project-members/bulk-remove', data),
  bulkUpdateRole: (data: any) => api.post('/project-members/bulk-update-role', data),
};

// 👇 ADD PROJECT INVITATIONS API HERE 👇
export const projectInvitationsApi = {
  // ... code from above
};

// Issues API
export const issuesApi = {
  // ... existing code
};
```

---

## TypeScript Types (Optional but Recommended)

For better type safety, you can create an interface file:

**File:** `/ayphen-jira/src/types/invitation.ts` (NEW FILE)

```typescript
export interface ProjectInvitation {
  id: string;
  projectId: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  invitedById: string;
  token: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  project?: {
    id: string;
    name: string;
  };
  invitedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateInvitationRequest {
  projectId: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  invitedById: string;
}

export interface AcceptInvitationRequest {
  userId?: string;
}

export interface InvitationVerifyResponse {
  id: string;
  projectId: string;
  projectName: string;
  email: string;
  role: string;
  invitedBy: {
    id: string;
    name: string;
  };
  expiresAt: Date;
  createdAt: Date;
}
```

Then update `api.ts` to use these types:

```typescript
import { CreateInvitationRequest, AcceptInvitationRequest } from '../types/invitation';

export const projectInvitationsApi = {
  getByProject: (projectId: string) => 
    api.get<ProjectInvitation[]>(`/project-invitations/project/${projectId}`),
  
  create: (data: CreateInvitationRequest) => 
    api.post<ProjectInvitation>('/project-invitations', data),
  
  verify: (token: string) => 
    api.get<InvitationVerifyResponse>(`/project-invitations/verify/${token}`),
  
  accept: (token: string, userId?: string) => 
    api.post(`/project-invitations/accept/${token}`, { userId } as AcceptInvitationRequest),
  
  reject: (token: string) => 
    api.post(`/project-invitations/reject/${token}`),
  
  cancel: (id: string) => 
    api.delete(`/project-invitations/${id}`),
  
  resend: (id: string) => 
    api.post<ProjectInvitation>(`/project-invitations/resend/${id}`),
};
```

---

## Testing

### Test 1: Import and Use in Component

Create a test component to verify the API works:

**File:** `/ayphen-jira/src/test/TestInvitationAPI.tsx` (temporary test file)

```typescript
import React, { useEffect } from 'react';
import { projectInvitationsApi } from '../services/api';

export const TestInvitationAPI: React.FC = () => {
  useEffect(() => {
    testAPI();
  }, []);

  const testAPI = async () => {
    try {
      // Test 1: Get invitations for a project
      console.log('Test 1: Getting invitations...');
      const { data: invitations } = await projectInvitationsApi.getByProject('test-project-id');
      console.log('✅ Invitations:', invitations);

      // Test 2: Create invitation
      console.log('Test 2: Creating invitation...');
      const { data: newInvitation } = await projectInvitationsApi.create({
        projectId: 'test-project-id',
        email: 'test@example.com',
        role: 'member',
        invitedById: 'test-user-id',
      });
      console.log('✅ Created:', newInvitation);

      // Test 3: Verify invitation
      console.log('Test 3: Verifying invitation...');
      const { data: verified } = await projectInvitationsApi.verify(newInvitation.token);
      console.log('✅ Verified:', verified);

    } catch (error) {
      console.error('❌ API Test Failed:', error);
    }
  };

  return <div>Check console for API test results</div>;
};
```

### Test 2: Browser Console Test

Open browser console and run:

```javascript
// Import the API
import { projectInvitationsApi } from './services/api';

// Test get invitations
projectInvitationsApi.getByProject('your-project-id')
  .then(response => console.log('Invitations:', response.data))
  .catch(error => console.error('Error:', error));

// Test create invitation
projectInvitationsApi.create({
  projectId: 'your-project-id',
  email: 'test@example.com',
  role: 'member',
  invitedById: 'your-user-id'
})
  .then(response => console.log('Created:', response.data))
  .catch(error => console.error('Error:', error));
```

### Test 3: Network Tab Verification

1. Open browser DevTools → Network tab
2. Trigger an API call from your component
3. Verify request:
   - URL: `http://localhost:8500/api/project-invitations/...`
   - Method: POST/GET/DELETE as appropriate
   - Headers: `Content-Type: application/json`
   - Response: 200 OK with expected data

---

## Error Handling

Add error handling wrapper (optional but recommended):

**File:** `/ayphen-jira/src/services/api.ts`

Add this helper function before the API definitions:

```typescript
// API Error Handler
const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error
    const message = error.response.data?.error || error.response.data?.message || 'An error occurred';
    throw new Error(message);
  } else if (error.request) {
    // Request made but no response
    throw new Error('No response from server. Please check your connection.');
  } else {
    // Something else happened
    throw new Error(error.message || 'An unexpected error occurred');
  }
};
```

Then wrap API calls:

```typescript
export const projectInvitationsApi = {
  create: async (data: CreateInvitationRequest) => {
    try {
      return await api.post('/project-invitations', data);
    } catch (error) {
      handleApiError(error);
      throw error; // Re-throw after handling
    }
  },
  // ... other methods
};
```

---

## Usage Examples

### Example 1: Create Invitation

```typescript
import { projectInvitationsApi } from '../services/api';
import { message } from 'antd';

const handleInvite = async () => {
  try {
    const { data } = await projectInvitationsApi.create({
      projectId: 'proj-123',
      email: 'colleague@example.com',
      role: 'member',
      invitedById: localStorage.getItem('userId')!,
    });
    
    message.success(`Invitation sent to ${data.email}`);
  } catch (error: any) {
    message.error(error.message || 'Failed to send invitation');
  }
};
```

### Example 2: List Pending Invitations

```typescript
import { projectInvitationsApi } from '../services/api';
import { useEffect, useState } from 'react';

const PendingInvitations = ({ projectId }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInvitations();
  }, [projectId]);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const { data } = await projectInvitationsApi.getByProject(projectId);
      const pending = data.filter(inv => inv.status === 'pending');
      setInvitations(pending);
    } catch (error) {
      console.error('Failed to load invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading ? 'Loading...' : `${invitations.length} pending invitations`}
    </div>
  );
};
```

### Example 3: Accept Invitation

```typescript
import { projectInvitationsApi } from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';

const AcceptInvitationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  const handleAccept = async () => {
    try {
      const { data } = await projectInvitationsApi.accept(token!, userId!);
      message.success('Invitation accepted!');
      navigate(`/projects/${data.project.id}`);
    } catch (error: any) {
      message.error(error.message || 'Failed to accept invitation');
    }
  };

  return (
    <button onClick={handleAccept}>Accept Invitation</button>
  );
};
```

### Example 4: Resend Invitation

```typescript
const handleResend = async (invitationId: string, email: string) => {
  try {
    await projectInvitationsApi.resend(invitationId);
    message.success(`Invitation resent to ${email}`);
  } catch (error: any) {
    message.error('Failed to resend invitation');
  }
};
```

### Example 5: Cancel Invitation

```typescript
const handleCancel = async (invitationId: string) => {
  try {
    await projectInvitationsApi.cancel(invitationId);
    message.success('Invitation cancelled');
    loadInvitations(); // Refresh list
  } catch (error: any) {
    message.error('Failed to cancel invitation');
  }
};
```

---

## Verification Checklist

After adding the API client, verify:

- [ ] File `/ayphen-jira/src/services/api.ts` updated
- [ ] `projectInvitationsApi` object exported
- [ ] All 6 methods defined (get, create, verify, accept, reject, cancel, resend)
- [ ] TypeScript types added (optional)
- [ ] No compilation errors
- [ ] API calls work in browser console
- [ ] Network requests show correct URLs

---

## Common Issues

### Issue: "Cannot find module '../services/api'"

**Solution:** Make sure you're importing from the correct path:
```typescript
import { projectInvitationsApi } from '../services/api';
// or
import { projectInvitationsApi } from '../../services/api';
// Adjust based on your component's location
```

### Issue: "Property 'projectInvitationsApi' does not exist"

**Solution:** Make sure you added the export:
```typescript
export const projectInvitationsApi = { ... };
```

### Issue: CORS error in browser

**Solution:** Backend `.env` should have:
```env
CORS_ORIGIN=http://localhost:1600
```

And backend should be running on port 8500.

---

## Success Criteria

After completing Phase 2, you should have:

- [x] `projectInvitationsApi` object in `api.ts`
- [x] All 6 API methods defined
- [x] TypeScript types (optional)
- [x] No compilation errors
- [x] Able to import and use in components

---

## Next Steps

Once Phase 2 is complete, move to:
- **Phase 3:** Frontend Components (3-4 hours)
  - InviteModal
  - PendingInvitations
  - Update ProjectMembersTab

---

**Estimated Time:** 30 minutes  
**Difficulty:** Easy  
**Dependencies:** Phase 1 (Backend Email) should be complete
