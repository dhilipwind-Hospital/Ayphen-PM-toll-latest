import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { antdTheme } from './theme/theme';
import { BoardView } from './pages/BoardView';
import { BacklogView } from './pages/BacklogView';
import { RoadmapView } from './pages/RoadmapView';
import { DashboardView } from './pages/DashboardView';
import { EnhancedDashboardView } from './pages/EnhancedDashboardView';
import { EnhancedDashboard } from './pages/EnhancedDashboard';
import { KanbanBoard } from './components/Board/KanbanBoard';
import { AdvancedSearch } from './components/Search/AdvancedSearch';
import { TimeTracker } from './components/TimeTracking/TimeTracker';
import { SearchPage } from './pages/SearchPage';
import { ReportsView } from './components/Reports/ReportsView';
import { FiltersView } from './pages/FiltersView';
import { SavedFiltersList } from './components/SavedFilters/SavedFiltersList';
import { AdvancedSearchView } from './pages/AdvancedSearchView';
import { EpicDetailView } from './pages/EpicDetailView';
import { EpicsListView } from './pages/EpicsListView';
import { EpicBoardView } from './pages/EpicBoardView';
import { StoriesListView } from './pages/StoriesListView';
import { StoriesBoardView } from './pages/StoriesBoardView';
import { BugsListView } from './pages/BugsListView';
import { TeamsView } from './pages/TeamsView';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { UserProfileSettings } from './pages/settings/UserProfileSettings';
import { NotificationPreferences } from './pages/settings/NotificationPreferences';
import { SystemSettings } from './pages/settings/SystemSettings';
import { IssueSettings } from './pages/settings/IssueSettings';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthenticatedLayout } from './components/Layout/AuthenticatedLayout';
import { ProjectsView } from './pages/ProjectsView';
import { IssueDetailView } from './pages/IssueDetailView';
import { CreateProjectView } from './pages/CreateProjectView';
import { PeoplePage } from './pages/PeoplePage';
import { AppsPage } from './pages/AppsPage';
import { ProjectSettingsView } from './pages/ProjectSettingsView';
import { WorkflowView } from './pages/WorkflowView';
import { WorkflowEditor } from './pages/WorkflowEditor';
import { AITestAutomation } from './pages/AITestAutomation';
import { SprintReportsView } from './pages/SprintReportsView';
import { SprintPlanningView } from './pages/SprintPlanningView';
import { AdvancedReports } from './pages/AdvancedReports';
import ManualTestCases from './pages/ManualTestCases';
import TestSuites from './pages/TestSuites';
import TestRuns from './pages/TestRuns';
import ProjectDetailView from './pages/ProjectDetailView';
import HierarchyView from './pages/HierarchyView';
import AutomationRules from './pages/AutomationRules';
import TeamChatPage from './pages/TeamChatPage';
import { useStore } from './store/useStore';
import { projectsApi, issuesApi, usersApi, sprintsApi } from './services/api';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AIFeaturesView } from './pages/AIFeaturesView';
import { AcceptInvitation } from './pages/AcceptInvitation';
import { CalendarView } from './pages/CalendarView';
import AIFeaturesTestPage from './pages/AIFeaturesTestPage';
import Phase2TestPage from './pages/Phase2TestPage';
import { socketService } from './services/socketService';

