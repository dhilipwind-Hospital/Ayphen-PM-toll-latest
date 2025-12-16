# 🗺️ Master Roadmap: Breadcrumbs, Fixes & Roadmap (Execution Ready)

**Status:** 📅 Planning Locked  
**Tech Stack:** React (Vite) + Node/Express + Postgres + TanStack Query + Zustand

---

## 🛑 Critical Challenges & Risk Mitigation

Before starting, we have identified key risks. Here is how we mitigate them:

| Challenge | Risk Level | Mitigation Strategy |
| :--- | :--- | :--- |
| **Breadcrumb Data Latency** | High | Use **Dependent Queries** in TanStack Query. Fetch Issue → Then Epic/Parent. Display skeletons while resolving. |
| **State Synchronization** | Medium | **Do not** use local state for Lists (Filters, Linked Issues). Use `queryClient.invalidateQueries(['linked-issues', id])` after mutations. |
| **Context Loss on Refresh** | Medium | The URL (`/issue/:key`) is the source of truth. The `useIssueContext` hook must resolve everything from just the ID/Key. |
| **UI "Jumpiness"** | Low | Reserve vertical space for Breadcrumbs (min-height) to prevent layout shift when they load. |

---

## 🏗️ Phase 1: Robust Navigation Foundation (Day 1-2)

### 1.1 `useIssueContext` Hook (The "Brain")
We need a single hook to resolve where we are.

**File:** `src/hooks/useIssueContext.ts`
```typescript
// Conceptual Signature
export const useIssueContext = (issueId: string) => {
  // 1. Fetch Issue
  const issueQuery = useQuery({ queryKey: ['issue', issueId], ... });
  
  // 2. Fetch Project (Dependent)
  const projectQuery = useQuery({ 
    queryKey: ['project', issueQuery.data?.projectId],
    enabled: !!issueQuery.data?.projectId 
  });

  // 3. Fetch Epic (Dependent)
  const epicQuery = useQuery({
    queryKey: ['issue', issueQuery.data?.epicId],
    enabled: !!issueQuery.data?.epicId
  });

  return {
    isLoading: issueQuery.isLoading || projectQuery.isLoading,
    breadcrumbs: [
      { label: 'Projects', path: '/' },
      { label: projectQuery.data?.name, path: `/project/${projectQuery.data?.id}` },
      { label: epicQuery.data?.summary, path: `/epic/${epicQuery.data?.key}` }, // Optional
      { label: issueQuery.data?.key, path: null } // Current
    ]
  };
};
```

### 1.2 `IssueBreadcrumbs` Component (The UI)
**File:** `src/components/common/IssueBreadcrumbs.tsx`
- **Props:** `{ issueId }`
- **Behavior:**
  - Uses `useIssueContext`
  - Renders generic `Breadcrumb` from AntD or custom
  - Handles "Loading" state (Skeleton bar)
  - Handles "Error" state (Fall back to "Back to Project")

### 1.3 Integration Points
- **Issue Detail Page:** Insert at top of `IssueDetailPanel.tsx`
- **Epic Detail Page:** Insert at top of `EpicDetailView.tsx`

---

## 🐛 Phase 2: Critical Fixes & Cleanup (Day 3-4)

### 2.1 Fix Filter Creation (#4)
**The Problem:** Filter is saved but list doesn't update.
**The Fix:**
- In `CreateFilterModal`: calling `mutateAsync` should await success.
- **CRITICAL:** Call `queryClient.invalidateQueries(['saved-filters'])` on success.
- **Verify:** Filter list uses `useQuery(['saved-filters'])`.

### 2.2 Fix Linked Issues UI (#11)
**The Problem:** Linking an issue doesn't show up until refresh.
**The Fix:**
- In `IssueLinkModal`: On `submit` success -> `queryClient.invalidateQueries(['issue-links', currentIssueId])`.
- Ensure `IssueDetailPanel` consumes the *Linked Issues* list via `useQuery`, not passed props that never update.

