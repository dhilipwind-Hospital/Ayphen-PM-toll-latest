# Roadmap Enhancement Plan: Integrating Diverse Issue Types

## 1. Executive Summary
This document outlines a comprehensive strategy to evolve the current "Epic-only" Roadmap into a multi-dimensional planning tool that integrates Stories, Bugs, Tasks, and Milestones. The goal is to provide a unified view of project progress, from high-level strategic goals (Epics) to granular execution items (Stories/Tasks), without compromising the existing stability or performance.

## 2. Current State Analysis
**Existing Implementation (`RoadmapView.tsx`):**
*   **Entity:** Visualizes `Epics` only.
*   **Timeline:** Supports Quarter/Month/Week views.
*   **Interaction:** Basic drag-and-drop (implied/partial) and resize handles.
*   **Dependencies:** Visualizes dependencies between Epics with SVG lines.
*   **Data Structure:** `Epic` interface includes `children: any[]`, currently only used in the "Details Drawer".

**Limitations:**
*   **Lack of Granularity:** Users cannot see *why* an Epic is delayed (e.g., a specific blocking Story).
*   **No Release Tracking:** Critical milestones or release dates are missing.
*   **Single Dimension:** Only visualizes the "What" (Epics), not the "Who" (Resource allocation) or "When" (Sprints).

---

## 3. Proposed Enhancements (The "Full Freedom" Options)

We propose three distinct tiers of enhancement, ranging from immediate visualization improvements to advanced portfolio management features.

### Option 1: Nested Hierarchy (The "Jira Advanced Roadmaps" Approach)
*Recommended for immediate implementation.*
Allow Epics to be expanded to reveal their child issues (Stories, Bugs, Tasks) directly on the timeline.

*   **Feature:** Add a standard "chevron" (prominent arrow) next to the Epic name.
*   **Behavior:** Clicking expands the row to show child items indented below.
*   **Visual:** Child items typically inherit the color of their type (Story: Green, Bug: Red, Task: Blue).
*   **Logic:**
    *   If a child has `startDate` and `endDate`, render its own bar.
    *   If a child belongs to a Sprint, infer dates from the Sprint key.

### Option 2: The "Swimlane" View (Team & Resource Focus)
Pivot the roadmap to show work distributed by Assignee or Sprint, rather than just Epic hierarchy.

*   **Feature:** A "Group By" dropdown (None, Assignee, Sprint).
*   **Behavior:**
    *   **Group by Sprint:** Columns represent Sprints (not just months). Swimlanes show Issues assigned to that Sprint.
    *   **Group by Assignee:** Rows represent Team Members. Bars show their assigned tasks over time.
    *   **Benefit:** Identifies resource bottlenecks immediately.

### Option 3: Milestones & Releases Layer
Add a top-level "Marker" layer for critical dates that cut across all work.

*   **Feature:** "Create Milestone" button.
*   **Visual:** Vertical dashed lines or diamond markers at specific dates (e.g., "Alpha Release - Dec 25").
*   **Interaction:** Draggable markers.
*   **Benefit:** Provides context. Is the Epic running late relative to the Release?

---

## 4. Technical Implementation Strategy

We will focus on **Option 1 (Nested Hierarchy)** as the primary enhancement, as it provides the most immediate value without altering the fundamental data model.

### Step-by-Step Implementation Plan

#### Phase 0: Backend Data Enrichment
The current API (`GET /api/roadmap/:projectId`) returns child issues but omits their date fields.
1.  **Update `src/routes/roadmap.ts`:**
    Modify the children mapping to include:
    ```typescript
    children: children.map(c => ({
      ...
      startDate: c.startDate,
      endDate: c.endDate,
      dueDate: c.dueDate,
      assignee: c.assignee // Useful for Option 2
    }))
    ```
2.  **Verify Data:** Ensure existing non-Epic issues actually *have* dates. If not, we might need to fallback to their Sprint dates.

#### Phase 1: Data Preparation & State Management
Currently, `epics` are a flat list. We need a UI state to track expansion.

1.  **Modify State:**
    ```typescript
    const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
    ```
2.  **Toggle Helper:**
    ```typescript
    const toggleEpic = (epicId: string) => {
      const newExpanded = new Set(expandedEpics);
      if (newExpanded.has(epicId)) newExpanded.delete(epicId);
      else newExpanded.add(epicId);
      setExpandedEpics(newExpanded);
    };
    ```

#### Phase 2: Enhanced Rendering Logic
Update the mapping loop to handle conditional rendering of children.

*   **Refactor Render Loop:** Instead of `epics.map(...)`, use a recursive or flattened render function.
*   **Render Children:**
    If `expandedEpics.has(epic.id)`, iterate over `epic.children`.
    *   **Positioning:** Use the same `calculateEpicPosition` function for child issues. *Note: Child issues might need to fallback to Sprint dates if they lack specific start/end dates.*
    *   **Styling:** Child bars should be slightly thinner (e.g., `height: 24px` vs `40px` for Epics) and indented in the label column.

#### Phase 3: Visual Polish & Types
1.  **Type Colors:**
    *   Story: Green (`#65BA43`)
    *   Bug: Red (`#E5493A`)
    *   Task: Blue (`#4BADE8`)
2.  **Lines & Connectors:** (Optional) Draw faint grey L-shaped lines connecting the Epic to its children for clear hierarchy.

#### Phase 4: Non-Epic Items (Orphans)
Handling issues that don't belong to an Epic.
*   Create a virtual "Unassigned / Issues without Epic" container at the bottom of the roadmap to ensure nothing falls through the cracks.

---

## 5. Mockup & Visual Description

**Before:**
```
[>] EPIC-1: Website Redesign  [===========]
[>] EPIC-2: Mobile App        [=======]
```

**After (Expanded):**
```
[v] EPIC-1: Website Redesign  [===================]
    |-- STY-101: Homepage       [=====]
    |-- STY-102: Login Page            [======]
    |-- BUG-55:  Fix Header                   [=]
[>] EPIC-2: Mobile App        [=======]
( | ) Milestone: Beta Launch           ^ (Diamond Marker)
```

## 6. Safety & Risk Mitigation (Crucial)
To ensure we "don't break anything":

1.  **Conditional Rendering:** The new hierarchy logic will only trigger *if* the user clicks expand. The default view remains identical to the current stable build.
2.  **Prop Types:** Ensure `epic.children` is typed correctly (optional/undefined check) to prevent runtime crashes if API returns incomplete data.
3.  **Performance:** If an Epic has 100+ children, rendering DOM nodes can be heavy. We will implement virtual scrolling or limit initial render to top 10 children if performance drops.
