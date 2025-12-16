# Combined Detailed Plan: Breadcrumbs + Week 1–Week 4+ Roadmap (No Implementation)

This document is a detailed implementation plan only.

Constraints:
- Do **not** break current implementation.
- Implement in small, isolated PRs.
- Prefer additive changes over refactors.
- Breadcrumbs must degrade gracefully when context data is missing.

---

## 0) Foundation: Global “Issue Context” (Shared Dependency)

### Goal
Create a consistent context model for any issue to support:
- Breadcrumbs in all detail views
- Enhanced Epic view
- AI Creation navigation metadata
- Linked Issues refresh and related issue navigation

### Canonical model

```ts
type IssueContext = {
  project?: { id: string; name: string };
  epic?: { id: string; key: string; summary: string };
  parent?: { id: string; key: string; summary: string; type: string };
  issue: { id: string; key: string; summary: string; type: string };
};
```

### Data sourcing strategy

#### Phase 0A (Frontend-only, lowest risk)
Compute context in the frontend using existing fields + existing APIs:
- Load current issue (already done in each detail page)
- Resolve project from store (preferred) or projects API
- If epic is linked (`epicId` / `epicLink`) fetch epic issue
- If parent exists (`parentId`) fetch parent issue

Pros:
- No backend work required
- Can ship breadcrumbs without waiting for API changes

Cons:
- May trigger multiple requests (2–4)

#### Phase 0B (Backend optimization)
Add a single endpoint to return the whole context:
- `GET /api/issues/:id/context` (or `:key/context`)

Response shape:

```json
{
  "project": { "id": "...", "name": "..." },
  "epic": { "id": "...", "key": "FIVE-2", "summary": "Auth Epic" },
  "parent": { "id": "...", "key": "FIVE-11", "summary": "Login story", "type": "story" },
  "issue": { "id": "...", "key": "FIVE-15", "summary": "Bug in login", "type": "bug" }
}
```

Pros:
- One request
- Less UI complexity

---

## 1) Breadcrumbs in all detail views (Additive UI Layer)

### What the breadcrumb shows
Render a consistent path:

```
Projects > {Project Name} > (Epic {EPIC-1}) > (Parent {STORY-2}) > {ISSUE-5}
```

Rules:
- Always show Project if available
- Show Epic if issue belongs to an epic
- Show Parent for subtask/bug-with-parent
- Last crumb is current issue (non-clickable)

### Implementation design

#### UI component
- `src/components/common/IssueBreadcrumbs.tsx`

Props:
- `context: IssueContext`
- `loading?: boolean`
- `creationBadge?: 'ai' | 'manual' | 'template' | 'cloned'` (optional)

#### Hook for data
- `useIssueBreadcrumbContext(issueIdOrKey | issue)`

Returns:
- `{ context, loading, error }`

### Integration points
Add the breadcrumb header to:
- `src/components/IssueDetail/IssueDetailPanel.tsx` (Story/Task/Bug/Subtask)
- `src/pages/EpicDetailView.tsx` (Epic)

### Routing rules
- If crumb target type is epic => route `/epic/:id`
- Else route `/issue/:key`

### Compatibility requirements
- If context resolution fails, render minimal path:
  - `Projects > IssueKey`
- Breadcrumb must never block page rendering

### Testing checklist
- Epic: `Projects > Project > Epic`
- Story with epic: `Projects > Project > Epic > Story`
- Subtask: `Projects > Project > Epic? > Parent > Subtask`
- Orphan story: `Projects > Project > Story`

---

## Week 1

### #4 Create Filter Fix (Critical)

#### Current evidence
- Filter save logic exists in `src/pages/FiltersView.tsx` using `POST /api/saved-filters`

#### Goals
- Create filter works
- Filter appears in list immediately after save
- Persisted to DB and survives refresh

#### Work items
- Validate endpoint functionality:
  - `POST /api/saved-filters`
  - `GET /api/saved-filters?ownerId=&projectId=`
  - `PUT /api/saved-filters/:id`
  - `DELETE /api/saved-filters/:id`
- Fix frontend refresh strategy:
  - After save, refetch list or optimistically append
- Add validation:
  - Ensure filter name required
  - Ensure filter config valid

#### Test cases
- Simple: status = In Progress
- Complex: status=Done AND assignee=John
- OR conditions
- Save, reload, re-apply
- Edit
- Delete

Breadcrumb impact:
- Indirect (filters link to issue detail pages; breadcrumbs show when opening issues)

