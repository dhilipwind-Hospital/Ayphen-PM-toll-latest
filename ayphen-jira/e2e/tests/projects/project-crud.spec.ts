import { test, expect } from '../../fixtures/auth.fixture';
import { ProjectPage } from '../../pages';

/**
 * Project Management Test Suite - Phase 1
 * Covers all project CRUD operations
 */

test.describe('Project Management - Phase 1 Core Tests', () => {
  let projectPage: ProjectPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    projectPage = new ProjectPage(authenticatedPage);
    await projectPage.goto();
  });

  // PROJ-001: Create new project with all fields
  test('PROJ-001: Create new project with all fields', async ({ authenticatedPage }) => {
    const projectData = {
      name: `Test Project ${Date.now()}`,
      key: `TP${Date.now() % 10000}`,
      description: 'This is a test project created by E2E tests',
      type: 'software',
      lead: 'testuser@ayphen.com',
      avatar: null
    };

    await projectPage.createProject(projectData);
    
    // Should show success message and redirect to project
    await expect(authenticatedPage.locator('text=Project created successfully|Project created')).toBeVisible();
    await expect(authenticatedPage.locator(`text=${projectData.name}`)).toBeVisible();
  });

  // PROJ-002: Create project with invalid data
  test('PROJ-002: Create project with invalid data', async ({ authenticatedPage }) => {
    const invalidProject = {
      name: '', // Empty name
      key: 'INVALID-KEY', // Invalid format
      description: 'Test'
    };

    await projectPage.clickCreateProject();
    await projectPage.fillProjectForm(invalidProject);
    await projectPage.saveProject();

    // Should show validation errors
    await expect(authenticatedPage.locator('text=Project name is required|Name is required')).toBeVisible();
    await expect(authenticatedPage.locator('text=Invalid project key|Key format invalid')).toBeVisible();
  });

  // PROJ-003: Edit project details
  test('PROJ-003: Edit project details', async ({ authenticatedPage }) => {
    // First create a project
    const projectData = {
      name: `Edit Test ${Date.now()}`,
      key: `ET${Date.now() % 10000}`,
      description: 'Original description'
    };

    await projectPage.createProject(projectData);
    await authenticatedPage.waitForTimeout(1000);

    // Edit the project
    const updatedData = {
      name: `${projectData.name} - Updated`,
      description: 'Updated description',
      type: 'business'
    };

    await projectPage.editProject(updatedData);
    
    // Should show updated values
    await expect(authenticatedPage.locator(`text=${updatedData.name}`)).toBeVisible();
    await expect(authenticatedPage.locator(`text=${updatedData.description}`)).toBeVisible();
  });

  // PROJ-004: Archive/restore project
  test('PROJ-004: Archive project', async ({ authenticatedPage }) => {
    // Create a project first
    const projectData = {
      name: `Archive Test ${Date.now()}`,
      key: `AT${Date.now() % 10000}`,
      description: 'Test project for archive'
    };

    await projectPage.createProject(projectData);
    await authenticatedPage.waitForTimeout(1000);

    // Archive the project
    await projectPage.archiveProject();
    
    // Should show archived status
    await expect(authenticatedPage.locator('text=Project archived|Archived')).toBeVisible();
    
    // Check if project appears in archived list
    await projectPage.goToArchivedProjects();
    await expect(authenticatedPage.locator(`text=${projectData.name}`)).toBeVisible();
  });

  // PROJ-005: Delete project with dependencies
  test('PROJ-005: Delete project', async ({ authenticatedPage }) => {
    // Create a project first
    const projectData = {
      name: `Delete Test ${Date.now()}`,
      key: `DT${Date.now() % 10000}`,
      description: 'Test project for deletion'
    };

    await projectPage.createProject(projectData);
    await authenticatedPage.waitForTimeout(1000);

    // Try to delete project
    await projectPage.deleteProject();
    
    // Should show confirmation dialog
    await expect(authenticatedPage.locator('text=Are you sure|Delete project|This action cannot be undone')).toBeVisible();
    
    // Confirm deletion
    await authenticatedPage.locator('button:has-text("Delete"), button:has-text("Confirm")').click();
    
    // Should show success message
    await expect(authenticatedPage.locator('text=Project deleted|Deleted successfully')).toBeVisible();
    
    // Project should not appear in list
    await authenticatedPage.reload();
    await expect(authenticatedPage.locator(`text=${projectData.name}`)).not.toBeVisible();
  });

  // PROJ-006: Project duplicate functionality
  test('PROJ-006: Duplicate project', async ({ authenticatedPage }) => {
    // Create original project
    const originalProject = {
      name: `Original ${Date.now()}`,
      key: `OR${Date.now() % 10000}`,
      description: 'Original project description'
    };

    await projectPage.createProject(originalProject);
    await authenticatedPage.waitForTimeout(1000);

    // Duplicate project
    await projectPage.duplicateProject();
    
    // Should show duplicate form
    await expect(authenticatedPage.locator('text=Duplicate project|Copy project')).toBeVisible();
    
    // Fill duplicate form
    const duplicateData = {
      name: `${originalProject.name} - Copy`,
      key: `CP${Date.now() % 10000}`
    };
    
    await projectPage.fillDuplicateForm(duplicateData);
    await projectPage.confirmDuplicate();
    
    // Should show success and both projects
    await expect(authenticatedPage.locator('text=Project duplicated|Duplicated successfully')).toBeVisible();
    await expect(authenticatedPage.locator(`text=${originalProject.name}`)).toBeVisible();
    await expect(authenticatedPage.locator(`text=${duplicateData.name}`)).toBeVisible();
  });

  // PROJ-007: Project export/import
  test('PROJ-007: Export project', async ({ authenticatedPage }) => {
    // Create a project
    const projectData = {
      name: `Export Test ${Date.now()}`,
      key: `EX${Date.now() % 10000}`,
      description: 'Test project for export'
    };

    await projectPage.createProject(projectData);
    await authenticatedPage.waitForTimeout(1000);

    // Export project
    const downloadPromise = authenticatedPage.waitForEvent('download');
    await projectPage.exportProject();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.(json|csv)$/);
  });

  // PROJ-008: Project settings validation
  test('PROJ-008: Project settings validation', async ({ authenticatedPage }) => {
    // Create a project
    const projectData = {
      name: `Settings Test ${Date.now()}`,
      key: `ST${Date.now() % 10000}`,
      description: 'Test project for settings'
    };

    await projectPage.createProject(projectData);
    await authenticatedPage.waitForTimeout(1000);

    // Go to settings
    await projectPage.goToSettings();
    
    // Update various settings
    await projectPage.updateSetting('workflowType', 'kanban');
    await projectPage.updateSetting('issueKeying', 'auto');
    await projectPage.updateSetting('defaultAssignee', 'unassigned');
    
    // Save settings
    await projectPage.saveSettings();
    
    // Should show success message
    await expect(authenticatedPage.locator('text=Settings saved|Updated successfully')).toBeVisible();
    
    // Verify settings persisted
    await authenticatedPage.reload();
    await expect(authenticatedPage.locator('[data-testid="workflow-type"]').locator('text=kanban')).toBeVisible();
  });
});

