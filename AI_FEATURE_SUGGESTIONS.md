# 🤖 AI Feature Requirements Specification

This document outlines the detailed functional and user experience requirements for 5 advanced AI features. These requirements are technology-agnostic and focus on user value and system behavior.

---

## 1. 🕵️‍♂️ Intelligent Duplicate Detector ✅ **COMPLETED**

**Status:** Fully Implemented  
**Implementation Files:**
- Backend: `/ayphen-jira-backend/src/services/ai-duplicate-detector.service.ts`
- Routes: `/ayphen-jira-backend/src/routes/ai-description.ts`, `/issues.ts`
- Frontend: `/ayphen-jira/src/components/CreateIssueModal.tsx`, `DuplicateDetection/DuplicateAlert.tsx`

### **Problem Statement**
Users often create bug reports or stories that already exist in the backlog because they do not perform a thorough search beforehand. This leads to a bloated backlog, wasted triage time, and fragmented information.

### **Functional Requirements**
1.  **Real-Time Monitoring**:
    *   The system must monitor the "Issue Title" input field in the "Create Issue" modal/page.
    *   Detection should trigger automatically after the user pauses typing (debounce) to avoid interrupting flow.
2.  **Semantic Similarity Search**:
    *   The search must go beyond exact keyword matching. It should understand the *intent* and *context* of the phrase (e.g., "Login failed" should match "Cannot sign in").
    *   The scope of the search should be limited to the current Project.
3.  **User Feedback (UI)**:
    *   If potential duplicates are found (high similarity score), a non-intrusive alert or list must appear near the title field.
    *   The alert should display the Title, Status, and ID of the potential duplicates.
    *   Users must be able to click a duplicate to open it in a new tab/window to verify.
4.  **Actionability**:
    *   The user must have the option to "Dismiss" the warning and proceed with creation.
    *   The user must have the option to "Link as Duplicate" if they decide not to create a new issue but want to add context to the existing one (future enhancement).

### **User Flow**
1.  User clicks "Create Issue".
2.  User types: "Application crashes when uploading large PDF".
3.  System pauses for 500ms, then searches.
4.  System displays: *"Possible Duplicate Found: 'Error 500 on file upload' (Status: Open)"*.
5.  User clicks the link, confirms it's the same issue, and cancels creation.

---

## 2. 📊 AI Sprint Retrospective Analyst ✅ **COMPLETED**

**Status:** Fully Implemented  
**Implementation Files:**
- Backend: `/ayphen-jira-backend/src/services/ai-retrospective-analyzer.service.ts`
- Routes: `/ayphen-jira-backend/src/routes/sprint-retrospectives.ts`
- Frontend: `/ayphen-jira/src/components/Sprint/RetrospectiveModal.tsx`

### **Problem Statement**
Scrum Masters and Product Owners spend significant time manually aggregating data and reading through comments to prepare for Sprint Retrospectives. Retrospectives often lack objective data.

### **Functional Requirements**
1.  **Data Aggregation**:
    *   The system must be able to fetch all data related to a specific *completed* Sprint.
    *   **Metrics to Analyze**:
        *   Planned vs. Completed Story Points (Velocity).
        *   Number of bugs raised during the sprint.
        *   Carry-over work (issues moved to next sprint).
    *   **Qualitative Data**:
        *   Issue descriptions and comments within the sprint's issues.
2.  **Automated Analysis**:
    *   The system must generate a structured report containing:
        *   **Executive Summary**: A brief overview of sprint performance.
        *   **What Went Well**: Highlights of achievements and smooth processes.
        *   **Challenges/Bottlenecks**: Identification of stuck issues or high bug rates.
        *   **Recommendations**: Actionable steps for the next sprint.
3.  **Sentiment Analysis**:
    *   The system should gauge the general mood of the team based on comment tone (e.g., frustrated, celebratory, neutral).
4.  **Output & Storage**:
    *   The report should be presented in a readable format (Markdown or Rich Text).
    *   Users must be able to edit the generated report before saving.
    *   Option to export or save to a "Retrospectives" section.

### **User Flow**
1.  Sprint ends. Scrum Master clicks "Complete Sprint".
2.  A button "Generate Retrospective Report" becomes available on the Sprint Board.
3.  User clicks the button. System processes data (showing a loading state).
4.  A modal opens with the drafted report.
5.  User reviews, edits a few points, and saves it to the project documentation.

---

## 3. 🗣️ Natural Language Query (NLQ) ⚠️ **PARTIALLY IMPLEMENTED**

**Status:** Basic search exists, but not true NL→Filter mapping  
**What exists:**
- Command Palette (Cmd+K) with keyword search
- JQL parser for technical queries
- Basic text search functionality

**What's missing:**
- True natural language understanding ("show me all critical bugs assigned to Sarah")
- Automatic filter chip activation from NL queries
- AI-powered query interpretation

### **Problem Statement**
Advanced filtering (JQL) is powerful but difficult for non-technical users (stakeholders, managers). Dropdown filters can be tedious for complex multi-criteria searches.

