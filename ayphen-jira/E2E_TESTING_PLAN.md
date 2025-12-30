# E2E & Integration Testing Plan - Ayphen PM Tool

## Overview

This document outlines the comprehensive End-to-End (E2E) and Integration testing strategy for the Ayphen PM Tool using **Playwright**.

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Test Framework | Playwright |
| Language | TypeScript |
| Assertion Library | Playwright's built-in expect |
| Reporting | Playwright HTML Reporter |
| CI/CD | GitHub Actions |
| Test Data | Faker.js for dynamic data |

---

## Directory Structure

```
ayphen-jira/
├── e2e/
│   ├── fixtures/
│   │   ├── auth.fixture.ts          # Authentication helpers
│   │   ├── project.fixture.ts       # Project creation helpers
│   │   └── issue.fixture.ts         # Issue creation helpers
│   ├── pages/
│   │   ├── LoginPage.ts             # Login page object
│   │   ├── RegisterPage.ts          # Register page object
│   │   ├── DashboardPage.ts         # Dashboard page object
│   │   ├── ProjectPage.ts           # Project page object
│   │   ├── BacklogPage.ts           # Backlog page object
│   │   ├── BoardPage.ts             # Board page object
│   │   ├── SprintPage.ts            # Sprint planning page object
│   │   └── IssueDetailPage.ts       # Issue detail page object
│   ├── tests/
│   │   ├── auth/
│   │   │   ├── register.spec.ts
│   │   │   ├── login.spec.ts
│   │   │   └── logout.spec.ts
│   │   ├── projects/
│   │   │   ├── create-project.spec.ts
│   │   │   ├── edit-project.spec.ts
│   │   │   ├── delete-project.spec.ts
│   │   │   └── project-settings.spec.ts
│   │   ├── issues/
│   │   │   ├── epic.spec.ts
│   │   │   ├── story.spec.ts
│   │   │   ├── task.spec.ts
│   │   │   ├── bug.spec.ts
│   │   │   ├── subtask.spec.ts
│   │   │   └── issue-transitions.spec.ts
│   │   ├── sprints/
│   │   │   ├── create-sprint.spec.ts
│   │   │   ├── start-sprint.spec.ts
│   │   │   ├── complete-sprint.spec.ts
│   │   │   └── sprint-board.spec.ts
│   │   ├── backlog/
│   │   │   ├── drag-drop.spec.ts
│   │   │   ├── reorder.spec.ts
│   │   │   └── filters.spec.ts
│   │   ├── board/
│   │   │   ├── kanban-board.spec.ts
│   │   │   ├── column-transitions.spec.ts
│   │   │   └── quick-filters.spec.ts
│   │   ├── time-tracking/
│   │   │   ├── timer.spec.ts
│   │   │   ├── log-work.spec.ts
│   │   │   └── work-reports.spec.ts
│   │   └── integration/
│   │       ├── full-workflow.spec.ts
│   │       └── multi-user.spec.ts
│   ├── utils/
│   │   ├── test-data.ts             # Test data generators
│   │   ├── api-helpers.ts           # API call helpers
│   │   └── wait-helpers.ts          # Custom wait utilities
│   ├── playwright.config.ts
│   └── global-setup.ts
├── package.json
└── tsconfig.json
```

---

## Test Scenarios

### 1. Authentication Module

#### 1.1 User Registration (`register.spec.ts`)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| REG-001 | Successful registration | 1. Navigate to /register<br>2. Fill valid email, password, name<br>3. Click Register | User created, redirected to login |
| REG-002 | Registration with existing email | 1. Register with existing email | Error: "Email already exists" |
| REG-003 | Registration with weak password | 1. Enter password < 8 chars | Validation error shown |
| REG-004 | Registration with invalid email | 1. Enter "invalid-email" | Validation error shown |
| REG-005 | Empty form submission | 1. Click Register without data | All required fields show errors |
| REG-006 | Password confirmation mismatch | 1. Enter different passwords | Error: "Passwords don't match" |

#### 1.2 User Login (`login.spec.ts`)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| LOG-001 | Successful login | 1. Enter valid credentials<br>2. Click Login | Redirected to dashboard |
| LOG-002 | Login with wrong password | 1. Enter wrong password | Error: "Invalid credentials" |
| LOG-003 | Login with non-existent user | 1. Enter unknown email | Error: "User not found" |
| LOG-004 | Remember me functionality | 1. Check "Remember me"<br>2. Login<br>3. Close & reopen browser | User stays logged in |
| LOG-005 | Session timeout handling | 1. Login<br>2. Wait for session expiry<br>3. Try action | Redirected to login |

#### 1.3 Logout (`logout.spec.ts`)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| LGO-001 | Successful logout | 1. Click user menu<br>2. Click Logout | Redirected to login, session cleared |
| LGO-002 | Protected route after logout | 1. Logout<br>2. Navigate to /dashboard | Redirected to login |

