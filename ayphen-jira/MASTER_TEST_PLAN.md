# 🎯 AYPHEN PM TOOL - MASTER TEST PLAN
## Complete Application Testing Documentation

**Version:** 3.0 | **Date:** January 7, 2026 | **URL:** https://ayphen-pm-toll.vercel.app

---

# 📊 EXECUTIVE DASHBOARD

## Overall Test Coverage

| Module | Total | ✅ Pass | ⏳ Pending | Coverage |
|--------|-------|---------|------------|----------|
| Authentication | 20 | 15 | 5 | 75% |
| Projects | 25 | 18 | 7 | 72% |
| Issues & Board | 45 | 30 | 15 | 67% |
| Sprints & Agile | 30 | 22 | 8 | 73% |
| QA Module | 25 | 20 | 5 | 80% |
| AI Features | 40 | 15 | 25 | 38% |
| Voice Assistant | 25 | 0 | 25 | 0% |
| Reports | 20 | 15 | 5 | 75% |
| Collaboration | 25 | 12 | 13 | 48% |
| Settings | 20 | 8 | 12 | 40% |
| Time Tracking | 15 | 0 | 15 | 0% |
| Integrations | 10 | 0 | 10 | 0% |
| **TOTAL** | **300** | **155** | **145** | **52%** |

---

# 🔐 PHASE 1: AUTHENTICATION (20 Tests)

## 1.1 Login Flow

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| AUTH-001 | Page Load | Navigate to `/login` | Form with email, password, Sign In button visible | ✅ |
| AUTH-002 | Valid Login | Enter `test@example.com` / valid password → Submit | Redirect to dashboard, user name in header | ✅ |
| AUTH-003 | Invalid Password | Enter wrong password → Submit | "Invalid credentials" error, stay on login | ✅ |
| AUTH-004 | Empty Fields | Click Sign In with empty fields | Validation errors shown | ✅ |
| AUTH-005 | Invalid Email Format | Enter "notanemail" → Submit | "Valid email required" error | ✅ |
| AUTH-006 | Password Visibility | Click eye icon | Password toggles show/hide | ⏳ |
| AUTH-007 | Remember Me | Check remember me → Login → Close/Reopen | Stay logged in | ⏳ |

## 1.2 Registration Flow

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| AUTH-008 | Register Tab | Click "Create Account" | Registration form appears | ✅ |
| AUTH-009 | Valid Registration | Fill all fields correctly → Submit | Account created, verification prompt | ✅ |
| AUTH-010 | Duplicate Email | Register with existing email | "Email already exists" error | ✅ |
| AUTH-011 | Password Mismatch | Enter different confirm password | "Passwords don't match" error | ⏳ |
| AUTH-012 | Weak Password | Enter "123" as password | "Password too weak" with requirements | ⏳ |
| AUTH-013 | Terms Required | Don't check terms → Submit | "Accept terms" error | ⏳ |

## 1.3 Password Recovery & Session

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| AUTH-014 | Forgot Password | Click link → Enter email → Submit | "Check email" message | ✅ |
| AUTH-015 | Reset Password | Click email link → Enter new password | Password changed, can login | ✅ |
| AUTH-016 | GitHub OAuth | Click GitHub button | Redirect to GitHub, return authenticated | ✅ |
| AUTH-017 | Google OAuth | Click Google button | Redirect to Google, return authenticated | ✅ |
| AUTH-018 | Session Persistence | Login → Refresh page | Stay logged in | ✅ |
| AUTH-019 | Logout | Click avatar → Sign Out | Redirect to login, session cleared | ✅ |
| AUTH-020 | Protected Routes | Access `/dashboard` without login | Redirect to login | ✅ |

---

# 📁 PHASE 2: PROJECT MANAGEMENT (25 Tests)

