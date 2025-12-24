# Integration Gaps Verification & Implementation Prompts
## Ayphen Project Management Tool

**Review Date:** December 24, 2024  
**Status:** Verified & Prioritized

---

# Part 1: Verification of Listed Integration Gaps

## ✅ VERIFIED: These Gaps Are REAL and Need Fixing

### 🔴 1. Token Key Mismatch - **CRITICAL** ✅ CONFIRMED

| File | What It Uses | Line |
|------|--------------|------|
| `api.ts` | `localStorage.getItem('token')` | Line 16 |
| `AuthContext.tsx` | `localStorage.setItem('sessionId', ...)` | Line 79 |

**Evidence:**
```typescript
// api.ts line 16
const token = localStorage.getItem('token');

// AuthContext.tsx line 79
localStorage.setItem('sessionId', response.data.sessionId);
```

**Impact:** API calls fail silently because `api.ts` looks for `'token'` but auth stores `'sessionId'`

**Fix Required:** YES - Change `api.ts` to use `'sessionId'`

---

### 🔴 2. Hardcoded API URLs - **HIGH** ✅ CONFIRMED

| File | Hardcoded URL | Line |
|------|---------------|------|
| `api.ts` | `https://ayphen-pm-toll-latest.onrender.com` | Line 3 |
| `AuthContext.tsx` | `https://ayphen-pm-toll-latest.onrender.com/api` | Line 7 |
| `socketService.ts` | `https://ayphen-pm-toll-latest.onrender.com` | Line 5 |
| `TeamChatEnhanced.tsx` | `https://ayphen-pm-toll-latest.onrender.com` | Line 11 |
| `AutoAssignButton.tsx` | `https://ayphen-pm-toll-latest.onrender.com/api` | Line 7 |
| `PMBotDashboard.tsx` | `https://ayphen-pm-toll-latest.onrender.com/api` | Line 162 |

**Fix Required:** YES - Centralize to use `api.ts` BASE_URL or environment variable

---

### 🔴 3. Missing API Endpoints - **MIXED** ⚠️ PARTIALLY CONFIRMED

| Feature | Status | Details |
|---------|--------|---------|
| User Activity Feed | ❌ **MISSING** | No `/api/users/:id/activity` endpoint exists |
| Project Templates | ❌ **MISSING** | No `/api/project-templates` endpoint exists |
| Issue Watch/Unwatch | ✅ **EXISTS** | `watchers.ts` has full CRUD - Frontend NOT integrated |
| Bulk Issue Edit | ✅ **EXISTS** | `bulk-operations.ts` works - UI incomplete |
| Export to CSV/PDF | ✅ **EXISTS** | `issue-export.ts` works - Frontend NOT integrated |

**Fix Required:** 
- Create User Activity Feed endpoint
- Create Project Templates endpoint  
- Integrate existing endpoints with frontend

---

### 🔴 4. WebSocket Integration Gaps - **HIGH** ✅ CONFIRMED

| Event | Backend Emits | Frontend Handles | Status |
|-------|---------------|------------------|--------|
| `issue_created` | ✅ Yes | ✅ Yes (socketService.ts:67) | **Working** |
| `issue_updated` | ✅ Yes | ✅ Yes (socketService.ts:78) | **Working** |
| `issue_deleted` | ✅ Yes | ✅ Yes (socketService.ts:100) | **Working** |
| `sprint_started` | ✅ Yes | ✅ Yes (socketService.ts:106) | **Working** |
| `sprint_completed` | ✅ Yes | ✅ Yes (socketService.ts:111) | **Working** |
| `comment_added` | ✅ Yes (websocket.service.ts:439) | ⚠️ Partial | **Needs Frontend Handler** |
| `sprint_created` | ❌ No | N/A | **Missing Backend Emit** |
| `sprint_updated` | ❌ No | N/A | **Missing Backend Emit** |

**Fix Required:** YES - Add missing WebSocket events and handlers

---

### 🔴 5. AI Integration Gaps - **HIGH** ✅ CONFIRMED

| Feature | Backend | Frontend | Issue |
|---------|---------|----------|-------|
| PMBot Activity Log | ✅ API exists | ⚠️ **Uses MOCK data** | Line 168-192 in PMBotDashboard.tsx uses hardcoded mock activities |
| Meeting Scribe | ✅ Works | ⚠️ No history save | Results not persisted to DB |
| Auto-Assignment | ✅ Works | ⚠️ No enable/disable toggle | No project-level settings UI |

**Evidence (PMBotDashboard.tsx lines 167-192):**
```typescript
// Mock activities - in real implementation, fetch from backend
setActivities([
    {
        type: 'assignment',
        message: 'Assigned PROJ-123 to John Doe based on expertise match',
        timestamp: '2 minutes ago',
        issueKey: 'PROJ-123'
    },
    // ... more hardcoded mock data
]);
```

**Fix Required:** YES - Replace mocks with real API calls, add settings UI

---

### 🔴 6. Third-Party Integration Gaps - **MEDIUM** ✅ CONFIRMED

| Integration | Status | Evidence |
|-------------|--------|----------|
| Jira Sync | ❌ Incomplete | Route file exists but service not functional |
| Teams Bot | ❌ Incomplete | Route exists in `voice-integrations.ts` but not connected |
| Slack Webhook | ❌ Not started | Only entity exists, no routes |
| Redis | ⚠️ Optional | Falls back to in-memory (works but not persistent) |

