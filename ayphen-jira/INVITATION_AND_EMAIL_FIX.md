# Invitation and Email Notification Fix

## Problem Summary
1.  **500 Internal Server Error**: The backend endpoint `POST /api/project-invitations` was crashing with `invalid input syntax for type uuid` because it was attempting to compare an `email` string against a `userId` UUID column in the database.
2.  **Missing Email Notifications**: The temporary frontend workaround (adding users directly via `projectMembersApi`) bypassed the invitation system, causing users to be added silently without email notifications.

## Solution Implemented

### 1. Backend Fix (`ayphen-jira-backend/src/routes/project-invitations.ts`)
-   Refactored the validation logic to **resolve the user by email first**.
-   The system now retrieves the `User` entity using the provided email.
-   If a user is found, it uses the user's `id` (UUID) to check for existing membership in the `ProjectMember` table.
-   This eliminates the type mismatch error (String vs UUID) that was causing the crash.

### 2. Frontend Restoration (`src/components/InviteModal.tsx`)
-   Reverted the conditional logic that bypassed invitations for existing users.
-   The application now correctly uses the standard `projectInvitationsApi.create` endpoint for **all users**.
-   This ensures that the backend handles the process, including:
    -   Creating the invitation record.
    -   **Sending the Invitation Email** via `emailService`.

## Result
-   **No More Crashes**: Inviting both new and existing users works without 500 errors.
-   **Emails Are Sent**: All invited users (new or existing) will receive an email notification with a link to join the project.
-   **Graceful Handling**: If a user is already a member, the API correctly returns a 400 "User is already a member" error instead of crashing.