// TEAM-001: Add team members
test('TEAM-001: Add team members', async ({ authenticatedPage }) => {
  const projectPage = new ProjectPage(authenticatedPage);
  
  // Create a project first
  const projectData = {
    name: `Team Test ${Date.now()}`,
    key: `TT${Date.now() % 10000}`,
    description: 'Test project for team management'
  };

  await projectPage.goto();
  await projectPage.createProject(projectData);
  await authenticatedPage.waitForTimeout(1000);

  // Add team members
  await projectPage.goToTeam();
  await projectPage.addTeamMember('newmember@test.com', 'developer');
  
  // Should show member added
  await expect(authenticatedPage.locator('text=Member added|User added to team')).toBeVisible();
  await expect(authenticatedPage.locator('text=newmember@test.com')).toBeVisible();
});

// TEAM-002: Remove team members
test('TEAM-002: Remove team members', async ({ authenticatedPage }) => {
  const projectPage = new ProjectPage(authenticatedPage);
  
  // Create project and add member first
  const projectData = {
    name: `Remove Test ${Date.now()}`,
    key: `RT${Date.now() % 10000}`,
    description: 'Test project for removing members'
  };

  await projectPage.goto();
  await projectPage.createProject(projectData);
  await authenticatedPage.waitForTimeout(1000);
  
  await projectPage.goToTeam();
  await projectPage.addTeamMember('removemember@test.com', 'developer');
  await authenticatedPage.waitForTimeout(1000);

  // Remove member
  await projectPage.removeTeamMember('removemember@test.com');
  
  // Should show confirmation and removal
  await expect(authenticatedPage.locator('text=Member removed|User removed from team')).toBeVisible();
  await expect(authenticatedPage.locator('text=removemember@test.com')).not.toBeVisible();
});

