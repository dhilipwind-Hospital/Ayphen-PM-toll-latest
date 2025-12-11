# Board & Backlog Fixes Report

## Date: December 11, 2025
## Status: ✅ FIXED

---

## **1. Dashboard (Board) Issues**
**Issue:** "Dashboard is not getting reflected with issues types" / "Board is empty".
**Root Cause:** The Board view was relying on cached data and not fetching fresh data from the API on load. Also, the "Priority" and "Type" dropdown filters were not wired up to any logic.
**Fix:**
- **Added Data Loading:** `EnhancedBoardView.tsx` now fetches issues and sprints immediately when the project loads.
- **Fixed Filters:** The "All Priority" and "All Types" dropdowns are now fully functional and filter the board columns.

## **2. Active Sprint Order**
**Issue:** Active sprints were not appearing at the top of the backlog list.
**Fix:**
- **Sorting Logic:** Sprints are now sorted automatically: **Active Sprints** first, then **Future Sprints**.
- **Result:** The active sprint will always be the first one in the list.

## **3. Duplicate Sprint Names**
**Issue:** Users could create sprints with the same name (e.g., "New Sprint" and "NEW SPRINT").
**Fix:**
- **Validation:** Added a check in the "Create Sprint" flow. If you try to create a sprint with a name that already exists (case-insensitive), it will show an error message and prevent creation.
- **Existing Duplicates:** You can now use the **Delete Sprint** option (fixed in the previous step) to remove any existing duplicate sprints.

---

## **Action Required**
1.  **Refresh Page:** Reload to get the latest code.
2.  **Verify Board:** Go to the Board view. It should now show issues. Try using the filters at the top.
3.  **Verify Backlog:** Active sprints should be at the top.
4.  **Clean Up:** Delete the duplicate "NEW SPRINT" using the `...` menu.
