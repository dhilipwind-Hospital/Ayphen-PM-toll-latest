# ✅ GAP 1 Verification Guide: Test Case Visibility

**Status**: Implemented
**Date**: Dec 7, 2025

---

## 🚀 How to Test

1.  **Start Backend & Frontend**
    *   Ensure port `8500` (Backend) and `1600` (Frontend) are running.

2.  **Navigate to an Issue**
    *   Go to **Board** or **Backlog**.
    *   Click on any **Story** issue (e.g., `PROJ-101`) to open the detail panel.

3.  **Locate "Test Cases" Tab**
    *   In the main content area (where Comments/Attachments are), you should now see a **"🧪 Test Cases"** tab.
    *   Click it. It might be empty.

4.  **Generate Test Cases**
    *   In the right sidebar, scroll down to the **"AI Assistant"** card.
    *   Click the **"Generate Test Cases"** button (flask icon).
    *   Wait for the "Test cases generated" success message.

5.  **Verify Results**
    *   The **"Test Cases"** tab should **automatically refresh** and show a list of 5-10 test cases.
    *   Each test case should show:
        *   Title & Type (Functional/Edge Case/etc)
        *   Description
        *   Steps (expand to view)
        *   Expected Result

6.  **Test Persistence**
    *   Click the **Checkmark (Pass)** or **X (Fail)** icon on a test case.
    *   Refresh the browser page.
    *   Go back to the tab.
    *   ✅ The test cases should still be there, and the status you changed should be preserved.

---

## 🛠 Technical Changes Made

*   **Backend**: 
    *   Updated `AITestCase` entity to link to `Issue`.
    *   Created `test-cases` API routes for CRUD operations.
    *   Updated `AI Test Case Generator` to **save** generated cases to the database immediately.
*   **Frontend**:
    *   Created `TestCaseList` component with status management.
    *   Added `Test Cases` tab to `IssueDetailPanel`.
    *   Implemented auto-refresh when AI generation completes.
