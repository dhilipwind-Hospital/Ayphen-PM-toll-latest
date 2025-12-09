"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const TestRun_1 = require("../entities/TestRun");
const TestResult_1 = require("../entities/TestResult");
const AITestCase_1 = require("../entities/AITestCase");
const Issue_1 = require("../entities/Issue");
const router = (0, express_1.Router)();
// GET /api/test-reports/summary - Overall test metrics
router.get('/summary', async (req, res) => {
    try {
        const { projectId, days = 30 } = req.query;
        // VALIDATE projectId is required
        if (!projectId) {
            return res.status(400).json({
                error: 'projectId is required',
                message: 'Reports must be scoped to a project'
            });
        }
        const testRunRepo = database_1.AppDataSource.getRepository(TestRun_1.TestRun);
        const testResultRepo = database_1.AppDataSource.getRepository(TestResult_1.TestResult);
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - Number(days));
        let runQuery = testRunRepo.createQueryBuilder('run')
            .where('run.createdAt >= :dateFrom', { dateFrom })
            .andWhere('run.projectId = :projectId', { projectId });
        const runs = await runQuery.getMany();
        const totalRuns = runs.length;
        const completedRuns = runs.filter(r => r.status === 'completed').length;
        const totalTests = runs.reduce((sum, r) => sum + r.totalTests, 0);
        const passedTests = runs.reduce((sum, r) => sum + r.passed, 0);
        const failedTests = runs.reduce((sum, r) => sum + r.failed, 0);
        const skippedTests = runs.reduce((sum, r) => sum + r.skipped, 0);
        const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0;
        // Average execution time
        const completedRunsWithDuration = runs.filter(r => r.duration);
        const avgExecutionTime = completedRunsWithDuration.length > 0
            ? Math.round(completedRunsWithDuration.reduce((sum, r) => sum + (r.duration || 0), 0) / completedRunsWithDuration.length)
            : 0;
        // Active bugs (test-related)
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const activeBugs = await issueRepo.count({
            where: {
                type: 'bug',
                status: 'todo',
                labels: 'test-failure',
            },
        });
        res.json({
            totalRuns,
            completedRuns,
            totalTests,
            passedTests,
            failedTests,
            skippedTests,
            passRate: Number(passRate),
            avgExecutionTime,
            activeBugs,
            period: `Last ${days} days`,
        });
    }
    catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});
