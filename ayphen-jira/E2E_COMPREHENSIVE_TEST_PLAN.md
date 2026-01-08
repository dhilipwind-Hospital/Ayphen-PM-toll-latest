# Comprehensive E2E Test Plan - Ayphen PM Tool

## Overview

This document outlines the complete E2E test plan for the Ayphen PM Tool application, covering all features and functionality.

**Production URL:** `https://ayphen-pm-toll.vercel.app`  
**Test Credentials:** `dhilipwind+501@gmail.com` / `Demo@501`

---

## Test Modules Summary

| Module | Tests | Priority | Status |
|--------|-------|----------|--------|
| 1. Authentication | 12 | Critical | 🟡 Partial |
| 2. Projects | 10 | Critical | 🟡 Partial |
| 3. Issues (CRUD) | 15 | Critical | ✅ Done |
| 4. Board & Kanban | 8 | High | 🔴 Pending |
| 5. Backlog | 8 | High | 🔴 Pending |
| 6. Sprints | 10 | High | 🔴 Pending |
| 7. Epics | 8 | High | ✅ Done |
| 8. Stories | 8 | High | ✅ Done |
| 9. Bugs | 8 | High | ✅ Done |
| 10. Reports | 6 | Medium | 🔴 Pending |
| 11. Dashboard | 6 | Medium | 🔴 Pending |
| 12. Search & Filters | 8 | Medium | 🔴 Pending |
| 13. People & Teams | 8 | Medium | 🔴 Pending |
| 14. Settings | 10 | Medium | 🔴 Pending |
| 15. Time Tracking | 6 | Medium | 🔴 Pending |
| 16. Calendar | 5 | Low | 🔴 Pending |
| 17. Team Chat | 6 | Low | 🔴 Pending |
| 18. AI Test Automation | 12 | Medium | 🔴 Pending |
| 19. Workflows | 6 | Low | 🔴 Pending |
| 20. Hierarchy | 4 | Low | 🔴 Pending |

**Total Tests:** ~154

---

## Module 1: Authentication (12 Tests)

### Routes: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`

| ID | Test Case | Priority |
|----|-----------|----------|
| AUTH-001 | Login with valid credentials | Critical |
| AUTH-002 | Login with invalid credentials shows error | Critical |
| AUTH-003 | Login with empty fields shows validation | High |
| AUTH-004 | Register new user | Critical |
| AUTH-005 | Register with existing email shows error | High |
| AUTH-006 | Register with weak password shows error | Medium |
| AUTH-007 | Forgot password sends email | High |
| AUTH-008 | Reset password with valid token | High |
| AUTH-009 | Reset password with expired token | Medium |
| AUTH-010 | Email verification flow | Medium |
| AUTH-011 | Logout clears session | High |
| AUTH-012 | Protected routes redirect to login | Critical |

---

## Module 2: Projects (10 Tests)

### Routes: `/projects`, `/projects/create`, `/projects/:id`

| ID | Test Case | Priority |
|----|-----------|----------|
| PROJ-001 | View projects list | Critical |
| PROJ-002 | Create new project with Scrum template | Critical |
| PROJ-003 | Create new project with Kanban template | High |
| PROJ-004 | View project details | High |
| PROJ-005 | Edit project name and description | High |
| PROJ-006 | Delete project | Medium |
| PROJ-007 | Switch between projects | High |
| PROJ-008 | Project settings access | Medium |
| PROJ-009 | Project members management | Medium |
| PROJ-010 | Star/unstar project | Low |

---

## Module 3: Issues CRUD (15 Tests)

### Routes: `/backlog`, `/board`, `/issue/:id`

| ID | Test Case | Priority |
|----|-----------|----------|
| ISS-001 | Create Epic from Epics page | Critical |
| ISS-002 | Create Story from Stories page | Critical |
| ISS-003 | Create Task from Backlog | Critical |
| ISS-004 | Create Bug from Bugs page | Critical |
| ISS-005 | Create Subtask from issue detail | High |
| ISS-006 | View issue detail | High |
| ISS-007 | Edit issue title | High |
| ISS-008 | Edit issue description | High |
| ISS-009 | Change issue status | Critical |
| ISS-010 | Change issue priority | High |
| ISS-011 | Assign issue to user | High |
| ISS-012 | Set issue due date | Medium |
| ISS-013 | Add labels to issue | Medium |
| ISS-014 | Link issue to epic | High |
| ISS-015 | Delete issue | Medium |