function App() {
  const { currentUser, currentProject, setCurrentUser, setProjects, setCurrentProject, setIssues, setBoards, setSprints, setCurrentBoard } = useStore();

  // Initialize Socket Connection
  useEffect(() => {
    if (currentUser) {
      socketService.connect(currentUser.id);
    } else {
      socketService.disconnect();
    }
    
    return () => {
      socketService.disconnect();
    };
  }, [currentUser]);

  // Join Project Room
  useEffect(() => {
    if (currentProject) {
      socketService.joinProject(currentProject.id);
    }
  }, [currentProject]);

  useEffect(() => {
    // Fetch data from backend API
    const fetchData = async () => {
      try {
        // GET CURRENT USER ID FOR DATA ISOLATION
        // 🔒 GET CURRENT USER ID FOR DATA ISOLATION
        const userId = localStorage.getItem('userId');
        const sessionId = localStorage.getItem('sessionId');

        // 🔒 ONLY LOAD DATA IF USER IS LOGGED IN
        if (!userId || !sessionId) {
          console.log('⚠️ No userId/sessionId found - skipping data load (user not logged in)');
          return;
        }

        console.log('🔄 Loading data from backend for user:', userId);

        // Fetch all data with individual error handling + userId for filtering
        const [projectsRes, issuesRes, usersRes, sprintsRes] = await Promise.allSettled([
          projectsApi.getAll(userId).catch(e => ({ data: [], error: e })),
          issuesApi.getAll({ userId }).catch(e => ({ data: [], error: e })),
          usersApi.getAll().catch(e => ({ data: [], error: e })),
          sprintsApi.getAll(undefined, userId).catch(e => ({ data: [], error: e })),
        ]);

        // Handle projects
        if (projectsRes.status === 'fulfilled' && projectsRes.value.data) {
          const projects = projectsRes.value.data;
          setProjects(projects);
          if (projects.length > 0) {
            setCurrentProject(projects[0]);
          }
          console.log(`✅ Loaded ${projects.length} projects`);
        } else {
          console.warn('⚠️ No projects loaded');
        }

        // Handle issues
        if (issuesRes.status === 'fulfilled' && issuesRes.value.data) {
          setIssues(issuesRes.value.data);
          console.log(`✅ Loaded ${issuesRes.value.data.length} issues`);
        } else {
          console.warn('⚠️ No issues loaded');
        }

        // Handle users
        if (usersRes.status === 'fulfilled' && usersRes.value.data) {
          const users = usersRes.value.data;
          // Don't override currentUser - it's set by AuthContext
          console.log(`✅ Loaded ${users.length} users`);
        } else {
          console.warn('⚠️ No users loaded');
        }

        // Handle sprints
        if (sprintsRes.status === 'fulfilled' && sprintsRes.value.data) {
          setSprints(sprintsRes.value.data);
          console.log(`✅ Loaded ${sprintsRes.value.data.length} sprints`);
        } else {
          console.warn('⚠️ No sprints loaded');
        }

        // Create a board from the project data
        if (projectsRes.status === 'fulfilled' && projectsRes.value.data && projectsRes.value.data.length > 0) {
          const projects = projectsRes.value.data;
          const issues = issuesRes.status === 'fulfilled' ? issuesRes.value.data : [];

          const board = {
            id: 'board-1',
            name: `${projects[0].name} Board`,
            type: projects[0].type as 'scrum' | 'kanban',
            projectId: projects[0].id,
            columns: [
              {
                id: 'col-1',
                name: 'To Do',
                status: ['todo' as const, 'backlog' as const],
                issueIds: issues.filter((i: any) => i.status === 'todo').map((i: any) => i.id),
              },
              {
                id: 'col-2',
                name: 'In Progress',
                status: ['in-progress' as const],
                wipLimit: 3,
                issueIds: issues.filter((i: any) => i.status === 'in-progress').map((i: any) => i.id),
              },
              {
                id: 'col-3',
                name: 'In Review',
                status: ['in-review' as const],
                issueIds: issues.filter((i: any) => i.status === 'in-review').map((i: any) => i.id),
              },
              {
                id: 'col-4',
                name: 'Done',
                status: ['done' as const],
                issueIds: issues.filter((i: any) => i.status === 'done').map((i: any) => i.id),
              },
            ],
            isStarred: true,
          } as any;
          setBoards([board]);
          setCurrentBoard(board);
          console.log('✅ Board created');
        }

        console.log('✅ All data loaded successfully');
      } catch (error) {
        console.error('❌ Error loading data:', error);
        console.log('⚠️ Continuing with empty data - backend may be unavailable');
        // Don't throw - allow app to continue with empty data
      }
    };

    // Add delay to ensure auth context is ready
    const timer = setTimeout(fetchData, 100);
    return () => clearTimeout(timer);
  }, [currentUser, setCurrentUser, setProjects, setCurrentProject, setIssues, setBoards, setSprints, setCurrentBoard]);

  // Restore last selected project from localStorage
  useEffect(() => {
    const { projects: storeProjects, currentProject, setCurrentProject: setProject } = useStore.getState();
    const lastProjectId = localStorage.getItem('lastProjectId');
    if (lastProjectId && storeProjects.length > 0) {
      const project = storeProjects.find((p: any) => p.id === lastProjectId);
      if (project) {
        setProject(project);
        console.log('✅ Restored last project:', project.name);
      }
    } else if (storeProjects.length > 0 && !currentProject) {
      // If no last project, set first project as default
      setProject(storeProjects[0]);
      console.log('✅ Set default project:', storeProjects[0].name);
    }
  }, []);

  return (
    <ThemeProvider>
      <ConfigProvider theme={antdTheme}>
        <ToastProvider>
          <BrowserRouter>
              <AuthProvider>
                <NotificationProvider>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />

                    {/* All other routes require authentication */}
                    <Route path="/*" element={
                      <AuthenticatedLayout>
                        <Routes>
                          <Route path="/" element={<Navigate to="/dashboard" replace />} />
                          <Route path="/board" element={<BoardView />} />
                          <Route path="/board-kanban" element={<KanbanBoard />} />
                          <Route path="/backlog" element={<BacklogView />} />
                          <Route path="/roadmap" element={<RoadmapView />} />
                          <Route path="/reports" element={<ReportsView />} />
                          <Route path="/reports/:reportType" element={<ReportsView />} />
                          <Route path="/advanced-reports" element={<AdvancedReports />} />
                          <Route path="/dashboard" element={<EnhancedDashboard />} />
                          <Route path="/dashboard/create" element={<EnhancedDashboard />} />
                          <Route path="/dashboard-old" element={<DashboardView />} />
                          <Route path="/dashboard-enhanced" element={<EnhancedDashboardView />} />
                          <Route path="/filters" element={<FiltersView />} />
                          <Route path="/filters/saved" element={<SavedFiltersList />} />
                          <Route path="/filters/advanced" element={<AdvancedSearchView />} />
                          <Route path="/search" element={<AdvancedSearch />} />
                          <Route path="/search/jql" element={<AdvancedSearch />} />
                          <Route path="/search-old" element={<SearchPage />} />
                          <Route path="/filters/create" element={<FiltersView />} />
                          <Route path="/projects" element={<ProjectsView />} />
                          <Route path="/projects/:projectId" element={<ProjectDetailView />} />
                          <Route path="/projects/create" element={<CreateProjectView />} />
                          <Route path="/projects/categories" element={<ProjectsView />} />
                          <Route path="/people" element={<PeoplePage />} />
                          <Route path="/people/directory" element={<PeoplePage />} />
                          <Route path="/people/teams" element={<PeoplePage />} />
                          <Route path="/apps/explore" element={<AppsPage />} />
                          <Route path="/apps/manage" element={<AppsPage />} />
                          <Route path="/apps/installed" element={<AppsPage />} />
                          <Route path="/apps/requests" element={<AppsPage />} />
                          <Route path="/apps/marketplace" element={<AppsPage />} />
                          <Route path="/profile" element={<DashboardView />} />
                          <Route path="/settings/:settingType" element={<ProjectSettingsView />} />
                          <Route path="/workflows" element={<WorkflowView />} />
                          <Route path="/workflow-editor/:id" element={<WorkflowEditor />} />
                          <Route path="/ai-test-automation/*" element={<AITestAutomation />} />
                          <Route path="/sprint-reports" element={<SprintReportsView />} />
                          <Route path="/sprint-planning" element={<SprintPlanningView />} />
                          <Route path="/epics" element={<EpicsListView />} />
                          <Route path="/epics/board" element={<EpicBoardView />} />
                          <Route path="/epic/:epicId" element={<EpicDetailView />} />
                          <Route path="/stories" element={<StoriesListView />} />
                          <Route path="/stories/board" element={<StoriesBoardView />} />
                          <Route path="/bugs" element={<BugsListView />} />
                          <Route path="/teams" element={<TeamsView />} />
                          <Route path="/ai-features-test" element={<AIFeaturesTestPage />} />
                          <Route path="/phase2-test" element={<Phase2TestPage />} />

                          <Route path="/time-tracking" element={<TimeTracker />} />
                          <Route path="/issue/:issueKey" element={<IssueDetailView />} />
                          <Route path="/settings/profile" element={<UserProfileSettings />} />
                          <Route path="/settings/notifications" element={<NotificationPreferences />} />
                          <Route path="/settings/system" element={<SystemSettings />} />
                          <Route path="/settings/issues" element={<IssueSettings />} />
                          <Route path="/settings/users" element={<PeoplePage />} />
                          <Route path="/settings/projects" element={<ProjectsView />} />
                          <Route path="/test-cases" element={<ManualTestCases />} />
                          <Route path="/test-suites" element={<TestSuites />} />
                          <Route path="/test-runs" element={<TestRuns />} />
                          <Route path="/hierarchy" element={<HierarchyView />} />
                          <Route path="/automation" element={<AutomationRules />} />
                          <Route path="/calendar" element={<CalendarView />} />
                          <Route path="/team-chat" element={<TeamChatPage />} />
                          <Route path="/ai-features" element={<AIFeaturesView />} />
                          <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                      </AuthenticatedLayout>
                    } />
                  </Routes>
                </NotificationProvider>
              </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </ConfigProvider>
    </ThemeProvider>
  );
}

export default App;