## 2.1 Project List

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| PROJ-001 | Projects Page | Navigate to `/projects` | Project list/grid, Create button | ✅ |
| PROJ-002 | Create Project | Click Create → Fill name "Test", key "TST" → Submit | Project created, appears in list | ✅ |
| PROJ-003 | Project Templates | Create with Scrum template | Pre-configured board columns | ✅ |
| PROJ-004 | Kanban Template | Create with Kanban template | Different workflow | ⏳ |
| PROJ-005 | Select Project | Click on project card | Context set, sidebar updates | ✅ |
| PROJ-006 | Project Persistence | Select project → Refresh | Same project selected | ✅ |
| PROJ-007 | Switch Project | Select Project A → Switch to B | All pages update to B | ✅ |
| PROJ-008 | Star Project | Click star icon | Project marked favorite | ✅ |
| PROJ-009 | Search Projects | Type in search box | Projects filtered | ✅ |
| PROJ-010 | Project Categories | Filter by category | List filtered | ⏳ |

## 2.2 Project Settings

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| PROJ-011 | Settings Page | Navigate to project settings | Settings tabs visible | ✅ |
| PROJ-012 | Edit Name | Change name → Save | Name updated everywhere | ✅ |
| PROJ-013 | Edit Description | Add markdown description → Save | Rendered correctly | ✅ |
| PROJ-014 | Upload Avatar | Upload project image | Avatar shows in header | ⏳ |
| PROJ-015 | Access Settings | Change public/private | Visibility updated | ⏳ |

## 2.3 Project Members

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| PROJ-016 | View Members | Go to Members tab | Member list with roles | ✅ |
| PROJ-017 | Invite by Email | Enter email → Select role → Send | Invitation email sent | ✅ |
| PROJ-018 | Change Role | Change member role dropdown | Role updated | ✅ |
| PROJ-019 | Remove Member | Click remove → Confirm | Member removed | ⏳ |
| PROJ-020 | Accept Invite | Login as invitee → Click link | Member added to project | ✅ |
| PROJ-021 | Pending Invites | View pending invitations | List with resend/cancel options | ✅ |

## 2.4 Project Actions

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| PROJ-022 | Archive Project | Settings → Archive → Confirm | Hidden from active list | ⏳ |
| PROJ-023 | Restore Archived | View archived → Restore | Back in active list | ⏳ |
| PROJ-024 | Delete Project | Settings → Delete → Type name → Confirm | Project and issues deleted | ✅ |
| PROJ-025 | Export Project | Export to JSON/CSV | File downloads with all data | ⏳ |

---

# 📋 PHASE 3: ISSUE MANAGEMENT (45 Tests)

## 3.1 Backlog View

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| BACK-001 | Page Load | Navigate to `/backlog` | Issue list, sprint panel visible | ✅ |
| BACK-002 | Empty State | View empty backlog | "No items" with create prompt | ✅ |
| BACK-003 | Create Bug | Create → Type: Bug → Fill → Submit | Bug icon, appears in list | ✅ |
| BACK-004 | Create Story | Create → Type: Story | Story icon visible | ✅ |
| BACK-005 | Create Task | Create → Type: Task | Task icon visible | ✅ |
| BACK-006 | Create Epic | Create → Type: Epic | Epic styling applied | ✅ |
| BACK-007 | Create Subtask | Open issue → Add subtask | Subtask linked to parent | ✅ |
| BACK-008 | Inline Create | Press Enter → Type → Enter | Quick issue creation | ⏳ |
| BACK-009 | Drag to Sprint | Drag issue to sprint panel | Issue in sprint, count updates | ✅ |
| BACK-010 | Drag Reorder | Drag to reorder in backlog | Priority order saved | ✅ |
| BACK-011 | Bulk Select | Shift+Click multiple | Bulk toolbar appears | ⏳ |
| BACK-012 | Bulk Move | Select 3 → Move to sprint | All moved together | ⏳ |