---

### 2. Project Management Module

#### 2.1 Create Project (`create-project.spec.ts`)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| PRJ-001 | Create Scrum project | 1. Click "+ Create"<br>2. Select "Scrum"<br>3. Fill name, key<br>4. Submit | Project created, navigated to board |
| PRJ-002 | Create Kanban project | 1. Click "+ Create"<br>2. Select "Kanban"<br>3. Fill details | Project created with Kanban board |
| PRJ-003 | Duplicate project key | 1. Create project with existing key | Error: "Project key already exists" |
| PRJ-004 | Project key auto-generation | 1. Enter project name | Key auto-generated from name |
| PRJ-005 | Create project with description | 1. Fill all optional fields | Project has description |
| PRJ-006 | Cancel project creation | 1. Fill form<br>2. Click Cancel | Modal closed, no project created |

#### 2.2 Edit Project (`edit-project.spec.ts`)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| PRJ-010 | Edit project name | 1. Go to Project Settings<br>2. Change name<br>3. Save | Name updated |
| PRJ-011 | Edit project description | 1. Update description | Description saved |
| PRJ-012 | Change project lead | 1. Select new lead | Lead updated |

#### 2.3 Delete Project (`delete-project.spec.ts`)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| PRJ-020 | Delete project | 1. Go to Settings<br>2. Click Delete<br>3. Confirm | Project deleted |
| PRJ-021 | Cancel deletion | 1. Click Delete<br>2. Cancel confirmation | Project remains |

---

### 3. Issue Management Module

#### 3.1 Epic (`epic.spec.ts`)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| EPC-001 | Create epic | 1. Click "+ Create"<br>2. Type: Epic<br>3. Fill summary | Epic created |
| EPC-002 | Create epic with all fields | 1. Fill summary, description, labels, dates | All fields saved |
| EPC-003 | View epic | 1. Click on epic in list | Epic detail panel opens |
| EPC-004 | Edit epic | 1. Open epic<br>2. Edit summary<br>3. Click outside | Changes saved inline |
| EPC-005 | Delete epic | 1. Open epic<br>2. Click Delete<br>3. Confirm | Epic deleted |
| EPC-006 | Link stories to epic | 1. Create story<br>2. Set Epic Link | Story appears under epic |
| EPC-007 | Epic progress tracking | 1. Complete stories under epic | Epic progress updates |
| EPC-008 | Epic color assignment | 1. Set epic color | Color shows on linked issues |

#### 3.2 User Story (`story.spec.ts`)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| STR-001 | Create story | 1. Click "+ Create"<br>2. Type: Story<br>3. Fill summary | Story created |
| STR-002 | Create story with acceptance criteria | 1. Add description with criteria | Criteria saved |
| STR-003 | Assign story to sprint | 1. Set sprint field | Story appears in sprint |
| STR-004 | Set story points | 1. Set points (1,2,3,5,8,13) | Points saved and displayed |
| STR-005 | Assign story to user | 1. Select assignee | Assignee avatar shown |
| STR-006 | Set story priority | 1. Select priority | Priority badge shown |
| STR-007 | Add labels to story | 1. Add labels | Labels displayed |
| STR-008 | Link story to epic | 1. Set Epic Link | Epic name shown on story |
| STR-009 | Create subtask from story | 1. Click "Add Subtask" | Subtask created under story |
| STR-010 | Story status transitions | 1. Drag to "In Progress" | Status changes |

#### 3.3 Task (`task.spec.ts`)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| TSK-001 | Create task | 1. Create with type "Task" | Task created |
| TSK-002 | Create task from quick create | 1. Use inline create | Task created quickly |
| TSK-003 | Set task due date | 1. Set due date | Due date shown |
| TSK-004 | Task time tracking | 1. Log time on task | Time tracked |
| TSK-005 | Convert task to story | 1. Click "Convert to Story" | Type changes to Story |

#### 3.4 Bug (`bug.spec.ts`)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| BUG-001 | Create bug | 1. Create with type "Bug" | Bug icon shown |
| BUG-002 | Set bug severity | 1. Set priority to "Highest" | Red indicator shown |
| BUG-003 | Add steps to reproduce | 1. Add description | Steps saved |
| BUG-004 | Link bug to story | 1. Link as "blocks" | Link relationship created |
| BUG-005 | Bug triage flow | 1. Create<br>2. Assign<br>3. Fix<br>4. Close | Full lifecycle works |
| BUG-006 | Reopen closed bug | 1. Reopen bug | Status back to TODO |

