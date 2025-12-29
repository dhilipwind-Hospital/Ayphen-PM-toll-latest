# E2E UI Automation Testing Plan
## Ayphen PM Tool - Complete Browser Testing

**Date:** December 29, 2024  
**Application URL:** https://ayphen-pm-toll.vercel.app  
**Testing Tool:** Browser Subagent / Playwright

---

## 1. Testing Scope Overview

### Pages to Test

| Module | Pages | Priority |
|--------|-------|----------|
| **Authentication** | Login, Register, Forgot Password, Email Verification | P0 |
| **Project Management** | Project List, Project Settings, Project Members | P0 |
| **Issue Tracking** | Board, Backlog, Issue Detail, Create Issue | P0 |
| **Agile Planning** | Sprint Planning, Sprint Board, Sprint Reports | P1 |
| **Work Items** | Epics, Stories, Bugs, Subtasks | P1 |
| **Roadmap** | Roadmap View, Timeline, Gantt | P1 |
| **QA Module** | Test Cases, Test Suites, Test Runs | P1 |
| **AI Features** | AI Features Page, PMBot, Meeting Scribe | P2 |
| **Reports** | Velocity, Burndown, Sprint Reports | P2 |
| **Collaboration** | Team Chat, Notifications, Comments | P2 |
| **Settings** | User Profile, Preferences, Calendar | P3 |

---

## 2. Test Execution Plan

### Phase 1: Authentication Flow (10 Test Cases)

| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| AUTH-001 | Login Page Load | Navigate to /login | Login form visible with email, password fields |
| AUTH-002 | Valid Login | Enter valid credentials → Click Sign In | Redirect to Dashboard |
| AUTH-003 | Invalid Login | Enter wrong password → Click Sign In | Error message displayed |
| AUTH-004 | Empty Fields | Click Sign In without entering data | Validation errors shown |
| AUTH-005 | Register Page | Click "Create Account" tab | Registration form visible |
| AUTH-006 | Valid Registration | Fill form → Submit | Account created, verification email sent |
| AUTH-007 | Duplicate Email | Register with existing email | Error: Email already exists |
| AUTH-008 | Forgot Password | Click "Forgot Password" → Enter email | Reset email sent message |
| AUTH-009 | Social Login - GitHub | Click GitHub button | Redirect to GitHub OAuth |
| AUTH-010 | Logout | Click user menu → Logout | Redirect to login page |

---

### Phase 2: Project Management (12 Test Cases)

| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| PROJ-001 | Project List Load | Navigate to /projects | List of user's projects displayed |
| PROJ-002 | Create New Project | Click "Create Project" → Fill form → Submit | Project created, redirected to project |
| PROJ-003 | Select Project | Click on project card | Project context set, sidebar updates |
| PROJ-004 | Project Persistence | Select project → Refresh page | Same project remains selected |
| PROJ-005 | Project Settings | Go to Project Settings | Settings page loads with project info |
| PROJ-006 | Edit Project Name | Change name → Save | Name updated successfully |
| PROJ-007 | Invite Member | Add email → Send invite | Invitation sent notification |
| PROJ-008 | View Members | Go to Members tab | List of project members shown |
| PROJ-009 | Change Member Role | Change role dropdown → Save | Role updated |
| PROJ-010 | Remove Member | Click remove → Confirm | Member removed from project |
| PROJ-011 | Switch Project | Select different project | All pages update to new project context |
| PROJ-012 | Delete Project | Delete project → Confirm | Project removed, redirect to project list |

---

### Phase 3: Issue Tracking (20 Test Cases)

#### Board View
| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| BOARD-001 | Board Load | Navigate to /board | Kanban board with columns displayed |
| BOARD-002 | Column Display | Check columns | To Do, In Progress, Done columns visible |
| BOARD-003 | Issue Cards | View cards in columns | Issue key, title, assignee, priority shown |
| BOARD-004 | Drag Issue | Drag card from To Do to In Progress | Issue status updated, card moves |
| BOARD-005 | Quick Filters | Click "Only My Issues" | Shows only current user's issues |
| BOARD-006 | No Sprint State | View board without active sprint | "No Active Sprint" message shown |

#### Backlog View
| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| BACK-001 | Backlog Load | Navigate to /backlog | Backlog list and sprint section visible |
| BACK-002 | Create Issue | Click "+ Create" → Fill form → Save | Issue created in backlog |
| BACK-003 | Issue Types | Create Epic, Story, Bug, Task | All types create successfully |
| BACK-004 | Drag to Sprint | Drag issue from backlog to sprint | Issue assigned to sprint |
| BACK-005 | Sprint Section | View sprint panel | Sprint name, dates, capacity shown |
| BACK-006 | Start Sprint | Click "Start Sprint" → Confirm | Sprint status changes to Active |