## 3.2 Board View

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| BOARD-001 | Page Load | Navigate to `/board` | Kanban columns visible | ✅ |
| BOARD-002 | Columns Display | View board | To Do, In Progress, Done columns | ✅ |
| BOARD-003 | Card Display | View card | Key, title, avatar, priority, type | ✅ |
| BOARD-004 | Drag Status | Drag from To Do → In Progress | Status updates, card moves | ✅ |
| BOARD-005 | Drag Reorder | Drag within same column | Order persists | ✅ |
| BOARD-006 | Filter My Issues | Click "Only My Issues" | Shows only assigned to me | ✅ |
| BOARD-007 | Filter by Type | Select "Bugs" filter | Only bugs shown | ⏳ |
| BOARD-008 | Search Board | Type in search | Real-time filtering | ✅ |
| BOARD-009 | No Active Sprint | Board without sprint | "No Active Sprint" message | ✅ |
| BOARD-010 | Swimlanes | Toggle swimlane view | Grouped by assignee/epic | ⏳ |
| BOARD-011 | Card Quick Actions | Hover card → Click menu | Edit, Clone, Delete options | ✅ |

## 3.3 Issue Detail Panel

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| ISSUE-001 | Open Detail | Click any issue | Side panel opens with all fields | ✅ |
| ISSUE-002 | Edit Summary | Click title → Edit → Enter | Title updated | ✅ |
| ISSUE-003 | Edit Description | Click description → Markdown edit → Save | Rendered correctly | ✅ |
| ISSUE-004 | Change Status | Click status → Select new | Status changes, board updates | ✅ |
| ISSUE-005 | Change Priority | Click priority → Select | Priority icon updates | ✅ |
| ISSUE-006 | Assign User | Click assignee → Search → Select | Avatar shown | ✅ |
| ISSUE-007 | Set Story Points | Enter points → Save | Points saved, capacity updates | ✅ |
| ISSUE-008 | Add Labels | Click + → Type/select labels | Labels displayed | ⏳ |
| ISSUE-009 | Set Due Date | Click date → Select | Due date shown, overdue indicator | ⏳ |
| ISSUE-010 | Set Parent Epic | Select parent epic | Linked to epic | ✅ |
| ISSUE-011 | Add Comment | Type comment → Submit | Comment in activity feed | ✅ |
| ISSUE-012 | @Mention | Type @name → Select | User notified | ⏳ |
| ISSUE-013 | View Activity | Click Activity tab | All changes with timestamps | ✅ |
| ISSUE-014 | Upload File | Click attach → Upload | File preview, download link | ⏳ |
| ISSUE-015 | Link Issues | Click Link → Search → Select type | Relationship created | ✅ |
| ISSUE-016 | Delete Issue | More menu → Delete → Confirm | Removed from board/backlog | ✅ |
| ISSUE-017 | Clone Issue | More menu → Clone | New issue with same content | ⏳ |
| ISSUE-018 | Watch Issue | Click Watch | Notifications enabled | ⏳ |
| ISSUE-019 | Vote Issue | Click Vote | Vote count increases | ⏳ |
| ISSUE-020 | Copy Link | Click Copy Link | URL copied to clipboard | ✅ |

---

# 🏃 PHASE 4: SPRINTS & AGILE (30 Tests)

## 4.1 Sprint Management

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| SPR-001 | Create Sprint | Backlog → Create Sprint → Name/dates | Sprint panel created | ✅ |
| SPR-002 | Edit Sprint | Click name → Edit | Name/goal updated | ✅ |
| SPR-003 | Set Dates | Edit → Select start/end | Duration calculated | ✅ |
| SPR-004 | Sprint Goal | Enter goal text | Displayed in header | ✅ |
| SPR-005 | Start Sprint | Add issues → Start Sprint → Confirm | Active, board shows issues | ✅ |
| SPR-006 | Start Empty Sprint | Start with no issues | Warning, allow or cancel | ⏳ |
| SPR-007 | Complete Sprint | Complete → Handle incomplete | Velocity calculated, issues moved | ✅ |
| SPR-008 | Delete Sprint | Delete → Confirm | Issues back to backlog | ⏳ |
| SPR-009 | Multiple Sprints | Create 3 future sprints | All visible, can drag between | ✅ |
| SPR-010 | Sprint Capacity | Set team capacity | Capacity bar, warning if over | ⏳ |