**Fix Required:** OPTIONAL - These are enhancement features, not critical

---

## Summary: What MUST Be Fixed

| Priority | Gap | Impact |
|----------|-----|--------|
| 🔴 CRITICAL | Token Key Mismatch | **Auth broken for API calls** |
| 🔴 HIGH | Hardcoded URLs | **Maintenance nightmare, breaks local dev** |
| 🔴 HIGH | WebSocket Comment Handler | **Real-time comments don't update** |
| 🔴 HIGH | PMBot Mock Data | **Dashboard shows fake data** |
| 🟠 MEDIUM | Missing Endpoints | **Features incomplete** |
| 🟠 MEDIUM | Auto-Assignment Settings | **No way to configure** |
| 🟢 LOW | Third-party integrations | **Nice to have** |

---

# Part 2: Implementation Prompts (5 Prompts)

## Overview

These 5 prompts are designed to be executed **sequentially**. Each prompt builds on the previous one and ensures full frontend-backend integration without breaking existing functionality.

**Execution Order:**
1. **Prompt 1:** Fix Critical Auth & URL Issues (Foundation)
2. **Prompt 2:** Complete WebSocket Real-Time Integration
3. **Prompt 3:** Create Missing API Endpoints & Frontend Integration
4. **Prompt 4:** Fix AI Features Integration (PMBot, Auto-Assignment)
5. **Prompt 5:** Add Export Features & Watcher Integration

---

# PROMPT 1: Fix Critical Auth & URL Configuration Issues

## Objective
Fix the token key mismatch and centralize all API URLs to prevent auth failures and enable proper local development.

## Scope
- **Frontend files to modify:** 5 files
- **Backend files to modify:** 0 files
- **Risk Level:** LOW (configuration changes only)

## Detailed Instructions

### Task 1.1: Fix Token Key Mismatch in api.ts

**File:** `ayphen-jira/src/services/api.ts`

**Current Code (Line 16):**
```typescript
const token = localStorage.getItem('token');
```

**Change To:**
```typescript
const token = localStorage.getItem('sessionId');
```

**Also update Line 38:**
```typescript
// Current
localStorage.removeItem('token');

// Change to
localStorage.removeItem('sessionId');
```

### Task 1.2: Create Environment Configuration

**Create new file:** `ayphen-jira/src/config/env.ts`

```typescript
// Environment configuration - centralized API URLs
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_URL || 'https://ayphen-pm-toll-latest.onrender.com',
  get API_URL() {
    return `${this.API_BASE_URL}/api`;
  },
  get WS_URL() {
    return this.API_BASE_URL;
  },
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
};
```

### Task 1.3: Update api.ts to Use Centralized Config

**File:** `ayphen-jira/src/services/api.ts`

**Replace Lines 1-4:**
```typescript
import axios from 'axios';
import { ENV } from '../config/env';

export const BASE_URL = ENV.API_BASE_URL;
export const API_BASE_URL = ENV.API_URL;
```

### Task 1.4: Update AuthContext.tsx

**File:** `ayphen-jira/src/contexts/AuthContext.tsx`

**Replace Line 7:**
```typescript
// Current
const API_URL = 'https://ayphen-pm-toll-latest.onrender.com/api';

// Change to
import { ENV } from '../config/env';
const API_URL = ENV.API_URL;
```

### Task 1.5: Update socketService.ts

**File:** `ayphen-jira/src/services/socketService.ts`

**Replace Line 5:**
```typescript
// Current
const SOCKET_URL = 'https://ayphen-pm-toll-latest.onrender.com';

// Change to
import { ENV } from '../config/env';
const SOCKET_URL = ENV.WS_URL;
```

### Task 1.6: Update TeamChatEnhanced.tsx

**File:** `ayphen-jira/src/components/TeamChat/TeamChatEnhanced.tsx`

**Replace Line 11:**
```typescript
// Current
const WS_URL = import.meta.env.VITE_API_URL || 'https://ayphen-pm-toll-latest.onrender.com';

// Change to
import { ENV } from '../../config/env';
const WS_URL = ENV.WS_URL;
```

### Task 1.7: Update AutoAssignButton.tsx

**File:** `ayphen-jira/src/components/AI/AutoAssignButton.tsx`

**Replace Line 7:**
```typescript
// Current
const API_URL = 'https://ayphen-pm-toll-latest.onrender.com/api';

// Change to
import { ENV } from '../../config/env';
const API_URL = ENV.API_URL;
```

### Task 1.8: Update PMBotDashboard.tsx

**File:** `ayphen-jira/src/components/PMBot/PMBotDashboard.tsx`

**Replace Line 162:**
```typescript
// Current
const response = await axios.get(`https://ayphen-pm-toll-latest.onrender.com/api/pmbot/activity/${projectId}?days=7`);

// Change to
import { ENV } from '../../config/env';
// ... then in fetchPMBotData:
const response = await axios.get(`${ENV.API_URL}/pmbot/activity/${projectId}?days=7`);
```

### Task 1.9: Create .env.example File

**Create file:** `ayphen-jira/.env.example`

```env
# API Configuration
VITE_API_URL=http://localhost:8500

