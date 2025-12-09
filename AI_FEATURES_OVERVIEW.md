# 🤖 Ayphen AI: The Intelligent Project Manager

You are interacting with **Ayphen AI**, a suite of intelligent agents designed to automate the tedious parts of software delivery.

## 🎯 Core Capabilities

### 1. 🗣️ Voice Command & Navigation (`Cmd+K`)
**"Just say it, and it's done."**
*   **Action:** Activates a voice-controlled command palette.
*   **What it does:**
    *   **Navigation:** "Take me to the Kanban board", "Go to the backlog".
    *   **Creation:** "Create a high-priority bug for the login crash."
    *   **Search:** "Show me all issues assigned to me."
*   **Under the Hood:** Uses Web Speech API for real-time transcription and Natural Language Processing (NLP) to map intent to application actions.

### 2. 📝 Meeting Scribe
**"Turn talk into tasks instantly."**
*   **Action:** Accepts raw meeting transcripts or rough notes.
*   **What it does:**
    *   **Auto-Summarization:** Generates a concise executive summary of the meeting.
    *   **Decision Logging:** Extracts key decisions made during the discussion.
    *   **Issue Generation:** Automatically detects action items ("John to fix the API") and converts them into draft Jira issues.
*   **Under the Hood:** Large Language Model (LLM) analysis to parse unstructured text into structured project data.

### 3. 🤖 PMBot (Autonomous Project Manager)
**"The project manager that never sleeps."**
*   **Action:** Runs in the background to monitor project health.
*   **What it does:**
    *   **Auto-Assignment:** Assigns unassigned issues to the best-fit developer based on workload and expertise.
    *   **Stale Issue Detection:** Identifies tickets that haven't moved in days and nudges the team.
    *   **Smart Triage:** Automatically labels and categorizes incoming bugs (e.g., adding `frontend`, `security` labels based on description).
*   **Under the Hood:** Heuristic algorithms and pattern recognition to optimize team workflow.

### 4. 🔮 Predictive Alerts
**"See the future before it happens."**
*   **Action:** proactively warns about project risks.
*   **What it does:**
    *   Alerts on potential sprint derailments (e.g., "At current velocity, 3 stories will miss the deadline").
    *   Flags high-risk code changes or complex dependencies.

---

## 🚀 How to Explore
1.  **Press `Cmd+K`** (or `Ctrl+K`) anywhere in the app to talk to Ayphen.
2.  **Click the "AI" dropdown** in the top navigation to access the dedicated **AI Features Dashboard**.
3.  **Paste a meeting transcript** into the **Meeting Scribe** to see it magically turn into a plan.