## 4.2 Epic Management

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| EPIC-001 | Epics Page | Navigate to `/epics` | List with progress bars | ✅ |
| EPIC-002 | Create Epic | Create with name, dates, color | Epic created | ✅ |
| EPIC-003 | Epic Progress | View epic with children | % complete bar | ✅ |
| EPIC-004 | Link Story | Edit story → Select epic | Story under epic | ✅ |
| EPIC-005 | Epic Detail | Click epic | Full page with child issues | ✅ |
| EPIC-006 | Epic Timeline | View on roadmap | Bar with dates | ✅ |

## 4.3 Roadmap

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| ROAD-001 | Page Load | Navigate to `/roadmap` | Timeline with epic bars | ✅ |
| ROAD-002 | View Month | Click "Month" toggle | Monthly granularity | ✅ |
| ROAD-003 | View Quarter | Click "Quarter" toggle | Quarterly view | ✅ |
| ROAD-004 | Click Epic | Click on bar | Epic detail opens | ✅ |
| ROAD-005 | Drag Dates | Drag bar endpoint | Dates update | ⏳ |
| ROAD-006 | Create from Timeline | Click empty area | Epic creation with dates | ⏳ |
| ROAD-007 | No Project State | Without project selected | "Select project" message | ✅ |

## 4.4 Sprint Planning

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| PLAN-001 | Planning View | Navigate → `/sprint-planning` | Issues to plan, capacity | ✅ |
| PLAN-002 | View Velocity | Check velocity section | Historical average | ✅ |
| PLAN-003 | Story Point Total | Add issues to sprint | Running total | ✅ |
| PLAN-004 | Filter by Epic | Filter issues | Only epic's issues | ⏳ |
| PLAN-005 | Retrospective | Complete sprint → Open retro | What went well/improve | ⏳ |

---

# 🧪 PHASE 5: QA MODULE (25 Tests)

## 5.1 Test Cases

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| TC-001 | Test Cases Page | Navigate to Test Cases | List with Create button | ✅ |
| TC-002 | Create Test Case | Create → Name, steps, expected | Test created | ✅ |
| TC-003 | Edit Test Case | Click → Modify → Save | Changes saved | ✅ |
| TC-004 | Add Steps | Add action + expected result | Steps saved | ✅ |
| TC-005 | Link to Issue | Link test to story | Bidirectional link | ✅ |
| TC-006 | Delete Test Case | Delete → Confirm | Removed | ✅ |

## 5.2 Test Suites

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| TS-001 | Suites Page | Navigate to Test Suites | List visible | ✅ |
| TS-002 | Create Suite | Create → Name → Save | Suite created | ✅ |
| TS-003 | Add Tests | Open suite → Add tests | Tests added, count updates | ✅ |
| TS-004 | Remove Test | Remove from suite | Test removed | ⏳ |
| TS-005 | Suite Stats | View suite | Pass/fail history | ⏳ |

## 5.3 Test Runs

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| TR-001 | Runs Page | Navigate to Test Runs | List visible | ✅ |
| TR-002 | Create Run | Create → Select suite | Run created | ✅ |
| TR-003 | Execute Test | Open run → Click test | Execution view | ✅ |
| TR-004 | Mark Passed | Execute → Click Pass | Green indicator | ✅ |
| TR-005 | Mark Failed | Execute → Click Fail → Add notes | Red indicator, notes saved | ✅ |
| TR-006 | Skip Test | Click Skip | Gray indicator | ⏳ |
| TR-007 | Complete Run | Execute all → Complete | Summary with stats | ✅ |
| TR-008 | Run Report | View completed run | Charts, details | ✅ |
| TR-009 | Create Bug | Fail → Create Bug | Bug linked to test | ⏳ |
| TR-010 | Rerun Failed | Select failed → Rerun | New run with failures | ⏳ |
| TR-011 | Test History | View test history | All runs for test | ✅ |
| TR-012 | Assign Tester | Assign run to user | User can execute | ✅ |

---

# 🤖 PHASE 6: AI FEATURES (40 Tests)

