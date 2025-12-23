# Roadmap Experience Enhancement Exploration

**Objective:** Transform the current functional Roadmap into a visually rich, high-density, and interactive planning tool.

## 1. Visual & Layout Improvements

### A. Advanced Visual Distinction
**Current State:** Solid flat colors based on status.
**Proposal:**
*   **Gradient Bars:** Use subtle vertical gradients (e.g., `#1890ff` to `#096dd9`) to make bars look 3D/tactile.
*   **Texture Overlays:** Use striped CSS backgrounds (`repeating-linear-gradient`) to indicate special states like "At Risk" or "Tentative" dates.
*   **Status Indicators:** Instead of just bar color, add a distinct "Traffic Light" dot (🟢/🟡/🔴) at the start of the bar to indicate health (On Track, Warning, Blocked) separate from the workflow status (In Progress, Done).

### B. Inline Progress Visualization
**Current State:** Text percentage (e.g., "45%").
**Proposal:**
*   **Visual Fill:** Render a semi-transparent, darker overlay *inside* the main epic bar.
    *   *Example:* If an Epic is 45% done, the leftmost 45% of the blue bar is dark blue, the rest is light blue.
    *   *Implementation:* Child `div` with `width: ${progress}%`, `background: rgba(0,0,0,0.2)`.

### C. Swimlanes & Grouping
**Current State:** Flat list of Epics.
**Proposal:**
*   **Collapsible Groups:** Add a "Group By" control (status, assignee, priority).
*   **Visual Separators:** Horizontal dashed lines separating groups.
*   **Header Summaries:** Each swimlane header shows aggregated metrics (e.g., "Sprint 1 Scope: 4 Epics, 20% Complete").

## 2. Information Density

### A. Richer Context on Timeline
**Current State:** Summary text.
**Proposal:**
*   **Avatars:** Display assignee Avatar circles directly on the bar (right-aligned).
*   **Key Dates:** Show "Deadline" diamond markers (♦) on the timeline track for hard delivery dates, separate from the scheduled work bar.
*   **Micro-Labels:** If zoomed in sufficiently (Weeks view), display start/end dates text outside the bar ends.

### B. Enhanced Dependency Visualization
**Current State:** Simple dashed lines.
**Proposal:**
*   **Smart Routing:** Use "Orthogonal Routing" (elbow connectors) instead of direct diagonal lines to avoid visual clutter.
*   **Critical Path:** Highlight dependency chains in **Red** if a delay in a predecessor pushes a successor past its deadline.

## 3. Interactivity & Usability

### A. Direct Manipulation (Drag & Drop)
**Current State:** No drag action.
**Proposal:**
*   **Timeline Drag:** Allow users to grab the center of a bar and slide it L/R to shift both start/end dates simultaneously.
*   **Edge Resizing:** Implement the existing "resize handles" to snap to grid (days/weeks) when dragged, updating the underlying date.
*   **Ghosting:** Show a semi-transparent "ghost" of the original position while dragging for comparison.

### B. "Today" Indicator
**Current State:** None.
**Proposal:**
*   **Vertical Line:** A distinct Red dashed line running the full height of the chart at `Date.now()`.
*   **Label:** A "Today" tag at the top of the line.
*   **Auto-Scroll:** Button to "Jump to Today".

### C. Smart Tooltips
**Current State:** Basic HTML title or simple text.
**Proposal:**
*   **Rich Popover:** On hover, show a card with:
    *   Full Description (truncated).
    *   Child Issue Breakdown (e.g., "5 Stories, 2 Bugs").
    *   Assignee details.
    *   "Quick Actions" (Edit, Comment) directly in the tooltip.

## 4. Empty State Experience
**Current State:** Simple text "No epics".
**Proposal:**
*   **Interactive Guide:** A placeholder visualization showing "Ghost Epics" with a button "Click to fill this spot".
*   **Quick Start Templates:** Buttons to "Generate Quarter Plan" which pre-fills the roadmap with a standard quarterly structure using AI.

## 5. Technical Implementation Roadmap

### Phase 1: CSS & Visuals (Low Effort)
1.  Implement **Visual Progress Fills** (CSS overlay).
2.  Add **"Today" Line** (CSS absolute positioning).
3.  Enhance **Bar Styling** (Gradients/Rounded corners).

### Phase 2: React Component Logic (Medium Effort)
1.  Implement **Group By** logic (Swimlanes).
2.  Add **Avatars** to bars.
3.  Replace stock tooltips with **AntD Popovers**.

### Phase 3: Advanced Interactions (High Effort)
1.  Integrate **@dnd-kit** for X-axis dragging.
2.  Implement **Resize logic** (calculating pixel delta to date delta).
3.  Develop **Orthogonal Line Routing** algorithm for dependencies.

---
**Recommendation:** Start with Phase 1 to immediately boost visual appeal ("Wow Factor") before tackling the complex interaction logic of Phase 3.