---

### #11 Linked Issues UI Fix (Critical)

#### Current evidence
- Linking is performed in `src/components/IssueDetail/IssueLinkModal.tsx` via `POST /api/issue-links`
- UI not updating implies missing refetch / state update in parent

#### Goals
- After linking, linked list updates immediately without page refresh

#### Work items
- Ensure modal `onSuccess()` fires after successful link
- In parent (EpicDetailView / IssueDetailPanel):
  - On success, refetch linked issues list
  - Or append newly linked issue to local list using response payload
- Show toast success: “Linked FIVE-11 successfully”
- Update count: `Linked Issues (X)`
- Handle edge cases:
  - Already linked
  - Invalid link
  - Permission error
  - Network error

Breadcrumb impact:
- Indirect (linked issues navigate into detail pages that show breadcrumbs)

---

### #3 Remove Sprint from Create Issue Popup (Quick win)

#### Current evidence
- `CreateIssueModal.tsx` currently renders Sprint selector `Form.Item name="sprintId"`

#### Goals
- Remove Sprint field from all create flows:
  - story, bug, task, subtask, epic

#### Work items
- Remove Sprint form item from UI
- Keep backend acceptance for backward compatibility

Breadcrumb impact:
- None

---

### #2 Epic Name should be first in popup and disabled

#### Goals
When creating inside an Epic context:
- Epic Name shown first and disabled
- Prefilled with epic key + name
- Styled with background `#F0F0F0`, cursor `not-allowed`
- Lock icon or “Auto-assigned” label

#### Work items
- Detect epic context via `defaultValues` passed to `CreateIssueModal`
- Render disabled field at top of form
- Prevent edits / changes to epic in that flow

Breadcrumb impact:
- Helps ensure epic context is accurate and consistent

---

## Week 2

### #9 Exact Match Auto Detection

#### Goals
Strict detection (no fuzzy/partial matches):
- “bug” matches only standalone word boundary
- “debugging” does not match bug

#### Work items
- Centralize detection logic in a utility module
- Use regex boundaries, case-insensitive
- Only auto-fill if confidence >= 95%
- Display confidence and allow override

Breadcrumb impact:
- None

---

### #10 Bugs Auto-generated need alignment

#### Goals
AI-generated bugs follow strict markdown format:

```md
**Bug Title:**
[Component] - Brief description

**Description:**
...

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected Behavior:**
...

**Actual Behavior:**
...

**Environment:**
- Browser: ...
- OS: ...
- Version: ...

**Priority:** ...
**Severity:** ...

**Screenshots/Logs:**
...
```

#### Work items
- Create a single bug template generator function
- Ensure sections are never empty (use placeholders)
- Standardize spacing (2 line breaks between sections)

Breadcrumb impact:
- None

---

### #7 Enhanced Epic Detail View (start)

#### Goals (start)
Add new sections incrementally, without rewriting the page:
- Epic Overview: Vision, Goals, Scope, Success Criteria
- Progress visualization (counts by status)
- Child issues grouped by status

#### Data strategy
- Phase 1: store in description with structured markdown blocks (fast, no migration)
- Phase 2: add explicit fields in DB (clean long-term)

Breadcrumb impact:
- Epic pages show breadcrumbs immediately

---

## Week 3

### #7 Enhanced Epic Detail View (complete)

#### Goals (complete)
Add:
- Dependencies & blockers
- Timeline & milestones
- Team & resources
- Attachments + activity stream integration

Breadcrumb impact:
- Clicking child issues should open issue detail pages showing epic context

---

### #8 AI Creation Navigation

#### Goals
Show creation method in header:
- 🤖 AI-Generated
- ✍️ Manual
- 📋 Template
- 🔄 Cloned

Show optional AI metadata:
- Prompt
- Confidence
- Reviewed by

#### Work items
- Add optional fields to issue entity (backward compatible)
  - `creationMethod`
  - `aiPrompt`
  - `aiConfidence`
  - `reviewedBy`
- UI: show badges next to issue key and/or in breadcrumb header area

Breadcrumb impact:
- Badge can appear next to current issue crumb/title, not changing path

---

### #1 Comment Add Attachment

#### Goals
Add attachment support to comment composer:
- Paperclip button near Add Comment
- Multi file types
- Preview thumbnails
- Name/size/remove
- Drag-drop
- Upload progress bar
- Max 10MB per file