// TEAM-003: Change member roles
test('TEAM-003: Change member roles', async ({ authenticatedPage }) => {
  const projectPage = new ProjectPage(authenticatedPage);
  
  // Create project and add member
  const projectData = {
    name: `Role Test ${Date.now()}`,
    key: `RL${Date.now() % 10000}`,
    description: 'Test project for role changes'
  };

  await projectPage.goto();
  await projectPage.createProject(projectData);
  await authenticatedPage.waitForTimeout(1000);
  
  await projectPage.goToTeam();
  await projectPage.addTeamMember('roleuser@test.com', 'developer');
  await authenticatedPage.waitForTimeout(1000);

  // Change role
  await projectPage.changeMemberRole('roleuser@test.com', 'admin');
  
  // Should show role updated
  await expect(authenticatedPage.locator('text=Role updated|Member role changed')).toBeVisible();
  await expect(authenticatedPage.locator('text=roleuser@test.com').locator('..').locator('text=admin')).toBeVisible();
});

// TEAM-004: Team member permissions
test('TEAM-004: Team member permissions', async ({ authenticatedPage }) => {
  const projectPage = new ProjectPage(authenticatedPage);
  
  // Create project
  const projectData = {
    name: `Permission Test ${Date.now()}`,
    key: `PT${Date.now() % 10000}`,
    description: 'Test project for permissions'
  };

  await projectPage.goto();
  await projectPage.createProject(projectData);
  await authenticatedPage.waitForTimeout(1000);

  // Go to permissions
  await projectPage.goToPermissions();
  
  // Update permissions
  await projectPage.updatePermission('developer', ['view_issues', 'create_issues', 'edit_issues']);
  await projectPage.updatePermission('viewer', ['view_issues']);
  
  // Save permissions
  await projectPage.savePermissions();
  
  // Should show success
  await expect(authenticatedPage.locator('text=Permissions updated|Saved successfully')).toBeVisible();
});

// TEAM-005: Invite users via email
test('TEAM-005: Invite users via email', async ({ authenticatedPage }) => {
  const projectPage = new ProjectPage(authenticatedPage);
  
  // Create project
  const projectData = {
    name: `Invite Test ${Date.now()}`,
    key: `IT${Date.now() % 10000}`,
    description: 'Test project for invitations'
  };

  await projectPage.goto();
  await projectPage.createProject(projectData);
  await authenticatedPage.waitForTimeout(1000);

  // Send invitation
  await projectPage.goToTeam();
  await projectPage.inviteUser('invitee@test.com');
  
  // Should show invitation sent
  await expect(authenticatedPage.locator('text=Invitation sent|Invite sent successfully')).toBeVisible();
});

// TEAM-006: Accept/decline invitations
test('TEAM-006: Accept/decline invitations', async ({ page }) => {
  // Go to invitations page
  await page.goto('/invitations');
  
  // Find invitation and accept
  const invitationCard = page.locator('[data-testid="invitation-card"]').first();
  await invitationCard.locator('button:has-text("Accept")').click();
  
  // Should show accepted
  await expect(page.locator('text=Invitation accepted|You joined the project')).toBeVisible();
});

// TEAM-007: Team activity feed
test('TEAM-007: Team activity feed', async ({ authenticatedPage }) => {
  const projectPage = new ProjectPage(authenticatedPage);
  
  // Create project
  const projectData = {
    name: `Activity Test ${Date.now()}`,
    key: `AC${Date.now() % 10000}`,
    description: 'Test project for activity feed'
  };

  await projectPage.goto();
  await projectPage.createProject(projectData);
  await authenticatedPage.waitForTimeout(1000);

  // Go to activity feed
  await projectPage.goToActivity();
  
  // Should show creation activity
  await expect(authenticatedPage.locator('text=created project|Project created')).toBeVisible();
  
  // Add some activity
  await projectPage.goToSettings();
  await projectPage.updateSetting('description', 'Updated description');
  await projectPage.saveSettings();
  
  // Go back to activity
  await projectPage.goToActivity();
  await expect(authenticatedPage.locator('text=updated project|Project updated')).toBeVisible();
});

// TEAM-008: Team presence indicators
test('TEAM-008: Team presence indicators', async ({ authenticatedPage }) => {
  const projectPage = new ProjectPage(authenticatedPage);
  
  // Create project
  const projectData = {
    name: `Presence Test ${Date.now()}`,
    key: `PR${Date.now() % 10000}`,
    description: 'Test project for presence'
  };

  await projectPage.goto();
  await projectPage.createProject(projectData);
  await authenticatedPage.waitForTimeout(1000);

  // Go to team page
  await projectPage.goToTeam();
  
  // Should show presence indicators
  await expect(authenticatedPage.locator('[data-testid="presence-indicator"]')).toBeVisible();
});