### **Functional Requirements**
1.  **Input Interface**:
    *   A prominent "Smart Search" bar should be available on the Issue List/Backlog views.
    *   It should accept plain English sentences.
2.  **Query Interpretation**:
    *   The system must map natural language concepts to database fields:
        *   "High priority" -> `Priority: High`
        *   "My bugs" -> `Assignee: [Current User]`, `Type: Bug`
        *   "Updated yesterday" -> `UpdatedAt: [Date Range]`
        *   "Stuck" -> `Status: In Progress` (with no updates for X days - optional advanced logic).
3.  **Execution & Feedback**:
    *   The system must apply the interpreted filters to the current list view.
    *   **Crucial**: The UI must visually show *which* filters were applied (e.g., by activating the corresponding dropdown chips) so the user verifies the AI's understanding.
    *   If the query is ambiguous, the system should ask for clarification or show the closest match.

### **User Flow**
1.  User types: "Show me all critical bugs assigned to Sarah that are still open."
2.  User presses Enter.
3.  The Issue List refreshes.
4.  The Filter Bar updates to show: `[Type: Bug]`, `[Priority: Critical]`, `[Assignee: Sarah]`, `[Status: Open]`.

---

## 4. 🧪 AI Test Case Generator ⚠️ **PARTIALLY IMPLEMENTED**

**Status:** Exists in AI Test Automation, but not as standalone on-demand feature  
**What exists:**
- Backend: `/ayphen-jira-backend/src/services/openai.service.ts` (generateTestCases)
- Test case generation from AI stories
- Smoke, Sanity, Regression categorization
- Integration with AI Requirements workflow

**What's missing:**
- On-demand "Generate Test Cases" button on Story/Bug issues
- Direct integration in issue sidebar
- Ability to append test cases to existing issues as comments

### **Problem Statement**
QA engineers often manually rewrite requirements into test cases, which is time-consuming and prone to missing edge cases.

### **Functional Requirements**
1.  **Context Awareness**:
    *   The feature must be available only on "Story" or "Bug" issue types.
    *   It must read the "Description" and "Acceptance Criteria" fields of the issue.
2.  **Generation Output**:
    *   **Manual Test Steps**: A step-by-step guide (Action -> Expected Result).
    *   **Edge Cases**: Identification of negative test scenarios (e.g., "What if the file is 0MB?").
    *   **Gherkin Syntax**: Optional generation of Given/When/Then scenarios for automation.
3.  **Integration**:
    *   Generated test cases should not overwrite existing data.
    *   They should be appendable as a comment OR added to a dedicated "Test Cases" field if available.
    *   Users must be able to review and modify the steps before finalizing.

### **User Flow**
1.  QA Engineer opens a User Story: "As a user, I want to upload a profile picture..."
2.  Engineer clicks "Generate Test Cases" in the sidebar.
3.  System generates a table of 5 test scenarios (Valid upload, Invalid format, Large file, etc.).
4.  Engineer reviews, deletes one irrelevant case, and clicks "Add to Issue".
5.  The test cases are saved as a pinned comment on the issue.

---

## 5. 🌡️ Team Morale & Burnout Monitor ❌ **NOT IMPLEMENTED**

**Status:** Not yet built  
**What's needed:**
- Sentiment analysis from team comments
- Work pattern detection (after-hours activity)
- Team Health Score (0-100) dashboard widget
- Privacy-focused team-level aggregation
- Alert system for PM when health drops

### **Problem Statement**
Remote work makes it hard to detect when a team is struggling, overworked, or frustrated until it is too late (burnout/attrition).

### **Functional Requirements**
1.  **Passive Monitoring**:
    *   The system should analyze metadata from standard interactions (comments, status updates, commit times).
    *   It must **NOT** be a "spyware" tool (no screen recording, no keystroke logging). It only analyzes *posted* content.
2.  **Risk Indicators**:
    *   **Sentiment**: High frequency of negative or aggressive language in comments.
    *   **Work Patterns**: High volume of activity outside standard working hours (e.g., commits/comments between 10 PM - 5 AM).
    *   **Urgency**: Excessive use of words like "ASAP", "Emergency", "Fix immediately".
3.  **Dashboard Visualization**:
    *   Data must be aggregated to the Team or Project level to protect individual privacy.
    *   A "Team Health Score" (0-100) displayed on the Project Dashboard.
    *   Trend lines showing health over the last 30 days.
4.  **Alerts (Optional)**:
    *   Notify the Project Manager if the Health Score drops below a critical threshold.

### **User Flow**
1.  Project Manager views the "Project Overview" dashboard.
2.  A widget "Team Health" shows a score of 65/100 (Yellow/Warning).
3.  Manager hovers over the score.
4.  Tooltip explains: "Detected high volume of after-hours activity and negative sentiment in 'Backend' channel."
5.  Manager decides to discuss workload balance in the next standup.
