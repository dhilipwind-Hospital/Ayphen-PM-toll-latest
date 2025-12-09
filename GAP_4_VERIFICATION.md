# ✅ GAP 4 Verification Guide: Epic Selection

**Status**: Implemented
**Date**: Dec 7, 2025

---

## 🚀 How to Test

1.  **Navigate to Project Board**
    *   Go to **Board** or **Backlog**.
    *   Click **"Create Issue"** button (top right).

2.  **Select Story Type**
    *   Change "Issue Type" to **Story**.
    *   ✅ Verify that a new dropdown **"Epic Link"** appears.
    *   Verify the helper text: *"Don't leave stories orphaned! Link them to an Epic."*

3.  **Select an Epic**
    *   Click the dropdown. It should list existing Epics in the project.
    *   Select an Epic (e.g., `PROJ-101 User Auth`).

4.  **Create Issue**
    *   Fill Summary and other fields.
    *   Click **Create**.

5.  **Verify Linking**
    *   Open the newly created issue.
    *   In the details, it should show the **Epic Link** (usually in the header or breadcrumbs if implemented, or check the database/API response).
    *   (Note: Gap 3 will visualize this better).

---

## 🛠 Technical Changes Made

*   **Backend**: 
    *   Updated `GET /issues` API to support `type` filtering (used to fetch Epics).
*   **Frontend**:
    *   Updated `CreateIssueModal` to fetch project Epics on load.
    *   Added conditional "Epic Link" field for Stories, Tasks, and Bugs.
    *   Updated creation logic to bind the new issue to the selected Epic.