---

## Module 4: Board & Kanban (8 Tests)

### Routes: `/board`, `/board-kanban`

| ID | Test Case | Priority |
|----|-----------|----------|
| BRD-001 | View board with columns | Critical |
| BRD-002 | Drag issue between columns | Critical |
| BRD-003 | Filter issues on board | High |
| BRD-004 | Search issues on board | High |
| BRD-005 | View issue detail from board | High |
| BRD-006 | Quick edit issue on board | Medium |
| BRD-007 | Board column WIP limits | Medium |
| BRD-008 | Board swimlanes view | Low |

---

## Module 5: Backlog (8 Tests)

### Routes: `/backlog`

| ID | Test Case | Priority |
|----|-----------|----------|
| BKL-001 | View backlog items | Critical |
| BKL-002 | Create issue from backlog | Critical |
| BKL-003 | Drag issue to sprint | High |
| BKL-004 | Reorder backlog items | High |
| BKL-005 | Filter backlog by type | Medium |
| BKL-006 | Search in backlog | Medium |
| BKL-007 | Bulk select issues | Medium |
| BKL-008 | View sprint sections | High |

---

## Module 6: Sprints (10 Tests)

### Routes: `/sprint-planning`, `/sprint-reports`

| ID | Test Case | Priority |
|----|-----------|----------|
| SPR-001 | View active sprint | Critical |
| SPR-002 | Create new sprint | Critical |
| SPR-003 | Start sprint | Critical |
| SPR-004 | Complete sprint | Critical |
| SPR-005 | Add issues to sprint | High |
| SPR-006 | Remove issues from sprint | High |
| SPR-007 | Edit sprint name/dates | Medium |
| SPR-008 | View sprint burndown chart | Medium |
| SPR-009 | Sprint velocity report | Medium |
| SPR-010 | Sprint planning view | High |

---

## Module 7: Epics (8 Tests)

### Routes: `/epics`, `/epics/board`, `/epic/:id`

| ID | Test Case | Priority |
|----|-----------|----------|
| EPC-001 | View epics list | Critical |
| EPC-002 | Create new epic | Critical |
| EPC-003 | View epic detail | High |
| EPC-004 | Edit epic | High |
| EPC-005 | View epic board | Medium |
| EPC-006 | Link stories to epic | High |
| EPC-007 | View epic progress | Medium |
| EPC-008 | Filter epics by status | Medium |

---

## Module 8: Stories (8 Tests)

### Routes: `/stories`, `/stories/board`

| ID | Test Case | Priority |
|----|-----------|----------|
| STR-001 | View stories list | Critical |
| STR-002 | Create new story | Critical |
| STR-003 | Edit story | High |
| STR-004 | View story board | Medium |
| STR-005 | Add story points | High |
| STR-006 | Link story to epic | High |
| STR-007 | Filter stories | Medium |
| STR-008 | Story acceptance criteria | Medium |

---

## Module 9: Bugs (8 Tests)

### Routes: `/bugs`

| ID | Test Case | Priority |
|----|-----------|----------|
| BUG-001 | View bugs list | Critical |
| BUG-002 | Report new bug | Critical |
| BUG-003 | Edit bug | High |
| BUG-004 | Set bug severity | High |
| BUG-005 | Set bug priority | High |
| BUG-006 | Link bug to story | Medium |
| BUG-007 | Add steps to reproduce | Medium |
| BUG-008 | Filter bugs by severity | Medium |

---

## Module 10: Reports (6 Tests)

### Routes: `/reports`, `/reports/:type`, `/advanced-reports`

| ID | Test Case | Priority |
|----|-----------|----------|
| RPT-001 | View reports dashboard | High |
| RPT-002 | Burndown chart displays | High |
| RPT-003 | Velocity chart displays | Medium |
| RPT-004 | Sprint report | Medium |
| RPT-005 | Advanced reports | Medium |
| RPT-006 | Export report | Low |

---

## Module 11: Dashboard (6 Tests)