# For production, use:
# VITE_API_URL=https://ayphen-pm-toll-latest.onrender.com
```

## Verification Steps

1. Clear localStorage in browser
2. Login to application
3. Check localStorage has `sessionId` key
4. Verify API calls include `Authorization: Bearer <sessionId>` header
5. Verify no hardcoded URLs remain (search codebase for `ayphen-pm-toll-latest`)

## Files Modified Summary
- `ayphen-jira/src/config/env.ts` (NEW)
- `ayphen-jira/src/services/api.ts`
- `ayphen-jira/src/contexts/AuthContext.tsx`
- `ayphen-jira/src/services/socketService.ts`
- `ayphen-jira/src/components/TeamChat/TeamChatEnhanced.tsx`
- `ayphen-jira/src/components/AI/AutoAssignButton.tsx`
- `ayphen-jira/src/components/PMBot/PMBotDashboard.tsx`
- `ayphen-jira/.env.example` (NEW)

---

# PROMPT 2: Complete WebSocket Real-Time Integration

## Objective
Add missing WebSocket events for comments and sprints, and ensure frontend properly handles all real-time updates.

## Scope
- **Frontend files to modify:** 3 files
- **Backend files to modify:** 3 files
- **Risk Level:** MEDIUM (adds new functionality)

## Detailed Instructions

### Task 2.1: Add Comment WebSocket Events to Backend

**File:** `ayphen-jira-backend/src/routes/comments.ts`

**Find the POST route for creating comments and add WebSocket emit after save:**

```typescript
// After saving comment, add:
import { websocketService } from '../services/websocket.service';

// In POST '/' route, after const savedComment = await commentRepo.save(comment);
websocketService.notifyCommentAdded(savedComment, issue, savedComment.authorId);
```

### Task 2.2: Add Sprint WebSocket Events to Backend

**File:** `ayphen-jira-backend/src/routes/sprints.ts`

**Add imports at top:**
```typescript
import { websocketService } from '../services/websocket.service';
```

**After creating sprint (POST route):**
```typescript
// After const savedSprint = await sprintRepo.save(sprint);
websocketService.emitToProject(savedSprint.projectId, 'sprint_created', savedSprint);
```

**After updating sprint (PUT route):**
```typescript
// After const updatedSprint = await sprintRepo.save(sprint);
websocketService.emitToProject(updatedSprint.projectId, 'sprint_updated', updatedSprint);
```

### Task 2.3: Add WebSocket Methods to websocket.service.ts

**File:** `ayphen-jira-backend/src/services/websocket.service.ts`

**Add these methods to the WebSocketService class:**

```typescript
public emitToProject(projectId: string, event: string, data: any) {
  this.io.to(`project:${projectId}`).emit(event, data);
}

public emitSprintCreated(sprint: any) {
  this.emitToProject(sprint.projectId, 'sprint_created', sprint);
}

public emitSprintUpdated(sprint: any) {
  this.emitToProject(sprint.projectId, 'sprint_updated', sprint);
}
```

### Task 2.4: Update Frontend socketService.ts

**File:** `ayphen-jira/src/services/socketService.ts`

**Add these event listeners in setupEventListeners() method:**

```typescript
// Comment Added
this.socket.on('comment_added', (data: { comment: any, issueId: string }) => {
  // Trigger a refresh of comments for the issue
  // This will be handled by the IssueDetail component
  const event = new CustomEvent('comment_added', { detail: data });
  window.dispatchEvent(event);
});

// Sprint Created
this.socket.on('sprint_created', (sprint: any) => {
  const { addSprint, currentProject } = useStore.getState();
  if (currentProject && sprint.projectId === currentProject.id) {
    addSprint(sprint);
  }
});

// Sprint Updated
this.socket.on('sprint_updated', (sprint: any) => {
  const { updateSprint, currentProject } = useStore.getState();
  if (currentProject && sprint.projectId === currentProject.id) {
    updateSprint(sprint.id, sprint);
  }
});

// Sprint Deleted
this.socket.on('sprint_deleted', (data: { sprintId: string }) => {
  const { deleteSprint } = useStore.getState();
  deleteSprint(data.sprintId);
});
```

### Task 2.5: Update IssueDetail to Listen for Comment Events

**File:** `ayphen-jira/src/components/IssueDetail/IssueDetailPanel.tsx` (or similar)

**Add useEffect to listen for comment_added events:**

```typescript
useEffect(() => {
  const handleCommentAdded = (event: CustomEvent) => {
    if (event.detail.issueId === issue?.id) {
      // Refresh comments
      fetchComments();
    }
  };

  window.addEventListener('comment_added', handleCommentAdded as EventListener);
  return () => {
    window.removeEventListener('comment_added', handleCommentAdded as EventListener);
  };
}, [issue?.id]);
```

## Verification Steps

1. Open two browser windows with same project
2. Create a comment in Window 1 → Should appear in Window 2 automatically
3. Create a sprint in Window 1 → Should appear in Window 2 backlog
4. Update sprint dates in Window 1 → Should update in Window 2

## Files Modified Summary
- `ayphen-jira-backend/src/routes/comments.ts`
- `ayphen-jira-backend/src/routes/sprints.ts`
- `ayphen-jira-backend/src/services/websocket.service.ts`
- `ayphen-jira/src/services/socketService.ts`
- `ayphen-jira/src/components/IssueDetail/IssueDetailPanel.tsx`

---

# PROMPT 3: Create Missing API Endpoints & Frontend Integration

## Objective
Create the missing User Activity Feed and Project Templates endpoints, and integrate existing endpoints (Watchers, Export) with frontend.

## Scope
- **Frontend files to modify:** 4 files
- **Backend files to modify:** 2 files (new)
- **Risk Level:** MEDIUM (adds new features)

## Detailed Instructions

### Task 3.1: Create User Activity Feed Endpoint

**Create new file:** `ayphen-jira-backend/src/routes/user-activity.ts`

```typescript
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { AuditLog } from '../entities/AuditLog';
import { Issue } from '../entities/Issue';
import { Comment } from '../entities/Comment';

