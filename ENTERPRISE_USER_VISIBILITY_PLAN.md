# Enterprise-Grade User Visibility Implementation Plan

## 🚨 Problem Statement
The current implementation of the "People" page exposes **all users** in the system to any logged-in user. This is a critical privacy and security violation in a multi-tenant or multi-project environment (Enterprise context). Users should only be visible to other members of the same project or organization.

## 🛡️ Security & Privacy Goals
1.  **Project Scoping**: Users must only see other users who are members of the same project.
2.  **Context-Aware API**: The backend must enforce visibility rules based on the `projectId` context.
3.  **Role-Based Access Control (RBAC)**: Only authorized project members (Admin/Member) can view the member list. (Viewer roles might be restricted depending on policy).

## 🛠️ Implementation Strategy

### 1. Backend: Secure User Fetching (`users.ts`)
We will modify the `GET /api/users` endpoint to stricter filtering logic:

*   **Input**: Accept `projectId` as a query parameter.
*   **Logic**:
    *   If `projectId` is provided -> Join `User` table with `ProjectMember` table.
    *   Return only users where `ProjectMember.projectId === projectId`.
    *   *Enterprise Add-on*: Verify the `requesterId` (from auth token) is ALSO a member of `projectId`.

**New SQL Logic (TypeORM Equivalent):**
```sql
SELECT u.* FROM users u
INNER JOIN project_members pm ON pm.userId = u.id
WHERE pm.projectId = :projectId
```

### 2. Frontend: Context-Driven Request (`PeoplePage.tsx`)
Update the frontend to strictly request users within the current project scope.

*   **Dependency**: `useStore` hook for `currentProject`.
*   **API Call**: Change `axios.get('/api/users')` to `axios.get('/api/users', { params: { projectId: currentProject.id } })`.
*   **Validation**: If no project is selected, show an empty state or prompt selection.

## 📝 Execution Plan

1.  **Modify Backend API**: Update `ayphen-jira-backend/src/routes/users.ts`.
2.  **Modify Frontend Page**: Update `ayphen-jira/src/pages/PeoplePage.tsx`.
3.  **Verify**: Check that only project-specific users are returned.

---

### ✅ Definition of Done
- [ ] Users endpoint respects `projectId`.
- [ ] People page only lists members of the active project.
- [ ] Global user list is no longer accessible via standard UI navigation.
