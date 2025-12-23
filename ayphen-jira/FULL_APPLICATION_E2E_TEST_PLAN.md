# Ayphen PM Tool - Comprehensive E2E Test Plan

**Version:** 1.0  
**Date:** 2025-12-23  
**Status:** Draft

## 1. Introduction
This document outlines the End-to-End (E2E) test strategy for the Ayphen Project Management tool. The goal is to ensure all critical user journeys function correctly across the application's modular architecture.

## 2. Test Environment
*   **Frontend:** React/Vite Application
*   **Backend:** Node.js/Express API with PostgreSQL
*   **Pre-requisites:**
    *   Valid Admin User account
    *   Valid Member User account
    *   At least one active Project (Scrum & Kanban types)

## 3. Functional Test Scenarios

### 3.1 Authentication & User Management
| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| AUTH-001 | User Login | 1. Enter valid email/password.<br>2. Click Login. | User redirected to Dashboard. specific project data loaded. |
| AUTH-002 | Invalid Login | 1. Enter invalid credentials. | Error message "Invalid credentials" displayed. |
| AUTH-003 | Registration | 1. Complete sign-up form. | Account created, auto-logged in or redirected to login. |
| AUTH-004 | Forgot Password | 1. Request reset link.<br>2. Click link in email (mock). | Redirected to reset password page. |
| AUTH-005 | Team Invite | 1. Admin goes to People > Invite.<br>2. Sends invite to new email. | Email sent. New user can accept and join project. |

### 3.2 Project Management
| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| PROJ-001 | Create Scrum Project | 1. Projects > Create.<br>2. Select Scrum, enter Name/Key. | Project created. Redirected to Board/Backlog. |
| PROJ-002 | Create Kanban Project | 1. Projects > Create.<br>2. Select Kanban. | Project created. Board view loaded. |
| PROJ-003 | Project Settings | 1. Settings > Details.<br>2. Update Name/Avatar. | Changes reflected globally in sidebar/header. |

### 3.3 Issue Tracking (Core)
| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| ISS-001 | Create Epic | 1. Create > Issue Type: Epic.<br>2. Fill Summary. | Epic appears in Roadmap and Epics List. |
| ISS-002 | Create Story/Bug | 1. Create > Select Story/Bug.<br>2. Link to Epic (optional). | Issue created. Appears in Backlog/Board. |
| ISS-003 | Issue Details | 1. Click Issue Key.<br>2. Update Desc, Priority, Assignee. | Details updated. History/Activity log updated. |
| ISS-004 | Comments | 1. Open Issue.<br>2. Add Comment. | Comment appears with timestamp and user. |
| ISS-005 | Subtasks | 1. Open Story.<br>2. Create Subtask. | Subtask linked to parent story within hierarchy. |
| ISS-006 | Workflow Transition | 1. Drag issue col to col (Todo -> Done). | Status updated. Resolution set to Done if final state. |

### 3.4 Agile Planning (Backlog & Sprints)
| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| AGL-001 | Create Sprint | 1. Backlog View > Create Sprint. | New empty sprint container appears. |
| AGL-002 | Plan Sprint | 1. Drag issues from Backlog to Sprint. | Issues associated with Sprint. Stats updated. |
| AGL-003 | Start Sprint | 1. Click "Start Sprint".<br>2. Set dates/Goal. | Sprint becomes Active. Board shows Sprint issues. |
| AGL-004 | Complete Sprint | 1. Click "Complete Sprint".<br>2. Handle incomplete issues. | Sprint moved to history. Issues moved to backlog/next sprint. |
| AGL-005 | Roadmap View | 1. Open Roadmap.<br>2. Drag Epics to timeline. | Dates updated based on timeline position. |

### 3.5 Quality Assurance (QA) Module
| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| QA-001 | Create Manual Case | 1. QA > Test Cases > Create.<br>2. Fill Title, Steps, Exp Result. | Test Case saved. visible in list with 'Created By'. |
| QA-002 | Link Case to Story | 1. Create Case > Select Linked Issue. | Case shows link to Story. Story shows link to Case. |
| QA-003 | Create Test Suite | 1. QA > Suites > Create Suite. | Suite container created. |
| QA-004 | Add Cases to Suite | 1. Suite > Add Test.<br>2. Select multiple > Add. | Cases associated with suite. Duplicates prevented. |
| QA-005 | Run Test Suite | 1. Suite > Run Suite. | New Test Run instance created. Redirect to Runs. |
| QA-006 | Execute Run | 1. Open Run.<br>2. Pass/Fail individual cases. | Status updated. Run progress bar updates. |
| QA-007 | Complete Run | 1. Click "Complete Run". | Run status 'Completed'. Results locked. |

### 3.6 Reports & Dashboards
| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| RPT-001 | Velocity Chart | 1. Reports > Velocity. | Shows bar chart of completed sprint points. |
| RPT-002 | Burndown Chart | 1. Reports > Burndown. | Shows ideal vs actual guide lines for current sprint. |
| DASH-001 | Dashboard Widgets | 1. Dashboard > Add Gadget. | Gadget (e.g., Assigned to Me) appears with data. |

### 3.7 AI Features
| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| AI-001 | Generate Story | 1. Create Issue > AI Generate.<br>2. Enter prompt. | Detailed description and ACs generated. |
| AI-002 | Generate Test Cases | 1. Automation > Gen Tests.<br>2. Select Story. | Relevant test cases generated automatically. |

## 4. Browsers & Devices
*   **Primary:** Chrome (Latest), Firefox (Latest), Safari (Latest).
*   **Resolution:** Desktop (1920x1080), Laptop (1366x768).

## 5. Automation Strategy (Future)
*   **Framework:** Playwright (recommended) or Cypress.
*   **CI/CD:** GitHub Actions to run smoke tests on PR.
