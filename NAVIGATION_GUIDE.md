# ✅ Application Restarted Successfully

I have restarted both the frontend and backend servers. You can now verify the features.

# 🧭 Navigation & Verification Guide

You are currently in the **Backlog** view, but some of the new AI features are located in other specific views. Here is exactly where to go to verify each feature:

## 1. Sprint Auto-Population ⚡️
**Where:** Sprint Planning View
**URL:** `/sprint-planning`
**How to get there:**
1.  **Look at the Sidebar:** I have just added a **"Sprint Planning"** link to your project sidebar, right below "Backlog".
2.  **Click it:** This will take you to the dedicated Sprint Planning view.
3.  **What to look for:** A button labeled **"Auto-Populate Sprint"** near the sprint selection dropdown.

## 2. Test Case Generation 🧪
**Where:** Issue Detail View
**How to get there:**
1.  You need to open a specific **Story** issue.
2.  Since your backlog is empty, first **Create a Story**:
    *   Click the **"Create"** button in the top navigation.
    *   Select Issue Type: **Story**.
    *   Fill in a summary (e.g., "User Login Feature").
    *   Click "Create".
3.  **Open the Issue:** Click on the issue key (e.g., `HEN-1`) to open its detail page.
4.  **What to look for:** Look at the **Right Sidebar** under the **"🤖 AI Assistant"** section. You should now see a button labeled **"Generate Test Cases"** (it might be blue/gradient colored).

## 3. Gatekeeper Bot (Duplicate Detection) 🤖
**Where:** Create Issue Modal
**How to verify:**
1.  Click the **"Create"** button.
2.  Enter a summary that is **identical** to an existing issue (e.g., if you just created "User Login Feature", try creating another issue with the exact same summary).
3.  **What to look for:** The **Gatekeeper Bot** modal should pop up, warning you about the duplicate and suggesting you update the existing issue instead.

## 4. Notification Filtering 🔔
**Where:** Global Header
**How to verify:**
1.  Click the **Bell Icon** in the top right corner of the application header.
2.  **What to look for:** A toggle switch labeled **"AI Filter"** inside the notification panel.

## 5. Email Integration 📧
**Where:** Project Settings
**How to get there:**
1.  Go to **Project Settings** (usually a gear icon in the project sidebar or `/settings/email-integration`).
2.  **What to look for:** A tab or section for **"Email Integration"** where you can configure the email-to-issue settings.

---

### regarding "Write Test Plan"
The **"AI Test Automation"** section you see in the sidebar is for *managing* your test suites, runs, and reports.
*   **To Generate Tests:** Go to the **Issue Detail** page as described above.
*   **To Manage/View Tests:** Use the "AI Test Automation" sidebar links.

**Next Step:** Please try navigating to `/sprint-planning` to see the Sprint Auto-Population feature.