#### 3.5 Subtask (`subtask.spec.ts`)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| SUB-001 | Create subtask | 1. Open parent<br>2. Add subtask | Subtask linked to parent |
| SUB-002 | Complete subtask | 1. Mark subtask done | Parent progress updates |
| SUB-003 | Delete subtask | 1. Delete subtask | Removed from parent |
| SUB-004 | Move subtask to different parent | 1. Change parent | Subtask moves |
| SUB-005 | Convert subtask to story | 1. Convert | Subtask becomes standalone story |

#### 3.6 Issue Transitions (`issue-transitions.spec.ts`)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| TRN-001 | TODO → In Progress | 1. Start work on issue | Status changes |
| TRN-002 | In Progress → In Review | 1. Submit for review | Status changes |
| TRN-003 | In Review → Done | 1. Complete review | Issue marked done |
| TRN-004 | Reopen Done issue | 1. Reopen | Status back to TODO |
| TRN-005 | Invalid transition blocked | 1. Try TODO → Done directly | Blocked by workflow |
| TRN-006 | Drag on board changes status | 1. Drag card to column | Status matches column |

---

### 4. Sprint Management Module

#### 4.1 Create Sprint (`create-sprint.spec.ts`)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| SPR-001 | Create sprint | 1. Click "+ Create Sprint" | Sprint container created |
| SPR-002 | Auto-name sprint | 1. Create sprint | Named "Project Sprint N" |
| SPR-003 | Create multiple sprints | 1. Create 3 sprints | All show in backlog |

#### 4.2 Start Sprint (`start-sprint.spec.ts`)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| SPR-010 | Start sprint | 1. Click "Start Sprint"<br>2. Set dates<br>3. Confirm | Sprint status = Active |
| SPR-011 | Prevent multiple active sprints | 1. Try to start 2nd sprint | Error message shown |
| SPR-012 | Set sprint goal | 1. Add goal | Goal displayed |
| SPR-013 | Set sprint duration | 1. Set 2 weeks | End date auto-calculated |

#### 4.3 Complete Sprint (`complete-sprint.spec.ts`)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| SPR-020 | Complete sprint - move to backlog | 1. Complete sprint<br>2. Select "Move to Backlog" | Incomplete issues in backlog |
| SPR-021 | Complete sprint - move to next | 1. Select "Move to Next Sprint" | Issues in next sprint |
| SPR-022 | Complete sprint - create new | 1. Select "Create New Sprint" | New sprint with issues |
| SPR-023 | Sprint retrospective | 1. Add retrospective notes | Notes saved |
| SPR-024 | Sprint velocity report | 1. View after completion | Velocity calculated |

---

### 5. Backlog Module

#### 5.1 Drag and Drop (`drag-drop.spec.ts`)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| BKL-001 | Drag issue to sprint | 1. Drag from backlog to sprint | Issue in sprint, status=TODO |
| BKL-002 | Drag issue to backlog | 1. Drag from sprint to backlog | Issue in backlog, status=backlog |
| BKL-003 | Reorder within sprint | 1. Drag issue up/down | Order preserved |
| BKL-004 | Drag between sprints | 1. Drag from Sprint 1 to Sprint 2 | Issue moves |

#### 5.2 Filters (`filters.spec.ts`)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| BKL-010 | Filter by type | 1. Select "Bug" filter | Only bugs shown |
| BKL-011 | Filter by assignee | 1. Select assignee | Only their issues shown |
| BKL-012 | Search issues | 1. Type in search | Matching issues shown |
| BKL-013 | Clear filters | 1. Click "Clear" | All issues shown |

---

### 6. Board Module

#### 6.1 Kanban Board (`kanban-board.spec.ts`)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| BRD-001 | View board | 1. Navigate to board | Columns and cards shown |
| BRD-002 | Drag card between columns | 1. Drag card | Status changes |
| BRD-003 | Card details on hover | 1. Hover card | Quick info shown |
| BRD-004 | Click card opens detail | 1. Click card | Detail panel opens |

#### 6.2 Quick Filters (`quick-filters.spec.ts`)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| BRD-010 | Only My Issues | 1. Toggle filter | Only assigned issues |
| BRD-011 | Blocked filter | 1. Toggle filter | Only blocked issues |
| BRD-012 | High Priority | 1. Toggle filter | Only high priority |

---

### 7. Time Tracking Module

#### 7.1 Timer (`timer.spec.ts`)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| TIM-001 | Start timer | 1. Select issue<br>2. Click Play | Timer starts counting |
| TIM-002 | Pause timer | 1. Click Pause | Timer pauses |
| TIM-003 | Stop and log | 1. Click Stop | Work log created |
| TIM-004 | Timer persists | 1. Start timer<br>2. Navigate away<br>3. Return | Timer still running |

