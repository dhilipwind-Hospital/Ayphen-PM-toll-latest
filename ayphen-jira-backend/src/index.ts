import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { AppDataSource } from './config/database';
import { initializeWebSocket } from './services/websocket.service';
import projectRoutes from './routes/projects';
import issueRoutes from './routes/issues';
import issueTemplateRoutes from './routes/issue-templates';
import issueExportRoutes from './routes/issue-export';
import customFieldRoutes from './routes/custom-fields';
import userRoutes from './routes/users';
import sprintRoutes from './routes/sprints';
import sprintRetroRoutes from './routes/sprint-retrospectives';
import searchHistoryRoutes from './routes/search-history';
import projectMemberRoutes from './routes/project-members';
import projectInvitationRoutes from './routes/project-invitations';
import adminRoutes from './routes/admin';
import commentRoutes from './routes/comments';
import attachmentRoutes from './routes/attachments';
import dashboardRoutes from './routes/dashboards';
import filterRoutes from './routes/filters';
import settingsRoutes from './routes/settings';
import issueLinksRoutes from './routes/issue-links';
import subtasksRoutes from './routes/subtasks';
import historyRoutes from './routes/history';
import shortcutsRoutes from './routes/shortcuts';
import workflowsRoutes from './routes/workflows';
import aiRequirementsRoutes from './routes/ai-requirements';
import aiStoriesRoutes from './routes/ai-stories';
import aiTestCasesRoutes from './routes/ai-test-cases';
import aiTestSuitesRoutes from './routes/ai-test-suites';
import aiGenerationRoutes from './routes/ai-generation';
import aiSyncRoutes from './routes/ai-sync';
import reportsRoutes from './routes/reports';
import roadmapRoutes from './routes/roadmap';
import searchRoutes from './routes/search';
import epicsRoutes from './routes/epics';
import authRoutes from './routes/auth';
import testExecutionRoutes from './routes/test-execution';
import testReportsRoutes from './routes/test-reports';
import testCyclesRoutes from './routes/test-cycles';
import aiInsightsRoutes from './routes/ai-insights';
import teamsRoutes from './routes/teams';
import notificationsRoutes from './routes/notifications';
import notificationPreferencesRoutes from './routes/notification-preferences';
import dashboardsNewRoutes from './routes/dashboards-new';
import gadgetsRoutes from './routes/gadgets';
import attachmentsEnhancedRoutes from './routes/attachments-enhanced';
import savedFiltersRoutes from './routes/saved-filters';
import bulkOperationsRoutes from './routes/bulk-operations';
import watchersRoutes from './routes/watchers';
import votesRoutes from './routes/votes';
import reportsEnhancedRoutes from './routes/reports-enhanced';
import notificationsEnhancedRoutes from './routes/notifications-enhanced';
import boardViewsRoutes from './routes/board-views';
import testNotificationsRoutes from './routes/test-notifications';
import analyticsRoutes from './routes/analytics';
import timeTrackingRoutes from './routes/time-tracking';
import webhooksRoutes from './routes/webhooks';
import manualTestCasesRoutes from './routes/manual-test-cases';
import testSuitesRoutes from './routes/test-suites';
import testRunsRoutes from './routes/test-runs';
import automationRoutes from './routes/automation';
import searchAIRoutes from './routes/search-ai';
import chatRoutes from './routes/chat';
import chatEnhancedRoutes from './routes/chat-enhanced';
import aiCopilotRoutes from './routes/ai-copilot';
import voiceAssistantRoutes from './routes/voice-assistant';
import issueActionsRoutes from './routes/issue-actions';
import aiSmartRoutes from './routes/ai-smart';
import pmBotRoutes from './routes/pmbot';
import meetingScribeRoutes from './routes/meeting-scribe';
import predictiveAlertsRoutes from './routes/predictive-alerts';
import bugAIRoutes from './routes/bug-ai';
import aiDescriptionRoutes from './routes/ai-description';
import issueMergeRoutes from './routes/issue-merge';
import duplicateFeedbackRoutes from './routes/duplicate-feedback';
import teamComparisonRoutes from './routes/team-comparison';
import testEmailRoutes from './routes/test-email';
import templatesRoutes from './routes/templates';
import aiAutoAssignmentRoutes from './routes/ai-auto-assignment';
import aiSmartPrioritizationRoutes from './routes/ai-smart-prioritization';
import aiAutoTaggingRoutes from './routes/ai-auto-tagging';
import emailToIssueRoutes from './routes/email-to-issue';
import aiSprintAutoPopulateRoutes from './routes/ai-sprint-auto-populate';
import aiNotificationFilterRoutes from './routes/ai-notification-filter';
import aiTestCaseGeneratorRoutes from './routes/ai-test-case-generator';
import testCasesRoutes from './routes/test-cases';
import projectTemplatesRoutes from './routes/project-templates';
import teamsWebhookRoutes from './routes/teams-webhook';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8500;

