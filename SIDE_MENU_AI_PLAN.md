# 🗺️ Implementation Plan: Side Menu Navigation with AI Integration

This plan details the UI/UX architecture for implementing a Jira-like "Spy Scroll" side menu and a high-impact AI Actions button within the Issue Detail view.

---

## 🎨 1. UI/UX Design

### **1.1. Side Menu (Spy Scroll Navigation)**
*   **Location**: Fixed pane on the **Left** side of the Issue Detail Modal/Page (width ~200px), or sticky within the main content column if using a 2-column layout.
*   **Behavior**:
    *   **Sticky**: Stays visible while the user scrolls the main content.
    *   **Active State**: The current section in view (e.g., "Description") is highlighted in blue.
    *   **Click**: Smooth scrolls to the target anchor.
*   **Items**:
    1.  **Details** (Metadata like Status, Priority)
    2.  **Description** (Main content)
    3.  **Acceptance Criteria** (If applicable)
    4.  **Activity** (Comments, History, Work Log)
    5.  **Attachments**
    6.  **Child Issues / Subtasks**
    7.  **Development** (Commits/PRs)

### **1.2. The AI "Sparkle" Button**
*   **Concept**: A ubiquitous, context-aware "AI Action" button that sits prominently in the UI.
*   **Placement Options**:
    *   **Option A (Header)**: Next to the "Share" and "Export" buttons in the sticky header.
    *   **Option B (Floating)**: A floating action button (FAB) in the bottom-right of the viewport.
    *   **Option C (Integrated in Side Menu)**: A dedicated "AI Actions" item or distinct button at the top/bottom of the navigation rail. -> **Recommended**: Top of the Right Sidebar or Header for visibility.
*   **Visual**: A gradient or distinct colored button with a "Sparkle" icon (✨).
*   **Interaction**: Clicking opens a **Popover/Dropdown** menu with context-specific actions.

---

## 🛠️ 2. Component Architecture

### **2.1. `IssueNavigationRail` Component (New)**
*   **Props**:
    *   `activeSection`: string (id of currently visible section)
    *   `onNavigate`: (sectionId: string) => void
*   **Implementation**:
    *   Renders a vertical list of links.
    *   Uses an `IntersectionObserver` in the parent container to detect which section is currently in the viewport and updates `activeSection`.

### **2.2. `AIActionsMenu` Component (New)**
*   **Props**:
    *   `issue`: The current issue object (for context).
    *   `onAction`: (actionType: string, result: any) => void
*   **Menu Items**:
    *   ✨ **Summarize Thread**: "Summarize the 15 comments on this issue."
    *   🧪 **Generate Tests**: "Create Gherkin test cases from this description."
    *   📝 **Improve Description**: "Rewrite this description to be more professional."
    *   🔨 **Breakdown**: "Suggest subtasks for this story."
    *   🔍 **Find Duplicates**: "Check if similar bugs exist."
*   **Feedback UI**: When an action is clicked, the button shows a loading spinner, then displays the AI result (e.g., inside a Modal or by inserting text directly).

### **2.3. Layout Refactor (`IssueDetailPanel.tsx`)**
*   **Current Structure**: Single column `DetailContainer`.
*   **New Structure**:
    ```tsx
    <Container>
      <StickHeader /> <!-- Top Bar -->
      <ContentGrid>
         <LeftRail> <!-- New Navigation -->
            <IssueNavigationRail />
         </LeftRail>

         <MainContent> <!-- Scrollable Area -->
            <Section id="details">...</Section>
            <Section id="description">...</Section>
            <Section id="activity">...</Section>
         </MainContent>

         <RightSidebar> <!-- Metadata -->
            <AIActionsButton /> <!-- Prominent placement -->
            <PeoplePanel />
            <DatesPanel />
         </RightSidebar>
      </ContentGrid>
    </Container>
    ```

---

## 📋 3. Step-by-Step Implementation

### **Phase 1: Structure & Navigation**
1.  **Refactor Layout**: Update `DetailContainer` to use CSS Grid/Flex for the 3-column layout (Left Nav, Center Content, Right Sidebar).
2.  **Create Navigation Component**: Build `IssueNavigationRail` with static links first.
3.  **Implement Scroll Spy**: Add `id` attributes to all sections in `IssueDetailPanel` and set up the `IntersectionObserver` hook to update the active state in the rail.

### **Phase 2: The Right Sidebar**
1.  **Extract Components**: Move `Assignee`, `Reporter`, `Story Points`, etc., from the current vertical list into a dedicated `<RightSidebar>` component.
2.  **Visual Polish**: Style these as compact "Cards" or "Property Lists" similar to Jira/GitHub.

### **Phase 3: AI Integration**
1.  **Create AI Button**: Place the generic AI button at the top of the Right Sidebar.
2.  **Connect Services**: Link the button to existing backend AI endpoints (`/ai-generation`, etc.) or mocked services.
3.  **Action Handlers**:
    *   *Summarize*: Call API -> Show Modal with summary.
    *   *Generate Tests*: Call API -> Navigate to "Test Cases" tab or show success toast.

---

## 🧪 4. Testing Plan

*   **Verify Scroll**: ensuring clicking "Activity" scrolls exactly to the comments section.
*   **Verify Spy**: Scrolling manually through the page updates the highlighted link in the sidebar.
*   **Verify AI Context**: Ensure the AI button sends the *current* issue's description/summary to the backend.
