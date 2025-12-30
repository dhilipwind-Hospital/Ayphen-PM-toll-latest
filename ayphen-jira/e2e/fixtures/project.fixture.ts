import { test as base, Page } from '@playwright/test';
import { DashboardPage, BacklogPage, BoardPage, CreateIssuePage } from '../pages';
import { createTestProject, createTestEpic, createTestStory, createTestBug, createTestTask } from '../utils/test-data';

/**
 * Project Fixture
 * Provides project-related page objects and helpers
 */

type ProjectFixtures = {
  dashboardPage: DashboardPage;
  backlogPage: BacklogPage;
  boardPage: BoardPage;
  createIssuePage: CreateIssuePage;
  testProject: ReturnType<typeof createTestProject>;
};

export const test = base.extend<ProjectFixtures>({
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  backlogPage: async ({ page }, use) => {
    await use(new BacklogPage(page));
  },

  boardPage: async ({ page }, use) => {
    await use(new BoardPage(page));
  },

  createIssuePage: async ({ page }, use) => {
    await use(new CreateIssuePage(page));
  },

  testProject: async ({}, use) => {
    await use(createTestProject());
  },
});

export { expect } from '@playwright/test';

/**
 * Helper to create a project via UI
 */
export async function createProjectViaUI(page: Page, projectData: ReturnType<typeof createTestProject>) {
  const dashboard = new DashboardPage(page);
  await dashboard.openCreateModal();
  
  // Fill project creation form
  await page.locator('input[name="name"]').fill(projectData.name);
  await page.locator('input[name="key"]').fill(projectData.key);
  
  if (projectData.description) {
    await page.locator('textarea[name="description"]').fill(projectData.description);
  }
  
  // Select project type
  await page.locator(`text=${projectData.type}`).click();
  
  // Submit
  await page.locator('button:has-text("Create")').click();
  
  // Wait for success
  await page.waitForURL(/.*\/(board|backlog)/);
  
  return projectData;
}

/**
 * Helper to create an issue via UI
 */
export async function createIssueViaUI(
  page: Page,
  issueData: { type: string; summary: string; description?: string }
) {
  const createIssue = new CreateIssuePage(page);
  const dashboard = new DashboardPage(page);
  
  await dashboard.openCreateModal();
  await createIssue.waitForModal();
  
  await createIssue.selectType(issueData.type as any);
  await createIssue.fillSummary(issueData.summary);
  
  if (issueData.description) {
    await createIssue.fillDescription(issueData.description);
  }
  
  await page.locator('.ant-modal-footer button.ant-btn-primary').click();
  
  // Wait for modal to close
  await page.waitForSelector('.ant-modal', { state: 'hidden', timeout: 10000 });
}

/**
 * Helper to create test data set (Epic + Stories + Tasks + Bugs)
 */
export async function createTestDataSet(page: Page) {
  const epic = createTestEpic();
  const stories = [createTestStory(), createTestStory()];
  const tasks = [createTestTask()];
  const bugs = [createTestBug()];
  
  // Create Epic
  await createIssueViaUI(page, epic);
  
  // Create Stories
  for (const story of stories) {
    await createIssueViaUI(page, story);
  }
  
  // Create Tasks
  for (const task of tasks) {
    await createIssueViaUI(page, task);
  }
  
  // Create Bugs
  for (const bug of bugs) {
    await createIssueViaUI(page, bug);
  }
  
  return { epic, stories, tasks, bugs };
}