### Routes: `/dashboard`

| ID | Test Case | Priority |
|----|-----------|----------|
| DSH-001 | View dashboard | Critical |
| DSH-002 | Quick stats display | High |
| DSH-003 | Recent activity | Medium |
| DSH-004 | Assigned issues widget | Medium |
| DSH-005 | Navigation links work | High |
| DSH-006 | Dashboard refresh | Low |

---

## Module 12: Search & Filters (8 Tests)

### Routes: `/search`, `/filters`, `/filters/saved`, `/filters/advanced`

| ID | Test Case | Priority |
|----|-----------|----------|
| SRH-001 | Global search | High |
| SRH-002 | Advanced search (JQL) | Medium |
| SRH-003 | Create saved filter | Medium |
| SRH-004 | Apply saved filter | Medium |
| SRH-005 | Delete saved filter | Low |
| SRH-006 | Filter by issue type | High |
| SRH-007 | Filter by status | High |
| SRH-008 | Filter by assignee | Medium |

---

## Module 13: People & Teams (8 Tests)

### Routes: `/people`, `/teams`

| ID | Test Case | Priority |
|----|-----------|----------|
| PPL-001 | View people directory | High |
| PPL-002 | View user profile | Medium |
| PPL-003 | Invite team member | High |
| PPL-004 | View teams list | Medium |
| PPL-005 | Create team | Medium |
| PPL-006 | Add member to team | Medium |
| PPL-007 | Remove member from team | Low |
| PPL-008 | Team permissions | Low |

---

## Module 14: Settings (10 Tests)

### Routes: `/settings/profile`, `/settings/notifications`, `/settings/system`, `/settings/issues`

| ID | Test Case | Priority |
|----|-----------|----------|
| SET-001 | View profile settings | High |
| SET-002 | Edit profile name | High |
| SET-003 | Change avatar | Medium |
| SET-004 | Notification preferences | Medium |
| SET-005 | Email notifications toggle | Medium |
| SET-006 | System settings | Low |
| SET-007 | Theme toggle (dark/light) | Medium |
| SET-008 | Issue settings | Low |
| SET-009 | Project settings | Medium |
| SET-010 | Export data | Low |

---

## Module 15: Time Tracking (6 Tests)

### Routes: `/time-tracking`

| ID | Test Case | Priority |
|----|-----------|----------|
| TIM-001 | View time tracking page | Medium |
| TIM-002 | Log time on issue | Medium |
| TIM-003 | Edit time entry | Low |
| TIM-004 | Delete time entry | Low |
| TIM-005 | View time report | Low |
| TIM-006 | Time estimate vs actual | Low |

---

## Module 16: Calendar (5 Tests)

### Routes: `/calendar`

| ID | Test Case | Priority |
|----|-----------|----------|
| CAL-001 | View calendar | Medium |
| CAL-002 | View issues on calendar | Medium |
| CAL-003 | Navigate months | Low |
| CAL-004 | Click issue opens detail | Low |
| CAL-005 | Filter calendar view | Low |

---

## Module 17: Team Chat (6 Tests)

### Routes: `/team-chat`

| ID | Test Case | Priority |
|----|-----------|----------|
| CHT-001 | View team chat | Medium |
| CHT-002 | Send message | Medium |
| CHT-003 | View message history | Low |
| CHT-004 | Mention user | Low |
| CHT-005 | Attach file | Low |
| CHT-006 | Real-time updates | Medium |

---

## Module 18: AI Test Automation (12 Tests)

### Routes: `/ai-test-automation/*`

| ID | Test Case | Priority |
|----|-----------|----------|
| AIT-001 | View requirements page | Medium |
| AIT-002 | Generate stories from requirements | Medium |
| AIT-003 | View generated stories | Medium |
| AIT-004 | View test cases | Medium |
| AIT-005 | Create test case | Medium |
| AIT-006 | View test suites | Medium |
| AIT-007 | Create test suite | Low |
| AIT-008 | Test execution page | Medium |
| AIT-009 | Run test | Low |
| AIT-010 | View test reports | Low |
| AIT-011 | AI insights page | Low |
| AIT-012 | Sync status | Low |

---

## Module 19: Workflows (6 Tests)