## 6.1 PMBot

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| AI-001 | Dashboard Load | Navigate to `/ai-features` | Metrics, activity visible | ✅ |
| AI-002 | Activity Metrics | View metric cards | Auto-assigns, recommendations count | ✅ |
| AI-003 | Settings Page | Click Settings tab | All toggles, sliders | ✅ |
| AI-004 | Toggle Auto-Assign | Toggle on/off → Save | Setting persists | ⏳ |
| AI-005 | Confidence Threshold | Set to 80% → Save | Only high confidence actions | ✅ |

## 6.2 AI Auto-Assignment

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| AI-006 | Suggest Button | Open unassigned issue | "AI Suggest" button visible | ✅ |
| AI-007 | Get Suggestion | Click AI Suggest → Wait | User + confidence + reasoning | ⏳ |
| AI-008 | Accept Suggestion | Click Accept | Assignee set | ⏳ |
| AI-009 | Reject Suggestion | Click Dismiss | No change, manual assign | ⏳ |
| AI-010 | Multiple Suggestions | Complex issue | Top 3 candidates ranked | ⏳ |

## 6.3 AI Story Generator

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| AI-011 | Generator Form | Click Story Generator tab | Prompt input ready | ✅ |
| AI-012 | Generate Story | Enter prompt → Generate | Title, description, AC generated | ✅ |
| AI-013 | Edit Generated | Modify content | Changes preserved | ✅ |
| AI-014 | Create from Generated | Click Create Story | Issue created with content | ✅ |
| AI-015 | With Epic Context | Select epic → Generate | Aligned with epic | ⏳ |

## 6.4 Bug AI Analysis

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| AI-016 | Bug AI Panel | Open bug issue | AI Analysis section visible | ✅ |
| AI-017 | Analyze Bug | Click Analyze | Severity, root cause, similar bugs | ⏳ |
| AI-018 | Apply Triage | Click Apply AI Triage | All fields set automatically | ⏳ |
| AI-019 | Similar Bugs | View similar issues | Clickable links, similarity % | ✅ |
| AI-020 | Suggested Fix | View fix suggestion | Code-level recommendation | ⏳ |

## 6.5 AI Test Generator

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| AI-021 | Generator Button | Open story with AC | Generate Tests button visible | ✅ |
| AI-022 | Generate Tests | Click Generate | Test cases with steps | ✅ |
| AI-023 | Create Tests | Click Create All | Tests created, linked | ✅ |
| AI-024 | Select Tests | Choose 2 of 5 → Create | Only selected created | ⏳ |

## 6.6 Other AI Features

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| AI-025 | Auto-Tagging | Click AI Suggest Labels | Labels suggested | ⏳ |
| AI-026 | Smart Priority | Click AI Priority | Priority recommendation | ⏳ |
| AI-027 | Sprint Populate | Click AI Populate Sprint | Issues suggested by capacity | ⏳ |
| AI-028 | Duplicate Detection | Create similar issue | Warning with link | ✅ |
| AI-029 | Merge Duplicates | Confirm duplicate → Merge | Issues combined | ⏳ |
| AI-030 | Meeting Scribe | Paste transcript → Process | Action items extracted | ✅ |
| AI-031 | Create from Scribe | Select items → Create | Issues created | ⏳ |
| AI-032 | Predictive Alerts | View dashboard | Alert cards visible | ⏳ |
| AI-033 | Dismiss Alert | Click X | Alert hidden | ⏳ |
| AI-034 | AI Copilot | Enable Copilot | Suggestions appear | ⏳ |
| AI-035 | Apply Copilot | Click suggestion | Content applied | ⏳ |
| AI-036 | Description Enhance | Click Enhance with AI | Description improved | ⏳ |
| AI-037 | AC Generator | Click Generate AC | Acceptance criteria created | ⏳ |
| AI-038 | Email-to-Issue | Configure email | Issues from email | ⏳ |
| AI-039 | Smart Search | AI-powered search | Semantic results | ⏳ |
| AI-040 | AI Insights | View project insights | Trends, recommendations | ⏳ |