const router = Router();

// GET /api/users/:id/activity
router.get('/:id/activity', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Get recent issues created/updated by user
    const issueRepo = AppDataSource.getRepository(Issue);
    const recentIssues = await issueRepo.find({
      where: [
        { reporterId: id },
        { assigneeId: id }
      ],
      order: { updatedAt: 'DESC' },
      take: Number(limit),
      relations: ['project']
    });

    // Get recent comments by user
    const commentRepo = AppDataSource.getRepository(Comment);
    const recentComments = await commentRepo.find({
      where: { authorId: id },
      order: { createdAt: 'DESC' },
      take: Number(limit),
      relations: ['issue']
    });

    // Combine and sort by date
    const activities = [
      ...recentIssues.map(issue => ({
        type: 'issue',
        action: issue.reporterId === id ? 'created' : 'assigned',
        item: issue,
        timestamp: issue.updatedAt
      })),
      ...recentComments.map(comment => ({
        type: 'comment',
        action: 'commented',
        item: comment,
        timestamp: comment.createdAt
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, Number(limit));

    res.json({
      success: true,
      data: activities,
      total: activities.length
    });
  } catch (error: any) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

export default router;
```

**Register in index.ts:**
```typescript
import userActivityRoutes from './routes/user-activity';
app.use('/api/users', userActivityRoutes);
```

### Task 3.2: Create Project Templates Endpoint

**Create new file:** `ayphen-jira-backend/src/routes/project-templates.ts`

```typescript
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { ProjectTemplate } from '../entities/ProjectTemplate';

const router = Router();

// GET all templates
router.get('/', async (req, res) => {
  try {
    const templateRepo = AppDataSource.getRepository(ProjectTemplate);
    const templates = await templateRepo.find({
      order: { name: 'ASC' }
    });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// GET template by ID
router.get('/:id', async (req, res) => {
  try {
    const templateRepo = AppDataSource.getRepository(ProjectTemplate);
    const template = await templateRepo.findOne({
      where: { id: req.params.id }
    });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// POST create template from project
router.post('/', async (req, res) => {
  try {
    const { name, description, sourceProjectId, includeWorkflow, includeIssueTypes } = req.body;
    
    const templateRepo = AppDataSource.getRepository(ProjectTemplate);
    const template = templateRepo.create({
      name,
      description,
      sourceProjectId,
      configuration: {
        includeWorkflow,
        includeIssueTypes
      }
    });
    
    const saved = await templateRepo.save(template);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create template' });
  }
});

export default router;
```

### Task 3.3: Create ProjectTemplate Entity (if not exists)

**Create file:** `ayphen-jira-backend/src/entities/ProjectTemplate.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('project_templates')
export class ProjectTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  sourceProjectId: string;

  @Column({ type: 'jsonb', default: {} })
  configuration: {
    includeWorkflow?: boolean;
    includeIssueTypes?: boolean;
    defaultStatuses?: string[];
    defaultIssueTypes?: string[];
  };

  @Column({ default: false })
  isSystem: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Task 3.4: Add Watchers API to Frontend api.ts

**File:** `ayphen-jira/src/services/api.ts`

**Add after existing API definitions:**

```typescript
// Watchers API
export const watchersApi = {
  getByIssue: (issueId: string) => api.get(`/watchers/issue/${issueId}`),
  isWatching: (issueId: string, userId: string) => api.get(`/watchers/issue/${issueId}/user/${userId}`),
  watch: (issueId: string, userId: string) => api.post('/watchers', { issueId, userId }),
  unwatch: (issueId: string, userId: string) => api.delete('/watchers', { data: { issueId, userId } }),
};

// Export API
export const exportApi = {
  toCSV: (params: { projectId?: string; status?: string; assigneeId?: string }) => 
    api.get('/issue-export/csv', { params, responseType: 'blob' }),
  toJSON: (params: { projectId?: string; status?: string; assigneeId?: string }) => 
    api.get('/issue-export/json', { params, responseType: 'blob' }),
};

// User Activity API
export const userActivityApi = {
  getActivity: (userId: string, limit?: number) => 
    api.get(`/users/${userId}/activity`, { params: { limit } }),
};

// Project Templates API
export const projectTemplatesApi = {
  getAll: () => api.get('/project-templates'),
  getById: (id: string) => api.get(`/project-templates/${id}`),
  create: (data: any) => api.post('/project-templates', data),
};
```

### Task 3.5: Add Watch Button to Issue Detail

**File:** `ayphen-jira/src/components/IssueDetail/IssueActions.tsx` (or create new component)

```typescript
import React, { useState, useEffect } from 'react';
import { Button, Tooltip, message } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { watchersApi } from '../../services/api';
import { useStore } from '../../store/useStore';

interface WatchButtonProps {
  issueId: string;
}

export const WatchButton: React.FC<WatchButtonProps> = ({ issueId }) => {
  const [isWatching, setIsWatching] = useState(false);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useStore();

  useEffect(() => {
    if (currentUser?.id) {
      checkWatchStatus();
    }
  }, [issueId, currentUser?.id]);

  const checkWatchStatus = async () => {
    try {
      const response = await watchersApi.isWatching(issueId, currentUser!.id);
      setIsWatching(response.data.isWatching);
    } catch (error) {
      console.error('Failed to check watch status:', error);
    }
  };

  const toggleWatch = async () => {
    if (!currentUser?.id) return;
    
    setLoading(true);
    try {
      if (isWatching) {
        await watchersApi.unwatch(issueId, currentUser.id);
        message.success('Stopped watching issue');
      } else {
        await watchersApi.watch(issueId, currentUser.id);
        message.success('Now watching issue');
      }
      setIsWatching(!isWatching);
    } catch (error) {
      message.error('Failed to update watch status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title={isWatching ? 'Stop watching' : 'Watch this issue'}>
      <Button
        icon={isWatching ? <EyeOutlined /> : <EyeInvisibleOutlined />}
        onClick={toggleWatch}
        loading={loading}
        type={isWatching ? 'primary' : 'default'}
      >
        {isWatching ? 'Watching' : 'Watch'}
      </Button>
    </Tooltip>
  );
};
```

## Verification Steps

1. Navigate to user profile → Activity feed should show recent actions
2. Go to project settings → Should see option to save as template
3. Open any issue → Watch button should toggle correctly
4. Export issues → CSV/JSON download should work

## Files Modified Summary
- `ayphen-jira-backend/src/routes/user-activity.ts` (NEW)
- `ayphen-jira-backend/src/routes/project-templates.ts` (NEW)
- `ayphen-jira-backend/src/entities/ProjectTemplate.ts` (NEW if not exists)
- `ayphen-jira-backend/src/index.ts` (register routes)
- `ayphen-jira/src/services/api.ts`
- `ayphen-jira/src/components/IssueDetail/WatchButton.tsx` (NEW)

---

# PROMPT 4: Fix AI Features Integration (PMBot, Auto-Assignment)

## Objective
Replace mock data in PMBot Dashboard with real API calls, add Auto-Assignment settings UI, and persist Meeting Scribe results.

## Scope
- **Frontend files to modify:** 4 files
- **Backend files to modify:** 2 files
- **Risk Level:** MEDIUM (modifies AI features)

## Detailed Instructions

### Task 4.1: Create PMBot Activity Entity

**Create file:** `ayphen-jira-backend/src/entities/PMBotActivity.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './Project';

@Entity('pmbot_activities')
export class PMBotActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  type: 'assignment' | 'stale' | 'triage' | 'reminder';

  @Column({ type: 'text' })
  message: string;

  @Column({ nullable: true })
  issueId: string;

  @Column({ nullable: true })
  issueKey: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
```

### Task 4.2: Create PMBot Activity Routes

**Create file:** `ayphen-jira-backend/src/routes/pmbot-activity.ts`

```typescript
import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { PMBotActivity } from '../entities/PMBotActivity';
import { MoreThan } from 'typeorm';

const router = Router();

// GET activities for project
router.get('/activity/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { days = 7, limit = 50 } = req.query;

    const activityRepo = AppDataSource.getRepository(PMBotActivity);
    
    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    const activities = await activityRepo.find({
      where: {
        projectId,
        createdAt: MoreThan(since)
      },
      order: { createdAt: 'DESC' },
      take: Number(limit)
    });

    // Calculate summary
    const summary = {
      assignmentsToday: activities.filter(a => a.type === 'assignment').length,
      staleIssuesDetected: activities.filter(a => a.type === 'stale').length,
      triagesPerformed: activities.filter(a => a.type === 'triage').length
    };

    res.json({
      success: true,
      activities,
      summary
    });
  } catch (error) {
    console.error('Error fetching PMBot activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// POST log activity (internal use)
router.post('/activity', async (req, res) => {
  try {
    const { projectId, type, message, issueId, issueKey, metadata } = req.body;

    const activityRepo = AppDataSource.getRepository(PMBotActivity);
    const activity = activityRepo.create({
      projectId,
      type,
      message,
      issueId,
      issueKey,
      metadata
    });

    const saved = await activityRepo.save(activity);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

export default router;
```

### Task 4.3: Update PMBotDashboard.tsx to Use Real Data

**File:** `ayphen-jira/src/components/PMBot/PMBotDashboard.tsx`

**Replace the fetchPMBotData function (lines 160-199):**

```typescript
import { ENV } from '../../config/env';
import { api } from '../../services/api';

// ... in the component:

const fetchPMBotData = async () => {
  try {
    // Fetch real activities from backend
    const response = await api.get(`/pmbot/activity/${projectId}?days=7`);
    
    if (response.data.success) {
      setStats(response.data.summary);
      
      // Transform activities to match UI format
      const formattedActivities = response.data.activities.map((activity: any) => ({
        type: activity.type,
        message: activity.message,
        timestamp: formatRelativeTime(activity.createdAt),
        issueKey: activity.issueKey
      }));
      
      setActivities(formattedActivities);
    }
    setLoading(false);
  } catch (error) {
    console.error('Failed to fetch PMBot data:', error);
    // Fallback to empty state, not mock data
    setStats({ assignmentsToday: 0, staleIssuesDetected: 0, triagesPerformed: 0 });
    setActivities([]);
    setLoading(false);
  }
};

// Helper function for relative time
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};
```

### Task 4.4: Create Auto-Assignment Settings Component

**Create file:** `ayphen-jira/src/components/AI/AutoAssignmentSettings.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Card, Switch, Select, Slider, Button, message, Typography, Space, Divider } from 'antd';
import { RobotOutlined, SettingOutlined } from '@ant-design/icons';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';

const { Title, Text } = Typography;

interface AutoAssignmentConfig {
  enabled: boolean;
  mode: 'suggest' | 'auto';
  confidenceThreshold: number;
  considerWorkload: boolean;
  considerExpertise: boolean;
  excludeUsers: string[];
}

export const AutoAssignmentSettings: React.FC = () => {
  const { currentProject } = useStore();
  const [config, setConfig] = useState<AutoAssignmentConfig>({
    enabled: false,
    mode: 'suggest',
    confidenceThreshold: 70,
    considerWorkload: true,
    considerExpertise: true,
    excludeUsers: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentProject?.id) {
      fetchConfig();
    }
  }, [currentProject?.id]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/ai-auto-assignment/config/${currentProject?.id}`);
      if (response.data.config) {
        setConfig(response.data.config);
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await api.post(`/ai-auto-assignment/config/${currentProject?.id}`, config);
      message.success('Auto-assignment settings saved!');
    } catch (error) {
      message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card 
      title={
        <Space>
          <RobotOutlined />
          <span>Auto-Assignment Settings</span>
        </Space>
      }
      extra={<SettingOutlined />}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Text strong>Enable Auto-Assignment</Text>
          <Switch
            checked={config.enabled}
            onChange={(checked) => setConfig({ ...config, enabled: checked })}
            style={{ marginLeft: 16 }}
          />
        </div>

        <Divider />

        <div>
          <Text strong>Assignment Mode</Text>
          <Select
            value={config.mode}
            onChange={(value) => setConfig({ ...config, mode: value })}
            style={{ width: '100%', marginTop: 8 }}
            disabled={!config.enabled}
          >
            <Select.Option value="suggest">Suggest Only (Manual Approval)</Select.Option>
            <Select.Option value="auto">Fully Automatic</Select.Option>
          </Select>
        </div>

        <div>
          <Text strong>Confidence Threshold: {config.confidenceThreshold}%</Text>
          <Slider
            value={config.confidenceThreshold}
            onChange={(value) => setConfig({ ...config, confidenceThreshold: value })}
            min={50}
            max={100}
            disabled={!config.enabled}
          />
          <Text type="secondary">
            Only assign when AI confidence is above this threshold
          </Text>
        </div>

        <div>
          <Space direction="vertical">
            <div>
              <Switch
                checked={config.considerWorkload}
                onChange={(checked) => setConfig({ ...config, considerWorkload: checked })}
                disabled={!config.enabled}
              />
              <Text style={{ marginLeft: 8 }}>Consider team member workload</Text>
            </div>
            <div>
              <Switch
                checked={config.considerExpertise}
                onChange={(checked) => setConfig({ ...config, considerExpertise: checked })}
                disabled={!config.enabled}
              />
              <Text style={{ marginLeft: 8 }}>Match by expertise/skills</Text>
            </div>
          </Space>
        </div>

        <Button type="primary" onClick={saveConfig} loading={saving} block>
          Save Settings
        </Button>
      </Space>
    </Card>
  );
};
```

### Task 4.5: Add Config Endpoint to Backend

**File:** `ayphen-jira-backend/src/routes/ai-auto-assignment.ts`

**Add these routes:**

```typescript
// GET config for project
router.get('/config/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Get from project settings or return defaults
    const projectRepo = AppDataSource.getRepository(Project);
    const project = await projectRepo.findOne({ where: { id: projectId } });
    
    const config = project?.autoAssignmentConfig || {
      enabled: false,
      mode: 'suggest',
      confidenceThreshold: 70,
      considerWorkload: true,
      considerExpertise: true,
      excludeUsers: []
    };

    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

// POST save config for project
router.post('/config/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const config = req.body;

    const projectRepo = AppDataSource.getRepository(Project);
    await projectRepo.update(projectId, { autoAssignmentConfig: config });

    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save config' });
  }
});
```

### Task 4.6: Add autoAssignmentConfig to Project Entity

**File:** `ayphen-jira-backend/src/entities/Project.ts`

**Add column:**

```typescript
@Column({ type: 'jsonb', nullable: true })
autoAssignmentConfig: {
  enabled: boolean;
  mode: 'suggest' | 'auto';
  confidenceThreshold: number;
  considerWorkload: boolean;
  considerExpertise: boolean;
  excludeUsers: string[];
};
```

## Verification Steps

1. Go to PMBot Dashboard → Should show real activities (or empty state, not mock)
2. Go to Project Settings → AI tab → Auto-Assignment settings should appear
3. Toggle settings and save → Should persist on refresh
4. Create issue → If auto-assignment enabled, should trigger

## Files Modified Summary
- `ayphen-jira-backend/src/entities/PMBotActivity.ts` (NEW)
- `ayphen-jira-backend/src/entities/Project.ts` (add column)
- `ayphen-jira-backend/src/routes/pmbot-activity.ts` (NEW)
- `ayphen-jira-backend/src/routes/ai-auto-assignment.ts`
- `ayphen-jira/src/components/PMBot/PMBotDashboard.tsx`
- `ayphen-jira/src/components/AI/AutoAssignmentSettings.tsx` (NEW)

---

# PROMPT 5: Add Export Features & Complete Watcher Integration

## Objective
Add export functionality to the UI (CSV/JSON), complete watcher integration in issue detail, and add bulk operations UI.

## Scope
- **Frontend files to modify:** 5 files
- **Backend files to modify:** 0 files (endpoints exist)
- **Risk Level:** LOW (UI additions only)

## Detailed Instructions

### Task 5.1: Create Export Button Component

**Create file:** `ayphen-jira/src/components/Export/ExportButton.tsx`

```typescript
import React, { useState } from 'react';
import { Button, Dropdown, Menu, message, Modal, Checkbox, Space } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FileTextOutlined } from '@ant-design/icons';
import { exportApi } from '../../services/api';
import { useStore } from '../../store/useStore';

interface ExportButtonProps {
  projectId?: string;
  selectedIssueIds?: string[];
}

export const ExportButton: React.FC<ExportButtonProps> = ({ projectId, selectedIssueIds }) => {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const { currentProject } = useStore();

  const handleExport = async (format: 'csv' | 'json') => {
    setLoading(true);
    try {
      const params = {
        projectId: projectId || currentProject?.id
      };

      const response = format === 'csv' 
        ? await exportApi.toCSV(params)
        : await exportApi.toJSON(params);

      // Create download link
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `issues-export.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success(`Issues exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      message.error('Failed to export issues');
    } finally {
      setLoading(false);
    }
  };

  const menu = (
    <Menu>
      <Menu.Item 
        key="csv" 
        icon={<FileExcelOutlined />}
        onClick={() => handleExport('csv')}
      >
        Export as CSV
      </Menu.Item>
      <Menu.Item 
        key="json" 
        icon={<FileTextOutlined />}
        onClick={() => handleExport('json')}
      >
        Export as JSON
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={['click']}>
      <Button icon={<DownloadOutlined />} loading={loading}>
        Export
      </Button>
    </Dropdown>
  );
};
```

### Task 5.2: Create Bulk Actions Toolbar

**Create file:** `ayphen-jira/src/components/BulkActions/BulkActionsToolbar.tsx`

```typescript
import React, { useState } from 'react';
import { Button, Space, Select, Modal, message, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { bulkOperationsApi } from '../../services/api';
import styled from 'styled-components';

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 8px;
  margin-bottom: 16px;
`;

interface BulkActionsToolbarProps {
  selectedIds: string[];
  onClear: () => void;
  onComplete: () => void;
  members?: Array<{ id: string; name: string }>;
  sprints?: Array<{ id: string; name: string }>;
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedIds,
  onClear,
  onComplete,
  members = [],
  sprints = []
}) => {
  const [loading, setLoading] = useState(false);

  const handleBulkUpdate = async (updates: Record<string, any>) => {
    setLoading(true);
    try {
      await bulkOperationsApi.update({ issueIds: selectedIds, updates });
      message.success(`Updated ${selectedIds.length} issues`);
      onComplete();
    } catch (error) {
      message.error('Bulk update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    Modal.confirm({
      title: `Delete ${selectedIds.length} issues?`,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        setLoading(true);
        try {
          await bulkOperationsApi.delete({ issueIds: selectedIds });
          message.success(`Deleted ${selectedIds.length} issues`);
          onComplete();
        } catch (error) {
          message.error('Bulk delete failed');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  if (selectedIds.length === 0) return null;

  return (
    <Toolbar>
      <Tag color="blue">{selectedIds.length} selected</Tag>
      
      <Space>
        <Select
          placeholder="Change Status"
          style={{ width: 140 }}
          onChange={(status) => handleBulkUpdate({ status })}
          loading={loading}
        >
          <Select.Option value="todo">To Do</Select.Option>
          <Select.Option value="in-progress">In Progress</Select.Option>
          <Select.Option value="done">Done</Select.Option>
        </Select>

        <Select
          placeholder="Assign To"
          style={{ width: 160 }}
          onChange={(assigneeId) => handleBulkUpdate({ assigneeId })}
          loading={loading}
          allowClear
        >
          {members.map(m => (
            <Select.Option key={m.id} value={m.id}>{m.name}</Select.Option>
          ))}
        </Select>

        <Select
          placeholder="Move to Sprint"
          style={{ width: 160 }}
          onChange={(sprintId) => handleBulkUpdate({ sprintId })}
          loading={loading}
          allowClear
        >
          {sprints.map(s => (
            <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
          ))}
        </Select>

        <Button 
          danger 
          icon={<DeleteOutlined />} 
          onClick={handleBulkDelete}
          loading={loading}
        >
          Delete
        </Button>

        <Button onClick={onClear}>Clear Selection</Button>
      </Space>
    </Toolbar>
  );
};
```

### Task 5.3: Add bulkOperationsApi to api.ts

**File:** `ayphen-jira/src/services/api.ts`

**Add:**

```typescript
// Bulk Operations API
export const bulkOperationsApi = {
  update: (data: { issueIds: string[]; updates: Record<string, any> }) => 
    api.post('/bulk-operations/update', data),
  delete: (data: { issueIds: string[] }) => 
    api.post('/bulk-operations/delete', data),
  moveToSprint: (data: { issueIds: string[]; sprintId: string }) => 
    api.post('/bulk-operations/move-to-sprint', data),
};
```

### Task 5.4: Integrate WatchButton into IssueDetailPanel

**File:** `ayphen-jira/src/components/IssueDetail/IssueDetailPanel.tsx`

**Import and add WatchButton:**

```typescript
import { WatchButton } from './WatchButton';

// In the actions section of the panel:
<Space>
  <WatchButton issueId={issue.id} />
  {/* ... other action buttons */}
</Space>
```

### Task 5.5: Add Export Button to Issues List Page

**File:** `ayphen-jira/src/pages/IssuesPage.tsx` (or similar)

**Import and add:**

```typescript
import { ExportButton } from '../components/Export/ExportButton';
import { BulkActionsToolbar } from '../components/BulkActions/BulkActionsToolbar';

// In the page header:
<Space>
  <ExportButton projectId={currentProject?.id} />
  {/* ... other buttons */}
</Space>

// Above the issues table:
<BulkActionsToolbar
  selectedIds={selectedIssueIds}
  onClear={() => setSelectedIssueIds([])}
  onComplete={() => {
    setSelectedIssueIds([]);
    refreshIssues();
  }}
  members={members}
  sprints={sprints}
/>
```

## Verification Steps

1. Go to Issues page → Export button should appear
2. Click Export → CSV → File should download
3. Select multiple issues → Bulk actions toolbar appears
4. Change status for selected → All should update
5. Open issue detail → Watch button should work

## Files Modified Summary
- `ayphen-jira/src/components/Export/ExportButton.tsx` (NEW)
- `ayphen-jira/src/components/BulkActions/BulkActionsToolbar.tsx` (NEW)
- `ayphen-jira/src/components/IssueDetail/WatchButton.tsx` (from Prompt 3)
- `ayphen-jira/src/services/api.ts`
- `ayphen-jira/src/pages/IssuesPage.tsx`
- `ayphen-jira/src/components/IssueDetail/IssueDetailPanel.tsx`

---

# Summary: Complete Implementation Checklist

## Prompt Execution Order

| # | Prompt | Priority | Risk | Est. Time |
|---|--------|----------|------|-----------|
| 1 | Auth & URL Fixes | CRITICAL | LOW | 1-2 hours |
| 2 | WebSocket Integration | HIGH | MEDIUM | 2-3 hours |
| 3 | Missing Endpoints | HIGH | MEDIUM | 3-4 hours |
| 4 | AI Features Fix | HIGH | MEDIUM | 3-4 hours |
| 5 | Export & Bulk Actions | MEDIUM | LOW | 2-3 hours |

**Total Estimated Time:** 11-16 hours

## Files Created (New)

1. `ayphen-jira/src/config/env.ts`
2. `ayphen-jira/.env.example`
3. `ayphen-jira-backend/src/routes/user-activity.ts`
4. `ayphen-jira-backend/src/routes/project-templates.ts`
5. `ayphen-jira-backend/src/entities/ProjectTemplate.ts`
6. `ayphen-jira-backend/src/entities/PMBotActivity.ts`
7. `ayphen-jira-backend/src/routes/pmbot-activity.ts`
8. `ayphen-jira/src/components/IssueDetail/WatchButton.tsx`
9. `ayphen-jira/src/components/AI/AutoAssignmentSettings.tsx`
10. `ayphen-jira/src/components/Export/ExportButton.tsx`
11. `ayphen-jira/src/components/BulkActions/BulkActionsToolbar.tsx`

## Files Modified

1. `ayphen-jira/src/services/api.ts`
2. `ayphen-jira/src/contexts/AuthContext.tsx`
3. `ayphen-jira/src/services/socketService.ts`
4. `ayphen-jira/src/components/TeamChat/TeamChatEnhanced.tsx`
5. `ayphen-jira/src/components/AI/AutoAssignButton.tsx`
6. `ayphen-jira/src/components/PMBot/PMBotDashboard.tsx`
7. `ayphen-jira-backend/src/routes/comments.ts`
8. `ayphen-jira-backend/src/routes/sprints.ts`
9. `ayphen-jira-backend/src/services/websocket.service.ts`
10. `ayphen-jira-backend/src/routes/ai-auto-assignment.ts`
11. `ayphen-jira-backend/src/entities/Project.ts`
12. `ayphen-jira-backend/src/index.ts`

---

*End of Implementation Prompts*
