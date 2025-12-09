"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.websocketService = void 0;
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const database_1 = require("./config/database");
const websocket_service_1 = require("./services/websocket.service");
const projects_1 = __importDefault(require("./routes/projects"));
const issues_1 = __importDefault(require("./routes/issues"));
const issue_templates_1 = __importDefault(require("./routes/issue-templates"));
const issue_export_1 = __importDefault(require("./routes/issue-export"));
const custom_fields_1 = __importDefault(require("./routes/custom-fields"));
const users_1 = __importDefault(require("./routes/users"));
const sprints_1 = __importDefault(require("./routes/sprints"));
const sprint_retrospectives_1 = __importDefault(require("./routes/sprint-retrospectives"));
const search_history_1 = __importDefault(require("./routes/search-history"));
const project_members_1 = __importDefault(require("./routes/project-members"));
const project_invitations_1 = __importDefault(require("./routes/project-invitations"));
const admin_1 = __importDefault(require("./routes/admin"));
const comments_1 = __importDefault(require("./routes/comments"));
const attachments_1 = __importDefault(require("./routes/attachments"));
const dashboards_1 = __importDefault(require("./routes/dashboards"));
const filters_1 = __importDefault(require("./routes/filters"));
const settings_1 = __importDefault(require("./routes/settings"));
const issue_links_1 = __importDefault(require("./routes/issue-links"));
const subtasks_1 = __importDefault(require("./routes/subtasks"));
const history_1 = __importDefault(require("./routes/history"));
const workflows_1 = __importDefault(require("./routes/workflows"));
const ai_requirements_1 = __importDefault(require("./routes/ai-requirements"));
const ai_stories_1 = __importDefault(require("./routes/ai-stories"));
const ai_test_cases_1 = __importDefault(require("./routes/ai-test-cases"));
const ai_test_suites_1 = __importDefault(require("./routes/ai-test-suites"));
const ai_generation_1 = __importDefault(require("./routes/ai-generation"));
const ai_sync_1 = __importDefault(require("./routes/ai-sync"));
const reports_1 = __importDefault(require("./routes/reports"));
const roadmap_1 = __importDefault(require("./routes/roadmap"));
const search_1 = __importDefault(require("./routes/search"));
const epics_1 = __importDefault(require("./routes/epics"));
const auth_1 = __importDefault(require("./routes/auth"));
const test_execution_1 = __importDefault(require("./routes/test-execution"));
const test_reports_1 = __importDefault(require("./routes/test-reports"));
const test_cycles_1 = __importDefault(require("./routes/test-cycles"));
const ai_insights_1 = __importDefault(require("./routes/ai-insights"));
const teams_1 = __importDefault(require("./routes/teams"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const notification_preferences_1 = __importDefault(require("./routes/notification-preferences"));
const dashboards_new_1 = __importDefault(require("./routes/dashboards-new"));
const gadgets_1 = __importDefault(require("./routes/gadgets"));
const attachments_enhanced_1 = __importDefault(require("./routes/attachments-enhanced"));
const saved_filters_1 = __importDefault(require("./routes/saved-filters"));
const bulk_operations_1 = __importDefault(require("./routes/bulk-operations"));
const watchers_1 = __importDefault(require("./routes/watchers"));
const votes_1 = __importDefault(require("./routes/votes"));
const reports_enhanced_1 = __importDefault(require("./routes/reports-enhanced"));
const notifications_enhanced_1 = __importDefault(require("./routes/notifications-enhanced"));
const board_views_1 = __importDefault(require("./routes/board-views"));
const test_notifications_1 = __importDefault(require("./routes/test-notifications"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const time_tracking_1 = __importDefault(require("./routes/time-tracking"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
const manual_test_cases_1 = __importDefault(require("./routes/manual-test-cases"));
const test_suites_1 = __importDefault(require("./routes/test-suites"));
const test_runs_1 = __importDefault(require("./routes/test-runs"));
const automation_1 = __importDefault(require("./routes/automation"));
const search_ai_1 = __importDefault(require("./routes/search-ai"));
const chat_1 = __importDefault(require("./routes/chat"));
const chat_enhanced_1 = __importDefault(require("./routes/chat-enhanced"));
const ai_copilot_1 = __importDefault(require("./routes/ai-copilot"));
const voice_assistant_1 = __importDefault(require("./routes/voice-assistant"));
const issue_actions_1 = __importDefault(require("./routes/issue-actions"));
const ai_smart_1 = __importDefault(require("./routes/ai-smart"));
const pmbot_1 = __importDefault(require("./routes/pmbot"));
const meeting_scribe_1 = __importDefault(require("./routes/meeting-scribe"));
const predictive_alerts_1 = __importDefault(require("./routes/predictive-alerts"));
const bug_ai_1 = __importDefault(require("./routes/bug-ai"));
const ai_description_1 = __importDefault(require("./routes/ai-description"));
const issue_merge_1 = __importDefault(require("./routes/issue-merge"));
const duplicate_feedback_1 = __importDefault(require("./routes/duplicate-feedback"));
const team_comparison_1 = __importDefault(require("./routes/team-comparison"));
const templates_1 = __importDefault(require("./routes/templates"));
const ai_auto_assignment_1 = __importDefault(require("./routes/ai-auto-assignment"));
const ai_smart_prioritization_1 = __importDefault(require("./routes/ai-smart-prioritization"));
const ai_auto_tagging_1 = __importDefault(require("./routes/ai-auto-tagging"));
const email_to_issue_1 = __importDefault(require("./routes/email-to-issue"));
const ai_sprint_auto_populate_1 = __importDefault(require("./routes/ai-sprint-auto-populate"));
const ai_notification_filter_1 = __importDefault(require("./routes/ai-notification-filter"));
const ai_test_case_generator_1 = __importDefault(require("./routes/ai-test-case-generator"));
const test_cases_1 = __importDefault(require("./routes/test-cases"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8500;
// Middleware - Allow multiple origins for development
const allowedOrigins = [
    'http://localhost:1600',
    'http://127.0.0.1:1600',
    'http://localhost:1500',
    'http://127.0.0.1:1500',
    process.env.CORS_ORIGIN
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('127.0.0.1') || origin.includes('localhost')) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files from uploads directory
app.use('/uploads', express_1.default.static('uploads'));
// Routes
app.use('/api/projects', projects_1.default);
app.use('/api/issues', issues_1.default);
app.use('/api/issues', issue_merge_1.default);
app.use('/api/issue-templates', issue_templates_1.default);
app.use('/api/issue-export', issue_export_1.default);
app.use('/api/custom-fields', custom_fields_1.default);
app.use('/api/users', users_1.default);
app.use('/api/sprints', sprints_1.default);
app.use('/api/sprint-retrospectives', sprint_retrospectives_1.default);
app.use('/api/search-history', search_history_1.default);
app.use('/api/project-members', project_members_1.default);
app.use('/api/project-invitations', project_invitations_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/comments', comments_1.default);
app.use('/api/attachments', attachments_1.default);
app.use('/api/dashboards', dashboards_1.default);
app.use('/api/filters', filters_1.default);
app.use('/api/settings', settings_1.default);
app.use('/api/issue-links', issue_links_1.default);
app.use('/api/subtasks', subtasks_1.default);
app.use('/api/history', history_1.default);
app.use('/api/workflows', workflows_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/roadmap', roadmap_1.default);
app.use('/api/search', search_1.default);
app.use('/api/epics', epics_1.default);
app.use('/api/auth', auth_1.default);
// AI Test Automation routes
app.use('/api/ai-test-automation/requirements', ai_requirements_1.default);
app.use('/api/ai-test-automation/stories', ai_stories_1.default);
app.use('/api/ai-test-automation/test-cases', ai_test_cases_1.default);
app.use('/api/ai-test-automation/suites', ai_test_suites_1.default);
app.use('/api/ai-test-automation/generate', ai_generation_1.default);
app.use('/api/ai-test-automation/sync', ai_sync_1.default);
// Test Execution routes
app.use('/api/test-execution', test_execution_1.default);
app.use('/api/test-reports', test_reports_1.default);
app.use('/api/test-cycles', test_cycles_1.default);
app.use('/api/ai-insights', ai_insights_1.default);
// Team Management routes
app.use('/api/teams', teams_1.default);
// Notifications routes
app.use('/api/notifications', notifications_1.default);
app.use('/api/notification-preferences', notification_preferences_1.default);
// Dashboard routes (new implementation)
app.use('/api/dashboards-v2', dashboards_new_1.default);
app.use('/api/gadgets', gadgets_1.default);
// Attachments routes (enhanced)
app.use('/api/attachments-v2', attachments_enhanced_1.default);
// Saved Filters routes
app.use('/api/saved-filters', saved_filters_1.default);
// Bulk Operations routes
app.use('/api/bulk-operations', bulk_operations_1.default);
// Watchers & Votes routes
app.use('/api/watchers', watchers_1.default);
app.use('/api/votes', votes_1.default);
// Enhanced Reports routes
app.use('/api/reports-v2', reports_enhanced_1.default);
// Enhanced Notifications routes
app.use('/api/notifications-v2', notifications_enhanced_1.default);
// Board Views routes
app.use('/api/board-views', board_views_1.default);
// Test Notifications routes (for development testing)
app.use('/api/test-notifications', test_notifications_1.default);
// Analytics routes
app.use('/api/analytics', analytics_1.default);
// Time Tracking routes
app.use('/api/time-tracking', time_tracking_1.default);
// Webhooks routes
app.use('/api/webhooks', webhooks_1.default);
// Manual Test Management routes
app.use('/api/manual-test-cases', manual_test_cases_1.default);
app.use('/api/test-suites', test_suites_1.default);
app.use('/api/test-runs', test_runs_1.default);
app.use('/api/automation', automation_1.default);
app.use('/api/search', search_ai_1.default);
app.use('/api/chat', chat_1.default);
app.use('/api/chat-v2', chat_enhanced_1.default); // Enhanced chat with real data
app.use('/api/ai/copilot', ai_copilot_1.default);
app.use('/api/voice-assistant', voice_assistant_1.default);
app.use('/api/issue-actions', issue_actions_1.default);
app.use('/api/ai-smart', ai_smart_1.default);
app.use('/api/pmbot', pmbot_1.default);
app.use('/api/meeting-scribe', meeting_scribe_1.default);
app.use('/api/predictive-alerts', predictive_alerts_1.default);
app.use('/api/bug-ai', bug_ai_1.default);
app.use('/api/ai-description', ai_description_1.default);
app.use('/api/duplicate-feedback', duplicate_feedback_1.default);
app.use('/api/team-comparison', team_comparison_1.default);
app.use('/api/templates', templates_1.default);
app.use('/api/ai-auto-assignment', ai_auto_assignment_1.default);
app.use('/api/ai-smart-prioritization', ai_smart_prioritization_1.default);
app.use('/api/ai-auto-tagging', ai_auto_tagging_1.default);
app.use('/api/email-to-issue', email_to_issue_1.default);
app.use('/api/ai-sprint-auto-populate', ai_sprint_auto_populate_1.default);
app.use('/api/ai-notification-filter', ai_notification_filter_1.default);
app.use('/api/ai-test-case-generator', ai_test_case_generator_1.default);
app.use('/api/test-cases', test_cases_1.default);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Ayphen Jira API is running' });
});
// Create HTTP server
const httpServer = (0, http_1.createServer)(app);
// Initialize WebSocket
const websocketService = (0, websocket_service_1.initializeWebSocket)(httpServer);
exports.websocketService = websocketService;
console.log('🔌 WebSocket service initialized');
// Initialize database and start server
database_1.AppDataSource.initialize()
    .then(() => {
    console.log('✅ Database connected successfully');
    httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
        console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
        console.log(`🔌 WebSocket server ready on ws://localhost:${PORT}`);
    });
})
    .catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
});
