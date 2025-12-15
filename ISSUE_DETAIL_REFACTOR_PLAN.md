# 📐 Detailed Implementation Plan: Issue Detail View Refactor

This plan outlines the refactoring of the `IssueDetailPanel` to introduce a modern, 3-column "Jira-style" layout, specifically excluding the "Development" panel as requested.

---

## 🏗️ 1. High-Level Layout Architecture

**File**: `src/components/IssueDetail/IssueDetailPanel.tsx` (Major Refactor)

The view will be split into three distinct columns using CSS Grid:

| **Left Rail (Navigation)** | **Center Stage (Content)** | **Right Sidebar (Metadata)** |
| :--- | :--- | :--- |
| `Width: 200px` | `Width: Flex (1fr)` | `Width: 300px` |
| **Sticky** | **Scrollable** | **sticky / Scrollable** |
| Spy Scroll Menu | Issue Header (Title) | **Details** Panel |
| | Description Editor | **People** Panel |
| | Child Issues / Subtasks | **Planning** Panel |
| | Attachments | **Dates** Panel |
| | Activity (Comments/History) | **Time Tracking** Panel |
| | | 🤖 **AI Actions Button** |

---

## 🧩 2. Right Sidebar Components (Detailed)

We will create a reusable `AccordionPanel` or `CollapsibleSection` component to house these groups.

### **2.1. Panel: Details**
*   **Purpose**: Quick view of the issue's state and classification.
*   **Fields**:
    *   **Status**: Dropdown (To Do -> In Progress -> Done).
    *   **Priority**: Icon + Text Dropdown.
    *   **Resolution**: (e.g., "Done", "Fixed", "Won't Do").
    *   **Labels**: Tag input (multi-select).

### **2.2. Panel: People**
*   **Purpose**: Who is involved.
*   **Fields**:
    *   **Assignee**: Avatar + Name select.
    *   **Reporter**: Avatar + Name (read-only or editable).
    *   **Watchers**: List of avatars (click to add).
    *   **Voters**: Count + "Vote for this issue" action.

### **2.3. Panel: Planning**
*   **Purpose**: Scheduling and organization.
*   **Fields**:
    *   **Epic Link**: Card showing parent Epic color/name.
    *   **Sprint**: Select (active/future sprints).
    *   **Story Points**: Number input.
    *   **Fix Versions**: Multi-select (e.g., v1.0, v2.0).
    *   **Components**: Multi-select (e.g., Backend, UI).

### **2.4. Panel: Dates**
*   **Purpose**: Critical timeline milestones.
*   **Fields**:
    *   **Due Date**: Date Picker.
    *   **Start Date**: Date Picker.
    *   **Created**: Read-only timestamp.
    *   **Updated**: Read-only timestamp.

### **2.5. Panel: Time Tracking**
*   **Purpose**: Progress monitoring.
*   **UI**:
    *   **Progress Bar**: Visual bar showing (Time Spent / Original Estimate).
    *   **Original Estimate**: Editable (e.g., "2d").
    *   **Time Spent**: Editable/Log Work button.
    *   **Remaining**: Auto-calculated.

---

## 🤖 3. AI Integration

### **3.1. The "AI Actions" Button**
*   **Location**: Top of the Right Sidebar (Sticky).
*   **UI**: Large, distinct button (e.g., gradient background or "Sparkle" icon).
*   **Functionality**: Opens a context menu with:
    *   ✨ **Summarize**: Summarize long description/comments.
    *   📝 **Improve Writing**: Polish description text.
    *   🧪 **Generate Test Cases**: Create tests based on AC.
    *   📋 **Breakdown**: Suggest subtasks.

---

## 🗺️ 4. Navigation (Left Rail)

### **4.1. Spy Scroll Implementation**
*   **Items**:
    *   `Description`
    *   `Subtasks` / `Child Issues`
    *   `Attachments`
    *   `Activity` (Comments/History)
*   **Technical**:
    *   Assign `id="section-description"`, `id="section-attachments"` etc. to main content blocks.
    *   Use `IntersectionObserver` to detect which ID is in the viewport.
    *   Highlight corresponding link in Left Rail.

---

## 🧪 5. Testing Plan

### **5.1. Component Unit Tests**
*   **Right Sidebar**: Verify all panels render correct fields.
*   **Scrolling**: Verify clicking "Attachments" in Left Rail scrolls the page.
*   **AI Button**: Verify clicking opens the menu.

### **5.2. E2E Scenarios**
1.  **Navigation**: Open issue -> Click "Activity" in side menu -> Verify scroll position.
2.  **Metadata Update**: Change Assignee in Right Sidebar -> Verify change persists.
3.  **Time Tracking**: Log 2h work -> Verify Progress Bar updates.
