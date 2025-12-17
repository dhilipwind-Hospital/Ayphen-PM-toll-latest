# 👥 Team Integration & Chat Plan

## 1. Team Chat Status
**Status:** ✅ **Fully Integrated**

The Team Chat module (`TeamChatEnhanced.tsx`) has been successfully refactored and integrated.
-   **Connection**: Uses the centralized `api` instance (pointing to `/chat-v2`).
-   **Features**: Real-time messaging (Socket.io), File Attachments, User Mentions (`@`), Issue Linking (`#`).
-   **Security**: Authentication is handled via the global interceptor.

## 2. Teams Management Integration
**Status:** 🟡 **Functional (Requires Refactoring)**

The Teams View (`TeamsView.tsx`) allows creating and managing teams.
-   **Current State**: It connects to the backend and performs CRUD operations successfully.
-   **Tech Debt**: It currently uses direct `axios` calls and a hardcoded `API_URL`.
-   **Refactoring Plan**:
    1.  Create `teamsApi` in `src/services/api.ts` with methods: `getAll`, `create`, `update`, `delete`.
    2.  Update `TeamsView.tsx` to use `teamsApi`.

## 3. Adding Team Members to Project
**Status:** ✅ **Integrated**

There are two levels of member management:

### A. Project Level (The "Pool")
**Location:** **Project Settings > People**
To add a user to the project:
1.  Go to **Project Settings**.
2.  Select the **People** tab.
3.  Click **Add Member**.
4.  This uses the `projectMembersApi` to grant access to the project.

### B. Team Level (The "Squad")
**Location:** **Teams Page**
To organize project members into teams (e.g., "Frontend Team"):
1.  Go to the **Teams** page via the sidebar.
2.  Click **Create Team** or **Edit** an existing team.
3.  Select members from the dropdown (populated by `usersApi.getAll`).

## 4. Implementation Steps (For Developer)

**Do NOT push the following changes to main yet. Review first.**

1.  **Standardize Teams API**:
    -   Open `src/services/api.ts`.
    -   Add `teamsApi` export.
2.  **Clean Up TeamsView**:
    -   Replace `import axios` with `import { teamsApi }`.
    -   Refactor `loadTeams`, `handleCreate`, `handleDelete` to use the service.
3.  **Verify Invitation Flow**:
    -   Ensure `ProjectSettingsView` handles "Invite user by email" if the user doesn't exist in the system yet (Backend dependency).

## 5. Summary
The "Team Chat" is 100% ready. "Teams Management" works but deserves a code cleanup pass to match the simplified architecture of the rest of the app. Member management is fully functional via Project Settings.