#### 7.2 Log Work (`log-work.spec.ts`)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| TIM-010 | Log work manually | 1. Click "Log Work"<br>2. Enter time<br>3. Save | Work log created |
| TIM-011 | Edit work log | 1. Edit existing log | Log updated |
| TIM-012 | Delete work log | 1. Delete log | Log removed |

---

### 8. Integration Tests

#### 8.1 Full Workflow (`full-workflow.spec.ts`)

| Test ID | Scenario | Steps | Expected Result |
|---------|----------|-------|-----------------|
| INT-001 | Complete Scrum cycle | 1. Create project<br>2. Create backlog<br>3. Plan sprint<br>4. Start sprint<br>5. Work issues<br>6. Complete sprint | Full cycle works |
| INT-002 | Epic to delivery | 1. Create epic<br>2. Break into stories<br>3. Add subtasks<br>4. Complete all | Epic 100% done |

---

## Page Object Model Examples

### LoginPage.ts

```typescript
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.locator('button:has-text("Login")');
    this.errorMessage = page.locator('.ant-message-error');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }

  async expectLoggedIn() {
    await expect(this.page).toHaveURL(/.*dashboard/);
  }
}
```

### BacklogPage.ts

```typescript
import { Page, Locator, expect } from '@playwright/test';

export class BacklogPage {
  readonly page: Page;
  readonly createIssueButton: Locator;
  readonly sprintContainers: Locator;
  readonly backlogContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createIssueButton = page.locator('button:has-text("Create Issue")');
    this.sprintContainers = page.locator('[data-testid="sprint-container"]');
    this.backlogContainer = page.locator('[data-testid="backlog-container"]');
  }

  async goto() {
    await this.page.goto('/backlog');
  }

  async dragIssueToSprint(issueKey: string, sprintName: string) {
    const issue = this.page.locator(`[data-testid="issue-${issueKey}"]`);
    const sprint = this.page.locator(`[data-testid="sprint-${sprintName}"]`);
    await issue.dragTo(sprint);
  }

  async createIssue(summary: string, type: string = 'Story') {
    await this.createIssueButton.click();
    await this.page.locator('[data-testid="issue-type-select"]').click();
    await this.page.locator(`text=${type}`).click();
    await this.page.locator('[data-testid="summary-input"]').fill(summary);
    await this.page.locator('button:has-text("Create")').click();
  }
}
```

---

## Test Data Strategy

### Factories

```typescript
// e2e/utils/test-data.ts
import { faker } from '@faker-js/faker';

export const createTestUser = () => ({
  email: faker.internet.email(),
  password: faker.internet.password({ length: 12 }),
  name: faker.person.fullName(),
});

export const createTestProject = () => ({
  name: faker.company.name() + ' Project',
  key: faker.string.alpha({ length: 4 }).toUpperCase(),
  description: faker.lorem.paragraph(),
});

export const createTestIssue = (type: string = 'Story') => ({
  type,
  summary: faker.lorem.sentence(),
  description: faker.lorem.paragraphs(2),
  priority: faker.helpers.arrayElement(['Lowest', 'Low', 'Medium', 'High', 'Highest']),
  storyPoints: faker.helpers.arrayElement([1, 2, 3, 5, 8, 13]),
});
```

---

## Configuration

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npx playwright test
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
      
      - name: Upload test report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## Execution Commands

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test auth/login.spec.ts

# Run with UI mode
npx playwright test --ui

# Run in headed mode
npx playwright test --headed

# Run specific project (browser)
npx playwright test --project=chromium

# Generate report
npx playwright show-report

# Debug mode
npx playwright test --debug

# Update snapshots
npx playwright test --update-snapshots
```

---

## Test Coverage Goals

| Module | Coverage Target |
|--------|----------------|
| Authentication | 100% |
| Project CRUD | 100% |
| Issue CRUD (all types) | 100% |
| Sprint Management | 100% |
| Backlog Operations | 90% |
| Board Operations | 90% |
| Time Tracking | 85% |
| Integration Flows | 80% |

---

## Timeline Estimate

| Phase | Duration | Description |
|-------|----------|-------------|
| Phase 1 | 1 week | Setup + Auth + Project tests |
| Phase 2 | 2 weeks | Issue CRUD all types |
| Phase 3 | 1 week | Sprint management |
| Phase 4 | 1 week | Board + Backlog |
| Phase 5 | 1 week | Time tracking + Integration |
| Phase 6 | 1 week | CI/CD + Polish |

**Total: 7 weeks**

---

## Next Steps

1. **Setup**: Initialize Playwright in the project
2. **Page Objects**: Create base page objects
3. **Fixtures**: Set up auth and data fixtures
4. **Tests**: Implement test cases phase by phase
5. **CI/CD**: Configure GitHub Actions
6. **Reports**: Set up test reporting dashboard

---

*Document Version: 1.0*  
*Created: December 30, 2025*  
*Author: Cascade AI*