// GET /api/test-reports/trends - Time-series data for charts
router.get('/trends', async (req, res) => {
    try {
        const { projectId, days = 30 } = req.query;
        const testRunRepo = database_1.AppDataSource.getRepository(TestRun_1.TestRun);
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - Number(days));
        let query = testRunRepo.createQueryBuilder('run')
            .where('run.createdAt >= :dateFrom', { dateFrom })
            .orderBy('run.createdAt', 'ASC');
        if (projectId) {
            query = query.andWhere('run.projectId = :projectId', { projectId });
        }
        const runs = await query.getMany();
        // Group by date
        const trendsByDate = {};
        runs.forEach(run => {
            const date = run.createdAt.toISOString().split('T')[0];
            if (!trendsByDate[date]) {
                trendsByDate[date] = {
                    date,
                    runs: 0,
                    totalTests: 0,
                    passed: 0,
                    failed: 0,
                    skipped: 0,
                    passRate: 0,
                };
            }
            trendsByDate[date].runs++;
            trendsByDate[date].totalTests += run.totalTests;
            trendsByDate[date].passed += run.passed;
            trendsByDate[date].failed += run.failed;
            trendsByDate[date].skipped += run.skipped;
        });
        // Calculate pass rates
        const trends = Object.values(trendsByDate).map((day) => ({
            ...day,
            passRate: day.totalTests > 0 ? Number(((day.passed / day.totalTests) * 100).toFixed(2)) : 0,
        }));
        res.json(trends);
    }
    catch (error) {
        console.error('Error fetching trends:', error);
        res.status(500).json({ error: 'Failed to fetch trends' });
    }
});
// GET /api/test-reports/pass-rate - Pass rate by suite/environment
router.get('/pass-rate', async (req, res) => {
    try {
        const { projectId, groupBy = 'suite' } = req.query;
        const testRunRepo = database_1.AppDataSource.getRepository(TestRun_1.TestRun);
        let query = testRunRepo.createQueryBuilder('run')
            .leftJoinAndSelect('run.suite', 'suite');
        if (projectId) {
            query = query.where('run.projectId = :projectId', { projectId });
        }
        const runs = await query.getMany();
        if (groupBy === 'suite') {
            // Group by test suite
            const bySuite = {};
            runs.forEach(run => {
                const suiteName = run.suite?.name || 'Unknown Suite';
                if (!bySuite[suiteName]) {
                    bySuite[suiteName] = {
                        name: suiteName,
                        totalTests: 0,
                        passed: 0,
                        failed: 0,
                        passRate: 0,
                    };
                }
                bySuite[suiteName].totalTests += run.totalTests;
                bySuite[suiteName].passed += run.passed;
                bySuite[suiteName].failed += run.failed;
            });
            const results = Object.values(bySuite).map((suite) => ({
                ...suite,
                passRate: suite.totalTests > 0 ? Number(((suite.passed / suite.totalTests) * 100).toFixed(2)) : 0,
            }));
            res.json(results);
        }
        else if (groupBy === 'environment') {
            // Group by environment
            const byEnv = {};
            runs.forEach(run => {
                const env = run.environment || 'unknown';
                if (!byEnv[env]) {
                    byEnv[env] = {
                        environment: env,
                        totalTests: 0,
                        passed: 0,
                        failed: 0,
                        passRate: 0,
                    };
                }
                byEnv[env].totalTests += run.totalTests;
                byEnv[env].passed += run.passed;
                byEnv[env].failed += run.failed;
            });
            const results = Object.values(byEnv).map((env) => ({
                ...env,
                passRate: env.totalTests > 0 ? Number(((env.passed / env.totalTests) * 100).toFixed(2)) : 0,
            }));
            res.json(results);
        }
        else if (groupBy === 'browser') {
            // Group by browser
            const byBrowser = {};
            runs.forEach(run => {
                const browser = run.browser || 'unknown';
                if (!byBrowser[browser]) {
                    byBrowser[browser] = {
                        browser,
                        totalTests: 0,
                        passed: 0,
                        failed: 0,
                        passRate: 0,
                    };
                }
                byBrowser[browser].totalTests += run.totalTests;
                byBrowser[browser].passed += run.passed;
                byBrowser[browser].failed += run.failed;
            });
            const results = Object.values(byBrowser).map((browser) => ({
                ...browser,
                passRate: browser.totalTests > 0 ? Number(((browser.passed / browser.totalTests) * 100).toFixed(2)) : 0,
            }));
            res.json(results);
        }
    }
    catch (error) {
        console.error('Error fetching pass rate:', error);
        res.status(500).json({ error: 'Failed to fetch pass rate' });
    }
});
// GET /api/test-reports/flaky-tests - List of flaky tests
router.get('/flaky-tests', async (req, res) => {
    try {
        const { projectId, minRuns = 5 } = req.query;
        const testResultRepo = database_1.AppDataSource.getRepository(TestResult_1.TestResult);
        // Get all test results
        let query = testResultRepo.createQueryBuilder('result')
            .leftJoinAndSelect('result.testCase', 'testCase')
            .orderBy('result.createdAt', 'DESC');
        const results = await query.getMany();
        // Group by test case
        const byTestCase = {};
        results.forEach(result => {
            const testCaseId = result.testCaseId;
            if (!byTestCase[testCaseId]) {
                byTestCase[testCaseId] = {
                    testCaseId,
                    testCase: result.testCase,
                    runs: [],
                    passed: 0,
                    failed: 0,
                    total: 0,
                };
            }
            byTestCase[testCaseId].runs.push(result.status);
            byTestCase[testCaseId].total++;
            if (result.status === 'passed')
                byTestCase[testCaseId].passed++;
            if (result.status === 'failed')
                byTestCase[testCaseId].failed++;
        });
        // Identify flaky tests (tests with both passes and failures)
        const flakyTests = Object.values(byTestCase)
            .filter((tc) => tc.total >= Number(minRuns) && tc.passed > 0 && tc.failed > 0)
            .map((tc) => ({
            testCaseId: tc.testCaseId,
            testCaseKey: tc.testCase?.testCaseKey,
            title: tc.testCase?.title,
            totalRuns: tc.total,
            passed: tc.passed,
            failed: tc.failed,
            passRate: Number(((tc.passed / tc.total) * 100).toFixed(2)),
            flakinessScore: Number((100 - Math.abs(50 - (tc.passed / tc.total) * 100) * 2).toFixed(2)),
            lastRuns: tc.runs.slice(0, 10),
        }))
            .sort((a, b) => b.flakinessScore - a.flakinessScore);
        res.json(flakyTests);
    }
    catch (error) {
        console.error('Error fetching flaky tests:', error);
        res.status(500).json({ error: 'Failed to fetch flaky tests' });
    }
});
// GET /api/test-reports/execution-time - Test execution time analysis
router.get('/execution-time', async (req, res) => {
    try {
        const { projectId } = req.query;
        const testResultRepo = database_1.AppDataSource.getRepository(TestResult_1.TestResult);
        let query = testResultRepo.createQueryBuilder('result')
            .leftJoinAndSelect('result.testCase', 'testCase')
            .where('result.executionTime IS NOT NULL')
            .orderBy('result.executionTime', 'DESC')
            .limit(50);
        const results = await query.getMany();
        const slowestTests = results.map(result => ({
            testCaseId: result.testCaseId,
            testCaseKey: result.testCase?.testCaseKey,
            title: result.testCase?.title,
            executionTime: result.executionTime,
            status: result.status,
            environment: result.environment,
            browser: result.browser,
            createdAt: result.createdAt,
        }));
        // Calculate average execution time
        const avgTime = results.length > 0
            ? Math.round(results.reduce((sum, r) => sum + (r.executionTime || 0), 0) / results.length)
            : 0;
        res.json({
            slowestTests,
            averageExecutionTime: avgTime,
            totalTests: results.length,
        });
    }
    catch (error) {
        console.error('Error fetching execution time:', error);
        res.status(500).json({ error: 'Failed to fetch execution time' });
    }
});
// GET /api/test-reports/defects - Bug metrics and trends
router.get('/defects', async (req, res) => {
    try {
        const { projectId, days = 30 } = req.query;
        const issueRepo = database_1.AppDataSource.getRepository(Issue_1.Issue);
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - Number(days));
        let query = issueRepo.createQueryBuilder('issue')
            .where('issue.type = :type', { type: 'bug' })
            .andWhere('issue.createdAt >= :dateFrom', { dateFrom });
        if (projectId) {
            query = query.andWhere('issue.projectId = :projectId', { projectId });
        }
        const bugs = await query.getMany();
        const testRelatedBugs = bugs.filter(b => b.labels && (b.labels.includes('test-failure') || b.labels.includes('auto-created')));
        const byStatus = {};
        const byPriority = {};
        testRelatedBugs.forEach(bug => {
            byStatus[bug.status] = (byStatus[bug.status] || 0) + 1;
            byPriority[bug.priority] = (byPriority[bug.priority] || 0) + 1;
        });
        res.json({
            totalBugs: bugs.length,
            testRelatedBugs: testRelatedBugs.length,
            autoCreatedBugs: bugs.filter(b => b.labels && b.labels.includes('auto-created')).length,
            byStatus,
            byPriority,
            recentBugs: testRelatedBugs.slice(0, 10).map(b => ({
                id: b.id,
                key: b.key,
                summary: b.summary,
                status: b.status,
                priority: b.priority,
                createdAt: b.createdAt,
            })),
        });
    }
    catch (error) {
        console.error('Error fetching defects:', error);
        res.status(500).json({ error: 'Failed to fetch defects' });
    }
});
// GET /api/test-reports/coverage - Test coverage metrics
router.get('/coverage', async (req, res) => {
    try {
        const { projectId } = req.query;
        const testCaseRepo = database_1.AppDataSource.getRepository(AITestCase_1.AITestCase);
        const testResultRepo = database_1.AppDataSource.getRepository(TestResult_1.TestResult);
        let testCaseQuery = testCaseRepo.createQueryBuilder('testCase');
        if (projectId) {
            testCaseQuery = testCaseQuery.where('testCase.projectId = :projectId', { projectId });
        }
        const totalTestCases = await testCaseQuery.getCount();
        // Get executed test cases (have at least one result)
        const executedTestCases = await testResultRepo
            .createQueryBuilder('result')
            .select('DISTINCT result.testCaseId')
            .getRawMany();
        const executedCount = executedTestCases.length;
        const coveragePercentage = totalTestCases > 0
            ? Number(((executedCount / totalTestCases) * 100).toFixed(2))
            : 0;
        res.json({
            totalTestCases,
            executedTestCases: executedCount,
            notExecuted: totalTestCases - executedCount,
            coveragePercentage,
        });
    }
    catch (error) {
        console.error('Error fetching coverage:', error);
        res.status(500).json({ error: 'Failed to fetch coverage' });
    }
});
exports.default = router;