---

# 🎤 PHASE 7: VOICE ASSISTANT (25 Tests)

## 7.1 Voice Activation

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| VOICE-001 | Button Visible | Open issue detail | 🎤 microphone button | ⏳ |
| VOICE-002 | Permission Request | Click voice first time | Browser permission dialog | ⏳ |
| VOICE-003 | Start Listening | Click microphone | Waveform, "Listening..." | ⏳ |
| VOICE-004 | Cancel Voice | Click X while listening | Stops, no action | ⏳ |

## 7.2 Issue Commands

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| VOICE-005 | Change Status | Say "Change status to done" | Status updates | ⏳ |
| VOICE-006 | Set Priority | Say "Set priority to high" | Priority changes | ⏳ |
| VOICE-007 | Assign User | Say "Assign to John" | Assignee set | ⏳ |
| VOICE-008 | Add Comment | Say "Add comment: Starting work" | Comment added | ⏳ |
| VOICE-009 | Set Points | Say "Set story points to 5" | Points updated | ⏳ |

## 7.3 Navigation Commands

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| VOICE-010 | Navigate | Say "Go to backlog" | Page navigates | ⏳ |
| VOICE-011 | Open Issue | Say "Open issue PROJ-45" | Issue detail opens | ⏳ |
| VOICE-012 | Search | Say "Search for login bug" | Search results shown | ⏳ |

## 7.4 Creation Commands

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| VOICE-013 | Create Bug | Say "Create bug: Login fails" | Bug created | ⏳ |
| VOICE-014 | Create Task | Say "Create task review PR" | Task created | ⏳ |

## 7.5 Voice Description

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| VOICE-015 | Description Button | Edit description area | Voice icon visible | ⏳ |
| VOICE-016 | Open Modal | Click voice icon | Recording interface | ⏳ |
| VOICE-017 | Record | Click Start → Speak → Stop | Text transcribed | ⏳ |
| VOICE-018 | Insert Text | Click Insert | Added to description | ⏳ |
| VOICE-019 | Re-record | Click Record Again | Previous cleared | ⏳ |

## 7.6 Voice Intelligence

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| VOICE-020 | Command Preview | Speak command | Preview before apply | ⏳ |
| VOICE-021 | Confidence Bar | View after speaking | Green/yellow/red indicator | ⏳ |
| VOICE-022 | Unknown Command | Speak unclear | "Didn't understand" + retry | ⏳ |
| VOICE-023 | Batch Command | Say "Mark done and assign to me" | Both actions execute | ⏳ |
| VOICE-024 | Learn Commands | Use repeatedly | Improves accuracy | ⏳ |
| VOICE-025 | Offline Mode | No internet | "Offline" message | ⏳ |

---

# 📊 PHASE 8: REPORTS (20 Tests)

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| RPT-001 | Reports Page | Navigate to `/reports` | Dashboard with options | ✅ |
| RPT-002 | Velocity Chart | View velocity report | Sprint-over-sprint bars | ✅ |
| RPT-003 | Burndown | Select sprint → View | Ideal vs actual lines | ✅ |
| RPT-004 | Sprint Report | Select sprint | Summary, completed/incomplete | ✅ |
| RPT-005 | Cumulative Flow | View CFD | Stacked area chart | ⏳ |
| RPT-006 | Created vs Resolved | View trend | Line chart | ⏳ |
| RPT-007 | Export PDF | Click Export PDF | PDF downloads | ⏳ |
| RPT-008 | Export CSV | Click Export CSV | CSV downloads | ⏳ |
| RPT-009 | Date Filter | Select range | Charts update | ✅ |
| RPT-010 | Dashboard Widgets | View dashboard | All widgets loaded | ✅ |
| RPT-011 | Issue Summary | View widget | Pie/bar by status | ✅ |
| RPT-012 | Recent Activity | View feed | Changes with timestamps | ✅ |
| RPT-013 | My Tasks | View widget | My assigned issues | ✅ |
| RPT-014 | Sprint Progress | View widget | Progress bar, days left | ✅ |
| RPT-015 | Cycle Time | View report | Average completion time | ⏳ |
| RPT-016 | Lead Time | View report | Request to delivery | ⏳ |
| RPT-017 | Team Performance | View per-person | Issues by member | ⏳ |
| RPT-018 | Custom Dashboard | Add/remove widgets | Layout saved | ✅ |
| RPT-019 | Share Dashboard | Share with team | Others can view | ✅ |
| RPT-020 | Refresh Data | Click refresh | Updated numbers | ✅ |