#### Issue Detail
| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| ISSUE-001 | Open Issue | Click on issue card | Issue detail panel/modal opens |
| ISSUE-002 | Edit Title | Change title → Save | Title updated |
| ISSUE-003 | Edit Description | Add description → Save | Description saved |
| ISSUE-004 | Change Status | Select new status | Status updated, board reflects change |
| ISSUE-005 | Assign User | Select assignee | Assignee updated |
| ISSUE-006 | Add Comment | Type comment → Submit | Comment appears in activity |
| ISSUE-007 | Add Attachment | Upload file | File attached to issue |
| ISSUE-008 | Link Issues | Add issue link | Linked issue shown in panel |

---

### Phase 4: Agile Planning (15 Test Cases)

#### Sprint Planning
| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SPR-001 | Sprint Planning Load | Navigate to /sprint-planning | Sprint planning view loads |
| SPR-002 | Create Sprint | Click "Create Sprint" → Fill form | Sprint created |
| SPR-003 | Set Sprint Dates | Select start/end dates | Dates saved |
| SPR-004 | Set Sprint Goal | Enter sprint goal | Goal saved |
| SPR-005 | View Capacity | Check capacity section | Team capacity displayed |

#### Epics
| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| EPIC-001 | Epics Page Load | Navigate to /epics | List of epics displayed |
| EPIC-002 | Create Epic | Click Create → Fill form | Epic created |
| EPIC-003 | Epic Progress | View epic card | Progress bar shows % complete |
| EPIC-004 | Add Story to Epic | Link story to epic | Story appears under epic |
| EPIC-005 | Epic Detail | Click epic | Epic detail page opens |

#### Stories & Bugs
| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| STORY-001 | Stories Page Load | Navigate to /stories | Stories list displayed |
| BUG-001 | Bugs Page Load | Navigate to /bugs | Bugs list displayed |
| BUG-002 | Create Bug | Click Create Bug → Fill form | Bug created with proper type |
| STORY-002 | Story Points | Set story points | Points saved and displayed |
| STORY-003 | Acceptance Criteria | Add acceptance criteria | Criteria saved to story |

---

### Phase 5: Roadmap (8 Test Cases)

| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| ROAD-001 | Roadmap Load | Navigate to /roadmap | Roadmap timeline displayed |
| ROAD-002 | Epic Bars | View epic bars | Colored bars with epic names shown |
| ROAD-003 | Date Range | Check timeline | Correct date range displayed |
| ROAD-004 | View Toggle | Switch Month/Quarter/Year | View updates correctly |
| ROAD-005 | Epic Click | Click on epic bar | Epic detail opens |
| ROAD-006 | Drag Dates | Drag epic bar endpoints | Dates update |
| ROAD-007 | Create Epic | Click "Create Epic" in roadmap | Epic form opens |
| ROAD-008 | No Project State | View without project selected | "No Project Selected" message |

---

### Phase 6: QA Module (15 Test Cases)

#### Test Cases
| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| TC-001 | Test Cases Page | Navigate to Test Cases | Test cases list displayed |
| TC-002 | Create Test Case | Click Create → Fill form | Test case created |
| TC-003 | Test Steps | Add test steps | Steps saved |
| TC-004 | Expected Results | Add expected results | Results saved |

#### Test Suites
| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| TS-001 | Test Suites Page | Navigate to Test Suites | Suites list displayed |
| TS-002 | Create Suite | Click Create → Fill form | Suite created |
| TS-003 | Add Test Cases | Click Add → Select cases | Cases added to suite |
| TS-004 | Suite Details | Click on suite | Suite details with test cases shown |

#### Test Runs
| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| TR-001 | Test Runs Page | Navigate to Test Runs | Runs list displayed |
| TR-002 | Create Run | Click Create → Select suite | Run created |
| TR-003 | Execute Run | Click on run → Execute | Execution page opens |
| TR-004 | Mark Pass | Click Pass on test | Test marked passed |
| TR-005 | Mark Fail | Click Fail → Add note | Test marked failed with note |
| TR-006 | Complete Run | Complete all tests → Finish | Run marked complete |
| TR-007 | Run Results | View completed run | Results summary displayed |

---

### Phase 7: AI Features (10 Test Cases)

| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| AI-001 | AI Features Page | Navigate to /ai-features | AI features dashboard loads |
| AI-002 | PMBot Dashboard | View PMBot tab | Activity stats displayed |
| AI-003 | PMBot Metrics | Check metric cards | Auto-assignments, Stale issues count shown |
| AI-004 | Meeting Scribe | Click Meeting Scribe tab | Meeting scribe form displayed |
| AI-005 | Submit Transcript | Enter transcript → Process | Action items extracted |
| AI-006 | AI Story Generator | Open story generator | Generator form loads |
| AI-007 | Generate Story | Enter prompt → Generate | Story content generated |
| AI-008 | AI Test Generator | Open test generator | Test case generator loads |
| AI-009 | Generate Tests | Select issue → Generate | Test cases generated |
| AI-010 | PMBot Settings | Open settings tab | Settings options displayed |

---

### Phase 8: Reports & Dashboard (10 Test Cases)

| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| RPT-001 | Reports Page | Navigate to /reports | Reports dashboard loads |
| RPT-002 | Velocity Chart | View velocity report | Chart displays sprint velocity |
| RPT-003 | Burndown Chart | View burndown | Burndown chart renders |
| RPT-004 | Sprint Report | Select sprint → View | Sprint summary displayed |
| RPT-005 | Export Report | Click Export | Report downloads |
| DASH-001 | Dashboard Load | Navigate to /dashboard | Dashboard widgets load |
| DASH-002 | Issue Summary | Check issue widget | Issue counts by status |
| DASH-003 | Recent Activity | Check activity feed | Recent activities listed |
| DASH-004 | My Tasks | Check my tasks widget | User's assigned tasks shown |
| DASH-005 | Sprint Progress | Check sprint widget | Current sprint progress bar |

---

### Phase 9: Collaboration (8 Test Cases)

| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| CHAT-001 | Team Chat Load | Navigate to /team-chat | Chat interface loads |
| CHAT-002 | Channel List | View channels | Project channels displayed |
| CHAT-003 | Send Message | Type message → Send | Message appears in chat |
| CHAT-004 | Mention User | Type @user | User mentioned, notification sent |
| NOTIF-001 | Notifications | Click notification bell | Notification panel opens |
| NOTIF-002 | Unread Count | Check badge | Unread count displayed |
| NOTIF-003 | Mark Read | Click notification | Marked as read |
| NOTIF-004 | Notification Settings | Open settings | Notification preferences shown |

---

### Phase 10: Settings & Profile (6 Test Cases)

| Test ID | Test Name | Steps | Expected Result |
|---------|-----------|-------|-----------------|
| SET-001 | Profile Page | Navigate to profile | User profile loads |
| SET-002 | Edit Avatar | Upload new avatar | Avatar updated |
| SET-003 | Edit Name | Change name → Save | Name updated |
| SET-004 | Change Password | Update password | Password changed |
| SET-005 | Theme Toggle | Switch dark/light mode | Theme changes |
| SET-006 | Calendar View | Navigate to calendar | Calendar displays |

---

## 3. Test Data Requirements

| Data Type | Examples Needed |
|-----------|-----------------|
| **Users** | Admin user, Regular user, New user |
| **Projects** | Project with data, Empty project |
| **Issues** | Issues in all statuses, With/without assignee |
| **Sprints** | Active sprint, Completed sprint, Future sprint |
| **Test Cases** | Passed, Failed, Not run |

---

## 4. Execution Order

| Phase | Focus | Test Count | Duration |
|-------|-------|------------|----------|
| 1 | Authentication | 10 | 30 mins |
| 2 | Project Management | 12 | 45 mins |
| 3 | Issue Tracking | 20 | 60 mins |
| 4 | Agile Planning | 15 | 45 mins |
| 5 | Roadmap | 8 | 30 mins |
| 6 | QA Module | 15 | 45 mins |
| 7 | AI Features | 10 | 30 mins |
| 8 | Reports | 10 | 30 mins |
| 9 | Collaboration | 8 | 30 mins |
| 10 | Settings | 6 | 20 mins |
| **Total** | | **114** | **~6 hours** |

---

## 5. Success Criteria

| Criteria | Threshold |
|----------|-----------|
| Pass Rate | > 90% |
| Critical Bugs | 0 |
| High Bugs | < 5 |
| Response Time | < 3 seconds per page |
| Console Errors | 0 critical errors |

---

## 6. Reporting

After each phase, document:
1. **Pass/Fail count**
2. **Screenshots of failures**
3. **Console errors captured**
4. **Performance observations**
5. **UX issues noted**

---

## 7. Ready to Execute

**Prerequisites:**
- [ ] Application is deployed and accessible
- [ ] Test user credentials available
- [ ] Test data seeded in database
- [ ] Browser subagent ready

**Start Command:** "Execute Phase 1: Authentication Flow"
