# Page Loading Issues - Analysis & Fix Plan

**Date:** December 26, 2024
**Issue:** Multiple pages showing empty states or losing project context

---

## Issues Identified

### Issue 1: Roadmap Shows Empty Bars
**Page:** `/roadmap`
**Symptom:** Gray bar outlines visible but no content (names, dates, colors)
**Severity:** High

**Probable Causes:**
1. Epics exist but have no `startDate` or `endDate` set
2. API returns data but frontend rendering fails
3. CSS/styling issue where text is there but not visible

**Files to Check:**
- `src/pages/RoadmapView.tsx` - rendering logic
- `ayphen-jira-backend/src/routes/roadmap.ts` - API response
- Database: `issues` table where `type = 'epic'`

**Solution:**
1. Check if epics in database have `startDate` and `endDate` populated
2. Add console.log in `RoadmapView.tsx` to debug API response
3. Verify the bar rendering logic handles null dates gracefully
4. Add "No dates set" fallback for epics without dates

---

### Issue 2: Board Shows "No Active Sprint"
**Page:** `/board`
**Symptom:** Empty state with message to start sprint
**Severity:** Medium (might be correct behavior)

**Probable Causes:**
1. No sprint exists with `status: 'active'` in the project
2. Sprint API call fails silently
3. Project ID not being passed correctly to sprint query

**Files to Check:**
- `src/pages/BoardView.tsx` - sprint loading logic
- `ayphen-jira-backend/src/routes/sprints.ts` - GET endpoint
- Database: `sprints` table, check `status` column

**Solution:**
1. Verify in database if any sprint has `status = 'active'` for this project
2. If no active sprint exists, this is correct behavior - user needs to start one
3. Add better UX: show sprint list with "Start Sprint" button instead of just "Go to Backlog"
4. Add logging to verify API is being called with correct projectId

---

### Issue 3: Project Context Lost on Refresh
**Page:** All pages after browser refresh
**Symptom:** "No Project Selected" even though user had selected a project
**Severity:** Critical

**Probable Causes:**
1. `currentProject` in Zustand store is only in memory
2. `localStorage` persistence not configured for project selection
3. Store is reset on page refresh

**Files to Check:**
- `src/store/useStore.ts` - persistence configuration
- `src/App.tsx` - project restoration logic
- `src/contexts/AuthContext.tsx` - initialization flow

**Solution:**
1. Update Zustand store to persist `currentProject` to localStorage:
   ```typescript
   persist(
     (set) => ({ ... }),
     {
       name: 'ayphen-storage',
       partialize: (state) => ({ 
         currentProject: state.currentProject,
         // other persisted items
       }),
     }
   )
   ```
2. On app load, restore project from localStorage
3. Add fallback: if user lands on project-dependent page without project, redirect to project selector

---

### Issue 4: All Project Pages Fail Without Selection
**Pages:** Roadmap, Board, Backlog, Sprint Planning, Epics, Stories, Bugs, Reports
**Symptom:** Empty states or errors when no project selected
**Severity:** High (UX problem)

**Solution:**
1. Create a `RequireProject` wrapper component
2. If no project selected, show project selector instead of empty state
3. Add route guard to redirect to project selection page

---

## Fix Priority Order

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 1 | Project Context Lost | Medium | Critical - Affects ALL pages |
| 2 | Roadmap Empty Bars | Low | High - Visible bug |
| 3 | Board Empty State | Low | Medium - Might be correct |
| 4 | Project Guard | Medium | High - Better UX |

---

## Step-by-Step Fix Plan

### Step 1: Fix Project Persistence (30 mins)
1. Open `src/store/useStore.ts`
2. Add `persist` middleware from Zustand
3. Configure to save `currentProject` to localStorage
4. Test: Select project → Refresh page → Project should remain selected

### Step 2: Debug Roadmap Data (20 mins)
1. Open browser DevTools → Network tab
2. Navigate to Roadmap page
3. Check `/api/roadmap/:projectId` response
4. Verify epics have `startDate` and `endDate`
5. If dates are null, that's the problem - epics need dates

### Step 3: Verify Sprint Status (10 mins)
1. Go to Backlog page
2. Check if any sprint exists
3. If sprint exists but not started, Board shows correct message
4. If sprint is started but not showing, debug API call

### Step 4: Add Project Guard (45 mins)
1. Create `src/components/RequireProject.tsx`
2. Wrap all project-dependent routes with this component
3. If no project, render project selector modal
4. Better UX than showing "No Project Selected"

---

## Files to Modify

| File | Change Needed |
|------|---------------|
| `src/store/useStore.ts` | Add persist middleware for currentProject |
| `src/pages/RoadmapView.tsx` | Debug rendering, handle null dates |
| `src/pages/BoardView.tsx` | Improve empty state UX |
| `src/components/RequireProject.tsx` | Create new component |
| `src/App.tsx` | Wrap routes with RequireProject |

---

## Expected Outcome After Fixes

1. ✅ Project selection persists across page refreshes
2. ✅ Roadmap shows epics with proper bars (or helpful message if no dates)
3. ✅ Board shows helpful sprint management instead of just "No Sprint"
4. ✅ Users never see "No Project Selected" - always guided to select one