#### Architecture options
Option A (recommended): pre-upload then reference IDs
- Upload files first => attachment IDs
- Submit comment => include attachment IDs

Option B: upload with comment in one multipart request

Breadcrumb impact:
- None

---

## Week 4+

### #6 Favorites System

#### Goals
Support favorites for:
- Issues
- Filters
- Epics/Projects

#### Work items
- Backend: `favorites` table
  - `userId`, `entityType`, `entityId`, `createdAt`
- UI:
  - Star icon toggle
  - Favorites section in sidebar
  - Favorites dashboard view

Breadcrumb impact:
- Optional star button near breadcrumb/title area on detail pages

---

### #5 AI Filters & Search (Iterative)

#### Goals
Natural language to structured filters:
- “Show me high priority bugs assigned to me” => `type=bug AND priority=high AND assignee=currentUser`

#### Iteration plan
1. Rule-based parser (fast)
2. LLM-powered parser endpoint
3. Semantic search (embeddings)

Breadcrumb impact:
- Indirect (search results navigate into detail pages)

---

## Cross-cutting: Backward Compatibility Rules

- Breadcrumbs must be additive and safe; never block rendering.
- New backend fields must be optional.
- Avoid large refactors; ship in small PRs.
- Prefer:
  - new components
  - new hooks
  - new endpoints
  - minimal edits to existing pages

---

## Verification Matrix (summary)

Week 1:
- Filters CRUD works and persists
- Linked issues update instantly
- Create modal sprint removed
- Epic name locked and first in create flow
- Breadcrumb visible on epic + issue detail pages

Week 2:
- Exact match detection passes scenarios
- AI bugs follow strict template
- Epic view enhancements start

Week 3:
- Epic view complete
- AI creation metadata visible when present
- Comment attachments stable UX

 Week 4+:
 - Favorites persist across sessions
 - AI search gradually improves without breaking standard search
 
---

## Additional Enhancements to Consider (No Implementation)

### Non-Functional Requirements (NFRs)

#### Performance
- Avoid N+1 API calls where possible (Breadcrumb context is a candidate for a single context endpoint).
- Add pagination or virtualization for large lists (Backlog, Filters, Search, Epics).
- Add lightweight caching for common entities (projects/issues/sprints) to prevent repeated fetches.
- Ensure charts/widgets use a consistent data-fetch strategy (batch calls where possible).

#### Reliability
- Centralize API error handling and standardize error toasts.
- Add retry patterns for transient failures (network timeouts, 5xx).
- Cancel in-flight requests on route change to prevent stale updates.

#### Accessibility
- Ensure contrast ratios are valid (especially after theme changes).
- Standard focus states for keyboard navigation (focus ring tokens).
- Keyboard support for critical flows (modals, menus, drag-and-drop fallback).

#### Security
- Validate file uploads on backend (type, size, virus scan if required).
- Rate-limit AI endpoints and attachment upload endpoints.
- Ensure userId/session scoping is enforced server-side (do not rely only on client params).

---

### Permissions & Roles

Define role-based access up front to avoid future redesign:
- Roles: Admin, Project Admin, Member, Viewer
- Permission areas:
  - Issue create/edit/delete
  - Sprint start/complete
  - Filter create (private vs shared)
  - Link/unlink issues
  - Upload/delete attachments
  - Edit epic metadata (vision/goals/scope)

Add UX rules:
- Hide actions if unauthorized OR show disabled with tooltip.
- Standardize “permission denied” messaging.

---

### API & Data Contract Guidance

#### Issue Context endpoint (recommended)
- `GET /api/issues/:id/context` (or `:key/context`)
- Returns: `{ project?, epic?, parent?, issue }`.
- Must be backward compatible and allow missing fields.

#### Creation metadata
- Add optional fields (default to manual if absent):
  - `creationMethod` (ai/manual/template/cloned)
  - `aiPrompt`, `aiConfidence`, `reviewedBy`, `reviewedAt`

#### Favorites
- Contract:
  - `POST /api/favorites` (entityType/entityId)
  - `DELETE /api/favorites/:id` or `DELETE /api/favorites` with params
  - `GET /api/favorites?userId=&entityType=`

#### Comment attachments
- Prefer pre-upload -> IDs -> comment submit:
  - `POST /api/uploads` -> returns attachment IDs
  - `POST /api/comments` includes `attachmentIds: string[]`

---

### Testing Strategy