### Routes: `/workflows`, `/workflow-editor/:id`

| ID | Test Case | Priority |
|----|-----------|----------|
| WRK-001 | View workflows | Low |
| WRK-002 | Create workflow | Low |
| WRK-003 | Edit workflow | Low |
| WRK-004 | Add workflow step | Low |
| WRK-005 | Delete workflow | Low |
| WRK-006 | Apply workflow to project | Low |

---

## Module 20: Hierarchy & Roadmap (4 Tests)

### Routes: `/hierarchy`, `/roadmap`

| ID | Test Case | Priority |
|----|-----------|----------|
| HIR-001 | View hierarchy | Medium |
| HIR-002 | Expand/collapse nodes | Low |
| HIR-003 | View roadmap | Medium |
| HIR-004 | Roadmap timeline | Low |

---

## Test Execution Order

### Phase 1: Critical Path (Must Pass)
1. Authentication (AUTH-001, AUTH-004, AUTH-011, AUTH-012)
2. Projects (PROJ-001, PROJ-002)
3. Issues CRUD (ISS-001 to ISS-005, ISS-009)
4. Board (BRD-001, BRD-002)
5. Dashboard (DSH-001)

### Phase 2: Core Features
1. Complete Authentication tests
2. Complete Projects tests
3. Complete Issues tests
4. Complete Backlog tests
5. Complete Sprint tests
6. Complete Board tests

### Phase 3: Secondary Features
1. Reports
2. Search & Filters
3. People & Teams
4. Settings
5. Epics, Stories, Bugs

### Phase 4: Advanced Features
1. Time Tracking
2. Calendar
3. Team Chat
4. AI Test Automation
5. Workflows
6. Hierarchy

---

## Directory Structure

```
e2e/
├── tests/
│   ├── auth/
│   │   └── auth.spec.ts
│   ├── projects/
│   │   └── projects.spec.ts
│   ├── issues/
│   │   ├── create-issues.spec.ts
│   │   ├── edit-issues.spec.ts
│   │   └── delete-issues.spec.ts
│   ├── board/
│   │   └── board.spec.ts
│   ├── backlog/
│   │   └── backlog.spec.ts
│   ├── sprints/
│   │   └── sprints.spec.ts
│   ├── epics/
│   │   └── epics.spec.ts
│   ├── stories/
│   │   └── stories.spec.ts
│   ├── bugs/
│   │   └── bugs.spec.ts
│   ├── reports/
│   │   └── reports.spec.ts
│   ├── dashboard/
│   │   └── dashboard.spec.ts
│   ├── search/
│   │   └── search.spec.ts
│   ├── people/
│   │   └── people.spec.ts
│   ├── settings/
│   │   └── settings.spec.ts
│   ├── time-tracking/
│   │   └── time-tracking.spec.ts
│   ├── calendar/
│   │   └── calendar.spec.ts
│   ├── team-chat/
│   │   └── team-chat.spec.ts
│   ├── ai-automation/
│   │   └── ai-automation.spec.ts
│   ├── workflows/
│   │   └── workflows.spec.ts
│   └── hierarchy/
│       └── hierarchy.spec.ts
├── pages/
│   └── (Page Object Models)
├── fixtures/
│   └── auth.fixture.ts
└── utils/
    └── test-data.ts
```

---

## Run Commands

```bash
# Run all tests
npx playwright test --project=chromium

# Run by module
npx playwright test e2e/tests/auth/ --project=chromium
npx playwright test e2e/tests/projects/ --project=chromium
npx playwright test e2e/tests/issues/ --project=chromium

# Run critical path only
npx playwright test --grep "@critical" --project=chromium

# Run with UI
npx playwright test --ui

# Run headed (visible browser)
npx playwright test --headed --project=chromium
```

---

## Setup Requirements

1. **Playwright Config**: Ensure `baseURL` points to production
2. **No Local Server**: Tests run against production URL
3. **Test Credentials**: Use provided test account
4. **Browser**: Chromium recommended

---

## Next Steps

1. ✅ Functional CRUD tests (Complete)
2. 🔲 Implement Board tests
3. 🔲 Implement Sprint tests
4. 🔲 Implement Search tests
5. 🔲 Implement remaining modules

---

*Generated: January 2026*
