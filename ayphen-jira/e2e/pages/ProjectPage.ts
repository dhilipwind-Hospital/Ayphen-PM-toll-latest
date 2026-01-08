import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Project Page Object
 * Handles project CRUD, team management, and settings
 */
export class ProjectPage extends BasePage {
  // Locators
  readonly createProjectButton: Locator;
  readonly projectNameInput: Locator;
  readonly projectKeyInput: Locator;
  readonly projectDescriptionInput: Locator;
  readonly projectTypeSelect: Locator;
  readonly projectLeadSelect: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly projectList: Locator;
  readonly projectCard: Locator;
  readonly settingsButton: Locator;
  readonly teamButton: Locator;
  readonly activityButton: Locator;
  readonly permissionsButton: Locator;
  readonly inviteButton: Locator;
  readonly searchInput: Locator;
  readonly bulkSelectCheckbox: Locator;
  readonly avatarUpload: Locator;

  constructor(page: Page) {
    super(page);
    this.createProjectButton = page.locator('button:has-text("Create Project"), button:has-text("New Project"), [data-testid="create-project"]');
    this.projectNameInput = page.locator('input[name="name"], input[placeholder*="project name" i]');
    this.projectKeyInput = page.locator('input[name="key"], input[placeholder*="key" i]');
    this.projectDescriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="description" i]');
    this.projectTypeSelect = page.locator('select[name="type"], [data-testid="project-type"]');
    this.projectLeadSelect = page.locator('select[name="lead"], [data-testid="project-lead"]');
    this.saveButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
    this.cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Close")');
    this.projectList = page.locator('[data-testid="project-list"], .project-list');
    this.projectCard = page.locator('[data-testid="project-card"], .project-card');
    this.settingsButton = page.locator('button:has-text("Settings"), [data-testid="project-settings"]');
    this.teamButton = page.locator('button:has-text("Team"), [data-testid="project-team"]');
    this.activityButton = page.locator('button:has-text("Activity"), [data-testid="project-activity"]');
    this.permissionsButton = page.locator('button:has-text("Permissions"), [data-testid="project-permissions"]');
    this.inviteButton = page.locator('button:has-text("Invite"), [data-testid="invite-member"]');
    this.searchInput = page.locator('input[placeholder*="search" i], input[data-testid="search"]');
    this.bulkSelectCheckbox = page.locator('input[type="checkbox"][data-testid="select-all"]');
    this.avatarUpload = page.locator('input[type="file"][data-testid="avatar-upload"]');
  }

  /**
   * Navigate to projects page
   */
  async goto() {
    await super.goto('/projects');
    await this.waitForPageLoad();
  }

  /**
   * Click create project button
   */
  async clickCreateProject() {
    await this.createProjectButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill project creation form
   */
  async fillProjectForm(projectData: any) {
    if (projectData.name) await this.projectNameInput.fill(projectData.name);
    if (projectData.key) await this.projectKeyInput.fill(projectData.key);
    if (projectData.description) await this.projectDescriptionInput.fill(projectData.description);
    if (projectData.type) {
      await this.projectTypeSelect.click();
      await this.page.locator(`option:has-text("${projectData.type}")`).click();
    }
    if (projectData.lead) {
      await this.projectLeadSelect.click();
      await this.page.locator(`option:has-text("${projectData.lead}")`).click();
    }
  }

  /**
   * Save project
   */
  async saveProject() {
    await this.saveButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Create new project
   */
  async createProject(projectData: any) {
    await this.clickCreateProject();
    await this.fillProjectForm(projectData);
    await this.saveProject();
  }

  /**
   * Edit project
   */
  async editProject(updatedData: any) {
    await this.settingsButton.click();
    await this.page.waitForTimeout(500);
    
    if (updatedData.name) await this.projectNameInput.fill(updatedData.name);
    if (updatedData.description) await this.projectDescriptionInput.fill(updatedData.description);
    if (updatedData.type) {
      await this.projectTypeSelect.click();
      await this.page.locator(`option:has-text("${updatedData.type}")`).click();
    }
    
    await this.saveButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Archive project
   */
  async archiveProject() {
    await this.settingsButton.click();
    await this.page.locator('button:has-text("Archive"), [data-testid="archive-project"]').click();
    await this.page.locator('button:has-text("Confirm"), button:has-text("Archive")').click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Delete project
   */
  async deleteProject() {
    await this.settingsButton.click();
    await this.page.locator('button:has-text("Delete"), [data-testid="delete-project"]').click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Duplicate project
   */
  async duplicateProject() {
    await this.settingsButton.click();
    await this.page.locator('button:has-text("Duplicate"), [data-testid="duplicate-project"]').click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill duplicate project form
   */
  async fillDuplicateForm(duplicateData: any) {
    const nameInput = this.page.locator('input[name="duplicateName"], input[placeholder*="name" i]');
    const keyInput = this.page.locator('input[name="duplicateKey"], input[placeholder*="key" i]');
    
    if (duplicateData.name) await nameInput.fill(duplicateData.name);
    if (duplicateData.key) await keyInput.fill(duplicateData.key);
  }

  /**
   * Confirm project duplication
   */
  async confirmDuplicate() {
    await this.page.locator('button:has-text("Duplicate"), button:has-text("Create")').click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Export project
   */
  async exportProject() {
    await this.settingsButton.click();
    await this.page.locator('button:has-text("Export"), [data-testid="export-project"]').click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Go to project settings
   */
  async goToSettings() {
    await this.settingsButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Update project setting
   */
  async updateSetting(key: string, value: any) {
    const setting = this.page.locator(`[data-testid="setting-${key}"]`);
    if (await setting.locator('select').isVisible()) {
      await setting.locator('select').selectOption(value.toString());
    } else if (await setting.locator('input').isVisible()) {
      await setting.locator('input').fill(value.toString());
    } else if (await setting.locator('input[type="checkbox"]').isVisible()) {
      if (value) await setting.locator('input[type="checkbox"]').check();
      else await setting.locator('input[type="checkbox"]').uncheck();
    }
  }

  /**
   * Save project settings
   */
  async saveSettings() {
    await this.page.locator('button:has-text("Save Settings"), button:has-text("Save")').click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Go to team management
   */
  async goToTeam() {
    await this.teamButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Add team member
   */
  async addTeamMember(email: string, role: string) {
    await this.inviteButton.click();
    await this.page.locator('input[name="email"], input[placeholder*="email" i]').fill(email);
    await this.page.locator('select[name="role"], [data-testid="role-select"]').selectOption(role);
    await this.page.locator('button:has-text("Add"), button:has-text("Invite")').click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Remove team member
   */
  async removeTeamMember(email: string) {
    const memberRow = this.page.locator(`[data-testid="member-${email}"], tr:has-text("${email}")`);
    await memberRow.locator('button:has-text("Remove"), [data-testid="remove-member"]').click();
    await this.page.locator('button:has-text("Confirm"), button:has-text("Remove")').click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Change member role
   */
  async changeMemberRole(email: string, newRole: string) {
    const memberRow = this.page.locator(`[data-testid="member-${email}"], tr:has-text("${email}")`);
    await memberRow.locator('[data-testid="role-select"], select').selectOption(newRole);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Go to permissions
   */
  async goToPermissions() {
    await this.permissionsButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Update permission for role
   */
  async updatePermission(role: string, permissions: string[]) {
    const roleRow = this.page.locator(`[data-testid="role-${role}"], tr:has-text("${role}")`);
    
    // Clear existing permissions
    await roleRow.locator('input[type="checkbox"]').uncheck();
    
    // Set new permissions
    for (const permission of permissions) {
      const checkbox = roleRow.locator(`[data-testid="perm-${permission}"], input[value="${permission}"]`);
      await checkbox.check();
    }
  }

  /**
   * Save permissions
   */
  async savePermissions() {
    await this.page.locator('button:has-text("Save Permissions"), button:has-text("Save")').click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Invite user
   */
  async inviteUser(email: string) {
    await this.inviteButton.click();
    await this.page.locator('input[name="email"], input[placeholder*="email" i]').fill(email);
    await this.page.locator('button:has-text("Send Invite"), button:has-text("Invite")').click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Go to archived projects
   */
  async goToArchivedProjects() {
    await this.page.locator('button:has-text("Archived"), [data-testid="archived-projects"]').click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Go to activity feed
   */
  async goToActivity() {
    await this.activityButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Select all team members
   */
  async selectAllMembers() {
    await this.bulkSelectCheckbox.check();
    await this.page.waitForTimeout(500);
  }

  /**
   * Bulk change role
   */
  async bulkChangeRole(newRole: string) {
    await this.page.locator('[data-testid="bulk-actions"]').click();
    await this.page.locator('button:has-text("Change Role")').click();
    await this.page.locator('select[name="role"]').selectOption(newRole);
    await this.page.locator('button:has-text("Apply"), button:has-text("Change")').click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Search team members
   */
  async searchTeam(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  /**
   * Clear search
   */
  async clearSearch() {
    await this.searchInput.clear();
    await this.page.waitForTimeout(500);
  }

  /**
   * Go to team settings
   */
  async goToTeamSettings() {
    await this.teamButton.click();
    await this.page.locator('button:has-text("Team Settings"), [data-testid="team-settings"]').click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Update team setting
   */
  async updateTeamSetting(key: string, value: any) {
    const setting = this.page.locator(`[data-testid="team-setting-${key}"]`);
    if (await setting.locator('input[type="checkbox"]').isVisible()) {
      if (value) await setting.locator('input[type="checkbox"]').check();
      else await setting.locator('input[type="checkbox"]').uncheck();
    } else if (await setting.locator('select').isVisible()) {
      await setting.locator('select').selectOption(value.toString());
    }
  }

  /**
   * Save team settings
   */
  async saveTeamSettings() {
    await this.page.locator('button:has-text("Save Team Settings"), button:has-text("Save")').click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Assert project is visible in list
   */
  async expectProjectVisible(projectName: string) {
    await expect(this.page.locator(`text=${projectName}`)).toBeVisible();
  }

  /**
   * Assert project is not visible in list
   */
  async expectProjectNotVisible(projectName: string) {
    await expect(this.page.locator(`text=${projectName}`)).not.toBeVisible();
  }
}