#### Unit tests
- Exact-match detection logic.
- Bug template generator formatting.
- AI search parser (rule-based iteration).

#### Integration tests
- Create filter -> appears immediately -> persists after reload.
- Link issue -> Linked Issues count and list update without refresh.
- Comment attachments -> upload progress -> remove -> submit -> appears.

#### E2E (Playwright)
- Navigation to Backlog/Board/Issue/Epic with stable loading.
- Create issue flows (epic locked, sprint removed).
- Filter CRUD scenarios.

---

### UX Consistency Guidelines

- Standardize toast messages (success/error wording, duration).
- Use skeletons for page-level loading; spinners for action-level loading.
- Standard empty states (icon + message + primary action).
- Confirmations for destructive actions (delete/unlink) with consistent copy.
- Consistent card/table spacing, hover, and selected states.

---

### Observability & Debugging

- Add consistent client-side logging in development only.
- Include request IDs / correlation IDs in backend responses (optional).
- Separate AI errors from generic errors to reduce user confusion.
- Track key events:
  - filter save/link/unlink
  - attachment upload success/failure
  - AI action success/failure

---

## Application Color Theme Enhancement Suggestions (No Implementation)

### What exists today (quick audit)
- A centralized palette exists in `ayphen-jira/src/theme/colors.ts` (primary pink scale, neutrals, status colors, issue type colors).
- Ant Design token configuration exists in `ayphen-jira/src/theme/theme.ts` as `antdTheme`.
- There is also a separate token setup inside `ayphen-jira/src/contexts/ThemeContext.tsx` that wraps another `ConfigProvider`.
- Some components still use hardcoded hex values and inline colors, which leads to inconsistent UI and makes dark mode harder.

### Primary recommendation: use one authoritative theme system

#### 1) Single source of truth for tokens
- Keep `colors.ts` + `theme.ts` as the authoritative token source.
- Use `ThemeContext` only for toggling and choosing the algorithm (light/dark), not redefining tokens separately.

Why:
- Multiple competing token sources can cause inconsistent styles across pages and unpredictable light/dark behavior.

#### 2) Proper dark mode tokens
- Define a complete dark palette (same shape as the light palette) rather than only swapping a few AntD tokens.
- Ensure these are consistent:
  - backgrounds (layout/container/elevated)
  - text (primary/secondary/tertiary)
  - borders (default/hover)
  - hover/selected states

### Quick wins (safe, incremental)

#### 1) Reduce hardcoded colors
- Replace repeated hardcoded values (example `#E91E63`) with `colors.primary[...]` tokens.
- Adopt a “touch-and-fix” approach: whenever a component is edited for a feature/bugfix, migrate its colors to tokens.

#### 2) Standardize semantic colors across the app
- Define one mapping for:
  - status → background + text + dot color
  - priority → icon + color
  - issue type → consistent color
- Reuse the mapping in Backlog, Board, Issue Detail, lists, and Reports.

#### 3) Consistent focus and interaction states
- Add a single focus-ring style that uses a brand-tinted color (primary with alpha).
- Ensure hover/active/disabled states are consistent for:
  - buttons
  - inputs/selects
  - clickable cards
  - menu items

#### 4) Unify surfaces (cards/panels)
- Ensure `GlassPanel` / `GlassCard` and standard `Card` share consistent:
  - background
  - border
  - hover elevation
  - shadow tokens

### Medium effort, high impact improvements

#### 1) Add a secondary accent
- Keep pink as primary, introduce a secondary accent (e.g., indigo/purple) to reduce overuse of pink.
- Use it for analytics widgets, secondary highlights, and charts.

#### 2) Chart palette standardization
- Define a chart palette derived from brand + semantic colors.
- Ensure colors are consistent for the same categories across charts (status, priority, type).
- Consider color-blind safe contrasts.

#### 3) Sidebar/topbar polish
- Slightly tinted neutral backgrounds.
- Consistent active/hover backgrounds.
- Standard icon colors and divider/border usage.

### Long-term: small design system layer

#### Recommended structure
- `colors.ts`: raw palette
- `tokens.ts`: semantic tokens (surface, border, focus, shadows, spacing, radius)
- `theme.ts`: AntD theme config from tokens

#### Common UI primitives
- Create thin wrappers for repeated patterns:
  - `AppCard`
  - `AppTag` (status/priority)
  - `AppButton` variants
  - `AppSectionHeader`

This reduces theme drift and makes future UI enhancements easier.