// TEAM-009: Bulk member operations
test('TEAM-009: Bulk member operations', async ({ authenticatedPage }) => {
  const projectPage = new ProjectPage(authenticatedPage);
  
  // Create project and add multiple members
  const projectData = {
    name: `Bulk Test ${Date.now()}`,
    key: `BK${Date.now() % 10000}`,
    description: 'Test project for bulk operations'
  };

  await projectPage.goto();
  await projectPage.createProject(projectData);
  await authenticatedPage.waitForTimeout(1000);
  
  await projectPage.goToTeam();
  await projectPage.addTeamMember('bulk1@test.com', 'developer');
  await projectPage.addTeamMember('bulk2@test.com', 'developer');
  await projectPage.addTeamMember('bulk3@test.com', 'developer');
  await authenticatedPage.waitForTimeout(2000);

  // Select all members
  await projectPage.selectAllMembers();
  
  // Bulk change role
  await projectPage.bulkChangeRole('admin');
  
  // Should show bulk update success
  await expect(authenticatedPage.locator('text=Members updated|Bulk operation completed')).toBeVisible();
});

// TEAM-010: Team search and filter
test('TEAM-010: Team search and filter', async ({ authenticatedPage }) => {
  const projectPage = new ProjectPage(authenticatedPage);
  
  // Create project and add members
  const projectData = {
    name: `Search Test ${Date.now()}`,
    key: `SR${Date.now() % 10000}`,
    description: 'Test project for search'
  };

  await projectPage.goto();
  await projectPage.createProject(projectData);
  await authenticatedPage.waitForTimeout(1000);
  
  await projectPage.goToTeam();
  await projectPage.addTeamMember('searchuser@test.com', 'developer');
  await projectPage.addTeamMember('filteruser@test.com', 'admin');
  await authenticatedPage.waitForTimeout(2000);

  // Search for specific member
  await projectPage.searchTeam('searchuser');
  
  // Should show only searched member
  await expect(authenticatedPage.locator('text=searchuser@test.com')).toBeVisible();
  await expect(authenticatedPage.locator('text=filteruser@test.com')).not.toBeVisible();
  
  // Clear search
  await projectPage.clearSearch();
  
  // Should show all members again
  await expect(authenticatedPage.locator('text=searchuser@test.com')).toBeVisible();
  await expect(authenticatedPage.locator('text=filteruser@test.com')).toBeVisible();
});

// TEAM-011: Team avatar upload
test('TEAM-011: Team avatar upload', async ({ authenticatedPage }) => {
  const projectPage = new ProjectPage(authenticatedPage);
  
  // Create project
  const projectData = {
    name: `Avatar Test ${Date.now()}`,
    key: `AV${Date.now() % 10000}`,
    description: 'Test project for avatar'
  };

  await projectPage.goto();
  await projectPage.createProject(projectData);
  await authenticatedPage.waitForTimeout(1000);

  // Go to settings
  await projectPage.goToSettings();
  
  // Upload avatar
  const fileInput = authenticatedPage.locator('input[type="file"]');
  await fileInput.setInputFiles('e2e/fixtures/test-avatar.png');
  
  // Should show upload success
  await expect(authenticatedPage.locator('text=Avatar uploaded|Image uploaded')).toBeVisible();
});

// TEAM-012: Team settings
test('TEAM-012: Team settings', async ({ authenticatedPage }) => {
  const projectPage = new ProjectPage(authenticatedPage);
  
  // Create project
  const projectData = {
    name: `Team Settings Test ${Date.now()}`,
    key: `TS${Date.now() % 10000}`,
    description: 'Test project for team settings'
  };

  await projectPage.goto();
  await projectPage.createProject(projectData);
  await authenticatedPage.waitForTimeout(1000);

  // Go to team settings
  await projectPage.goToTeamSettings();
  
  // Update team settings
  await projectPage.updateTeamSetting('allowSelfJoin', true);
  await projectPage.updateTeamSetting('defaultRole', 'developer');
  await projectPage.updateTeamSetting('requireApproval', false);
  
  // Save settings
  await projectPage.saveTeamSettings();
  
  // Should show success
  await expect(authenticatedPage.locator('text=Team settings saved|Settings updated')).toBeVisible();
});