---

# 💬 PHASE 9: COLLABORATION (25 Tests)

## 9.1 Team Chat

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| CHAT-001 | Chat Page | Navigate to `/team-chat` | Channels, messages | ✅ |
| CHAT-002 | Channel List | View sidebar | Project channels visible | ✅ |
| CHAT-003 | Select Channel | Click channel | Messages load | ✅ |
| CHAT-004 | Send Message | Type → Enter | Message appears | ✅ |
| CHAT-005 | @Mention | Type @ → Select user | Autocomplete, highlighted | ⏳ |
| CHAT-006 | #Link Issue | Type # → Select | Issue linked | ⏳ |
| CHAT-007 | Create Channel | Click + → Name → Create | Channel created | ⏳ |
| CHAT-008 | Delete Channel | Delete → Confirm | Channel removed | ⏳ |
| CHAT-009 | Reply Thread | Click reply icon | Thread opens | ⏳ |
| CHAT-010 | React Emoji | Click + emoji | Reaction added | ⏳ |
| CHAT-011 | Unread Badge | New message in other channel | Badge visible | ⏳ |
| CHAT-012 | Mark Read | Open unread channel | Badge clears | ⏳ |

## 9.2 Notifications

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| NOTIF-001 | Bell Icon | Click notification bell | Dropdown opens | ✅ |
| NOTIF-002 | Unread Count | Have unread notifications | Badge number shown | ✅ |
| NOTIF-003 | Click Notification | Click item | Navigates, marks read | ✅ |
| NOTIF-004 | Mark All Read | Click "Mark all read" | All cleared | ⏳ |
| NOTIF-005 | Settings | Go to notification settings | Preferences visible | ⏳ |
| NOTIF-006 | Email Notification | Get assigned | Email received | ⏳ |
| NOTIF-007 | Teams Webhook | Configure → Trigger | Message in Teams | ⏳ |
| NOTIF-008 | Real-time Update | Another user changes | UI updates live | ⏳ |

## 9.3 Comments & Mentions

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| COMM-001 | Add Comment | Type → Save | Comment in activity | ✅ |
| COMM-002 | Edit Comment | Click edit → Modify → Save | "Edited" indicator | ⏳ |
| COMM-003 | Delete Comment | Click delete → Confirm | Comment removed | ⏳ |
| COMM-004 | Mention in Comment | Type @user | User notified | ⏳ |
| COMM-005 | Rich Text | Markdown in comment | Rendered correctly | ✅ |

---

# ⚙️ PHASE 10: SETTINGS (20 Tests)

## 10.1 User Settings

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| SET-001 | Profile Page | Navigate to profile | User info, edit options | ✅ |
| SET-002 | Edit Name | Change → Save | Updated everywhere | ✅ |
| SET-003 | Edit Avatar | Upload image | Avatar updated | ⏳ |
| SET-004 | Change Password | Current → New → Confirm | Password changed | ⏳ |
| SET-005 | Theme Toggle | Switch dark/light | Theme persists | ✅ |
| SET-006 | Language | Select language | UI language changes | ⏳ |
| SET-007 | Calendar View | Navigate to calendar | Issues with dates shown | ✅ |

## 10.2 Admin Features

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| ADM-001 | Admin Panel | Login as admin → Admin | Panel loads | ⏳ |
| ADM-002 | User Management | View all users | List with actions | ⏳ |
| ADM-003 | Create User | Add User → Fill | User can login | ⏳ |
| ADM-004 | Deactivate User | Select → Deactivate | Cannot login | ⏳ |
| ADM-005 | Audit Logs | View audit logs | Action history | ⏳ |