### 2.3 Cleanup Create Modal (#3, #2)
**The Problem:** "Sprint" field is confusing in global create. "Epic Name" is editable in Epic context.
**The Fix:**
- Remove `Form.Item name="sprintId"` from `CreateIssueModal`.
- Add `useEffect` to detect `initialValues.epicId`.
- If `epicId` present:
  - Set `Form.Item` for "Epic Link" to disabled.
  - Show "Creating in Epic: <EpicKey>" banner.

---

### Phase 3: AI Badges & Enhanced Views (Days 5-6)
- [x] **3.1 AI Creation Context badges**
    - [x] Backend: Add `creation_metadata` to `Issue`.
    - [x] Frontend: Render Badge (🤖 AI, 📋 Template) in `IssueHeader`.
- [x] **3.2 Enhanced Epic View**
    - [x] Turn Epic view into specific dashboard.
    - [x] Overview Tab: "Epic Progress", "Description" (Vision).
    - [x] Child Issues Tab: List of linked issues.
    - [x] Timeline Tab: Placeholder.
- [x] **3.3 Automated Status Updates**
    - [x] "Smart Nudge": If all children done -> Prompt to close Epic. View
**Goal:** Turn Epic view into a "Home Base".
- **Add Tabs:** Overview | Child Issues | Timeline
- **Overview:**
  - "Epic Progress" Bar (calculated from child issue status).
  - "Epic Progress" Bar (calculated from child issue status).
  - "Description" (Vision).

### Phase 4: Sprint & Backlog Refinements (Day 7)
**Goal:** Make the Backlog fully functional for Scrum teams.
- [x] **4.1 Sprint Lifecycle**
    - [x] "Create Sprint" button logic (BacklogView).
    - [x] "Start Sprint" modal validation & dates.
    - [x] "Complete Sprint" button & rollover logic (move incomplete issues to Backlog or Next Sprint).
- [x] **4.2 Interaction Polish**
    - [x] Verify Drag & Drop reordering persists.
### Phase 5: Performance & Final Polish (Day 8)
**Goal:** Optimize application performance and ensure visual consistency (Pixel Perfection).
- [x] **5.1 Performance Tuning**
    - [x] Audit `BacklogView` and `BoardView` re-renders. Use `React.memo` for heavy items (`IssueCard`).
    - [x] Ensure `useStore` is not causing global re-renders (use specific selectors).
- [x] **5.2 Visual Consistency & Mobile**
    - [x] Standardize "Pink" accent usage.
    - [x] Check Mobile Responsiveness for `BoardView` (Horizontal scroll?).
    - [x] Fix any visual glitches in `EpicDetailView` (Tabs).

## ✅ Execution Checklist (Week 1)

### Day 1: Breadcrumb Logic
- [x] Create `src/hooks/useIssueContext.ts` (Data resolution)
- [x] Create `src/components/common/IssueBreadcrumbs.tsx` (UI)
- [x] Add Breadcrumbs to `IssueDetailPanel`
- [x] Add Breadcrumbs to `EpicDetailView`

### Day 2: Critical Fixes (State Sync)
- [x] Refactor `SavedFilters` list to use `useQuery`.
- [x] Implement `invalidateQueries` on Filter Save.
- [x] Refactor `LinkedIssues` list to use `useQuery`.
- [x] Implement `invalidateQueries` on Link Issue.

### Day 3: Create Flow Polish
- [x] Remove Sprint field from `CreateIssueModal`.
- [x] Implement "Locked Context" (Epic) in Create Modal.
- [x] Test "Create Child Issue" from Epic view.

### Day 4: Testing & Polish
- [x] Created E2E Test Suite (`breadcrumbs-roadmap-verify.spec.ts`)
- [x] Verify Mobile responsiveness of Breadcrumbs.
- [x] Verify "No Project" edge cases (if any).
- [x] QA all fix verifications.

---

## 🔮 Future (Roadmap)

- **Favorites System:** `favorites` table + Sidebar "Favorites" section.
- **Comment Attachments:** Multi-file upload in comments.
- **Smart Search:** "Issues due next week" -> Parser -> Query.

---

**Note to Developer:**
The "Do It Yourself" mandate means taking ownership of *quality*.
- Do not implement "hacks" (like `setTimeout` for refetch). Use Query Invalidation.
- Do not hardcode Breadcrumbs. Use the Hook.
- Do not break the "Pink/White" clean aesthetic.