// Middleware - Allow multiple origins for development
const allowedOrigins = [
  'http://localhost:1600',
  'http://127.0.0.1:1600',
  'http://localhost:1500',
  'http://127.0.0.1:1500',
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 ||
      origin.includes('127.0.0.1') ||
      origin.includes('localhost') ||
      origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting removed by user request

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/issues', issueMergeRoutes);
app.use('/api/issue-templates', issueTemplateRoutes);
app.use('/api/issue-export', issueExportRoutes);
app.use('/api/custom-fields', customFieldRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/sprint-retrospectives', sprintRetroRoutes);
app.use('/api/search-history', searchHistoryRoutes);
app.use('/api/project-members', projectMemberRoutes);
app.use('/api/project-invitations', projectInvitationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/filters', filterRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/issue-links', issueLinksRoutes);
app.use('/api/subtasks', subtasksRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/workflows', workflowsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/epics', epicsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/test-email', testEmailRoutes);
app.use('/api/project-templates', projectTemplatesRoutes);
app.use('/api/teams-webhook', teamsWebhookRoutes);

// AI Test Automation routes
app.use('/api/ai-test-automation/requirements', aiRequirementsRoutes);
app.use('/api/ai-test-automation/stories', aiStoriesRoutes);
app.use('/api/ai-test-automation/test-cases', aiTestCasesRoutes);
app.use('/api/ai-test-automation/suites', aiTestSuitesRoutes);
app.use('/api/ai-test-automation/generate', aiGenerationRoutes);
app.use('/api/ai-test-automation/sync', aiSyncRoutes);

// Test Execution routes
app.use('/api/test-execution', testExecutionRoutes);
app.use('/api/test-reports', testReportsRoutes);
app.use('/api/test-cycles', testCyclesRoutes);
app.use('/api/ai-insights', aiInsightsRoutes);

// Team Management routes
app.use('/api/teams', teamsRoutes);

// Notifications routes
app.use('/api/notifications', notificationsRoutes);
app.use('/api/notification-preferences', notificationPreferencesRoutes);

// Dashboard routes (new implementation)
app.use('/api/dashboards-v2', dashboardsNewRoutes);
app.use('/api/gadgets', gadgetsRoutes);

// Attachments routes (enhanced)
app.use('/api/attachments-v2', attachmentsEnhancedRoutes);

// Saved Filters routes
app.use('/api/saved-filters', savedFiltersRoutes);

// Bulk Operations routes
app.use('/api/bulk-operations', bulkOperationsRoutes);

// Watchers & Votes routes
app.use('/api/watchers', watchersRoutes);
app.use('/api/votes', votesRoutes);

// Enhanced Reports routes
app.use('/api/reports-v2', reportsEnhancedRoutes);

// Enhanced Notifications routes
app.use('/api/notifications-v2', notificationsEnhancedRoutes);

// Board Views routes
app.use('/api/board-views', boardViewsRoutes);

// Test Notifications routes (for development testing)
app.use('/api/test-notifications', testNotificationsRoutes);

// Analytics routes
app.use('/api/analytics', analyticsRoutes);

// Time Tracking routes
app.use('/api/time-tracking', timeTrackingRoutes);

// Webhooks routes
app.use('/api/webhooks', webhooksRoutes);

// Manual Test Management routes
app.use('/api/manual-test-cases', manualTestCasesRoutes);
app.use('/api/test-suites', testSuitesRoutes);
app.use('/api/test-runs', testRunsRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/search', searchAIRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chat-v2', chatEnhancedRoutes); // Enhanced chat with real data
app.use('/api/ai/copilot', aiCopilotRoutes);
app.use('/api/voice-assistant', voiceAssistantRoutes);
app.use('/api/issue-actions', issueActionsRoutes);
app.use('/api/ai-smart', aiSmartRoutes);
app.use('/api/pmbot', pmBotRoutes);
app.use('/api/meeting-scribe', meetingScribeRoutes);
app.use('/api/predictive-alerts', predictiveAlertsRoutes);
app.use('/api/bug-ai', bugAIRoutes);
app.use('/api/ai-description', aiDescriptionRoutes);
app.use('/api/duplicate-feedback', duplicateFeedbackRoutes);
app.use('/api/team-comparison', teamComparisonRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/ai-auto-assignment', aiAutoAssignmentRoutes);
app.use('/api/ai-smart-prioritization', aiSmartPrioritizationRoutes);
app.use('/api/ai-auto-tagging', aiAutoTaggingRoutes);
app.use('/api/email-to-issue', emailToIssueRoutes);
app.use('/api/ai-sprint-auto-populate', aiSprintAutoPopulateRoutes);
app.use('/api/ai-notification-filter', aiNotificationFilterRoutes);
app.use('/api/ai-test-case-generator', aiTestCaseGeneratorRoutes);
app.use('/api/test-cases', testCasesRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Ayphen Jira API is running' });
});

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket
const websocketService = initializeWebSocket(httpServer);
console.log('🔌 WebSocket service initialized');

// Initialize database and start server
AppDataSource.initialize()
  .then(() => {
    console.log('✅ Database connected successfully');

    httpServer.listen(PORT as number, '0.0.0.0', () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
      console.log(`🔌 WebSocket server ready on ws://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });

// Export websocket service for use in routes
export { websocketService };