## 10.3 Advanced Settings

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| ADV-001 | Custom Fields | Create field → Add to project | Available in issues | ⏳ |
| ADV-002 | Custom Workflow | Create workflow | Usable in project | ⏳ |
| ADV-003 | Automation Rules | Create rule → Trigger | Rule fires | ⏳ |
| ADV-004 | Issue Templates | Create → Use | Prefilled issue | ⏳ |
| ADV-005 | Webhooks | Configure → Test | Webhook fires | ⏳ |
| ADV-006 | Apps | View apps → Enable | Integration active | ⏳ |
| ADV-007 | Shortcuts | Press ? | Shortcuts list | ⏳ |
| ADV-008 | API Token | Generate token | Can use API | ⏳ |

---

# ⏱️ PHASE 11: TIME TRACKING (15 Tests)

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| TIME-001 | Time Page | Navigate to Time Tracking | Timer, entries visible | ⏳ |
| TIME-002 | Start Timer | Select issue → Start | Timer running | ⏳ |
| TIME-003 | Pause Timer | Click Pause | Timer paused | ⏳ |
| TIME-004 | Stop Timer | Click Stop → Add notes | Entry logged | ⏳ |
| TIME-005 | Manual Entry | Add Entry → Duration → Save | Entry created | ⏳ |
| TIME-006 | Edit Entry | Click → Modify → Save | Entry updated | ⏳ |
| TIME-007 | Delete Entry | Delete → Confirm | Entry removed | ⏳ |
| TIME-008 | Time in Issue | View issue detail | Time spent shown | ⏳ |
| TIME-009 | Daily Summary | View today | Total time, breakdown | ⏳ |
| TIME-010 | Weekly Report | View week | Daily totals | ⏳ |
| TIME-011 | Export | Click Export | CSV downloads | ⏳ |
| TIME-012 | Billable Toggle | Mark billable | Separate in reports | ⏳ |
| TIME-013 | Multiple Timers | Start on different issues | Only one active | ⏳ |
| TIME-014 | Time Estimates | Set estimate → Log time | Remaining calculated | ⏳ |
| TIME-015 | Team Timesheet | Admin view | All members' time | ⏳ |

---

# 🔗 PHASE 12: INTEGRATIONS (10 Tests)

| ID | Test Case | Steps | Expected | Status |
|----|-----------|-------|----------|--------|
| INT-001 | GitHub OAuth | Click GitHub login | Auth successful | ⏳ |
| INT-002 | Teams Webhook | Add URL → Save | Configured | ⏳ |
| INT-003 | Teams Notification | Trigger event | Message received | ⏳ |
| INT-004 | Email-to-Issue | Configure → Send email | Issue created | ⏳ |
| INT-005 | Import CSV | Upload → Map fields | Issues created | ⏳ |
| INT-006 | Export JSON | Export project | File downloads | ⏳ |
| INT-007 | Slack | Connect Slack | Notifications work | ⏳ |
| INT-008 | Calendar Sync | Connect calendar | Due dates sync | ⏳ |
| INT-009 | API Token | Generate → Use | API works | ⏳ |
| INT-010 | Webhook Test | Click Test | Payload sent | ⏳ |

---

# 📈 EXECUTION PLAN

## Priority Order

| Week | Focus | Tests | Hours |
|------|-------|-------|-------|
| 1 | Auth + Projects + Core Issues | 90 | 8 |
| 2 | Sprints + QA + Reports | 75 | 7 |
| 3 | AI Features + Collaboration | 65 | 7 |
| 4 | Voice + Time + Integrations | 70 | 6 |

## Success Criteria

| Metric | Target |
|--------|--------|
| Pass Rate | > 95% |
| Critical Bugs | 0 |
| High Bugs | < 5 |
| Response Time | < 3s |
| Test Coverage | > 90% |

---

*Last Updated: January 7, 2026*
