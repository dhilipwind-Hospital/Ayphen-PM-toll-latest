# 📋 Phase 3: Gap Remediation Plan (The "Missing Links" Update)

**Objective**: Address the 4 critical/high gaps preventing the application from being a fully functional Jira clone. Focus on Visibility, Relationships, and QA.

---

## 🔴 Gap 1: Test Cases Are Invisible (CRITICAL)
**Problem**: AI generates test cases, but they vanish into the database with no UI to view or execute them.
**Goal**: Full Test Case Management (TCM) within the Issue View.

### 🛠 Implementation Plan
1.  **New Component**: `TestCaseList.tsx`
    *   **Location**: `src/components/IssueDetail/TestCaseList.tsx`
    *   **Features**:
        *   List view of test cases linked to the issue.
        *   **Status Toggles**: `Pass` (Green), `Fail` (Red), `Pending` (Gray).
        *   **Manual Add**: "Add Test Case" button (inline input).
        *   **AI Trigger**: "Generate with AI" button (existing logic, but refreshed UI).
2.  **Update `IssueDetailPanel.tsx`**
    *   Add a new **Tab** named "🧪 Test Cases".
    *   Fetch test cases using `ai-test-case-generator` API (or new dedicated endpoint).
    *   Display `TestCaseList` inside the tab.

**User Flow**:
Open Issue → Click "Test Cases" Tab → See 8 AI-generated tests → Click "Pass" on 5, "Fail" on 1 → Add manual test case → Save.

---

## 🔴 Gap 2: Issue Relationships Missing (CRITICAL)
**Problem**: No way to define "Blockers" or "Dependencies".
**Goal**: Robust linking system (blocks, is blocked by, relates to).

### 🛠 Implementation Plan
1.  **New Component**: `IssueLinkModal.tsx`
    *   **Inputs**:
        *   `Relationship Type`: "Blocks", "Is Blocked By", "Relates To", "Duplicates".
        *   `Target Issue`: Searchable dropdown (filtered by project).
2.  **Update `IssueDetailPanel.tsx`**
    *   **"Linked Issues" Section**:
        *   Add **"+ Link Issue"** button next to the header.
        *   Improve list styling: Show Status (Open/Done) and Priority icon of linked issues.
    *   **Backend Sync**: Ensure `issue-links` API supports these relationship types correctly.

**User Flow**:
Open "Login Page" Story → Click "+ Link Issue" → Select "Blocks" → Search "User Dashboard" → Save.
Result: "Login Page" now shows "Blocks: User Dashboard".

---

## 🟡 Gap 3: Hierarchy Not Visualized (HIGH)
**Problem**: Flat view. Can't see that *Task A* belongs to *Story B* which belongs to *Epic C*.
**Goal**: Clear visual hierarchy tree.

### 🛠 Implementation Plan
1.  **New Component**: `HierarchyTree.tsx`
    *   **Logic**:
        *   Fetch parents (Epic/Story) and children (Subtasks).
        *   Render a recursive tree structure.
    *   **Visuals**: Indented lines, icons for types (⚡Epic, 📖Story, ✅Subtask).
2.  **Update `IssueDetailPanel.tsx`**
    *   **Breadcrumbs**: Add top bar: `Project / Epic / Story / Key`.
    *   **Sidebar Widget**: Add "Hierarchy" card below "Details".

**Visual**:
```text
⚡ EGG-1 User Auth (Epic)
  └─ 📖 EGG-2 Login Page (Current Issue)
      ├─ ✅ EGG-3 Frontend Form
      └─ ✅ EGG-4 API Integration
```

---

## 🟡 Gap 4: Epic Selection Not Obvious (MEDIUM)
**Problem**: Epic selection is missing for Stories, leading to orphaned issues.
**Goal**: Prominent Epic selection during creation.

### 🛠 Implementation Plan
1.  **Update `CreateIssueModal.tsx`**
    *   **Fetch Epics**: Load all Epics in the current project on mount.
    *   **New Field**: Add `Epic Link` Select dropdown for Issue Types: `Story`, `Bug`, `Task`.
    *   **Validation**: Add warning (not error) if no Epic is selected: *"Issues without an Epic can get lost. Are you sure?"*
    *   **Subtask Fix**: Replace hardcoded `AYP-1` parent selection with dynamic search for Stories/Tasks.

**User Flow**:
Click "Create" → Select "Story" → See "Epic Link" dropdown (Pre-filled if created from Epic view) → Select "User Auth" → Create.

---

## 📅 Execution Order
1.  **Fix Gap 4 (Epic Selection)**: Prevents new orphaned issues. (Low Effort, High Impact)
2.  **Fix Gap 2 (Linking)**: Enables basic dependencies. (Medium Effort)
3.  **Fix Gap 1 (Test Cases)**: Unlocks the AI value. (Medium Effort)
4.  **Fix Gap 3 (Hierarchy)**: Visual polish. (High Effort)
