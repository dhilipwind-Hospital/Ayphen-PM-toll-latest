import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Issue } from '../entities/Issue';
import { aiBugAnalyzer } from '../services/ai-bug-analyzer.service';

const router = Router();

/**
 * POST /api/bug-ai/classify/:issueId
 * Auto-classify a bug with AI analysis
 */
router.post('/classify/:issueId', async (req: Request, res: Response) => {
    try {
        const issueRepository = AppDataSource.getRepository(Issue);
        const issue = await issueRepository.findOne({
            where: { id: req.params.issueId },
            relations: ['reporter', 'assignee', 'project']
        });

        if (!issue) {
            return res.status(404).json({ error: 'Issue not found' });
        }

        if (issue.type !== 'bug') {
            return res.status(400).json({ error: 'This endpoint is only for bug issues' });
        }

        const classification = await aiBugAnalyzer.classifyBug(issue);

        // Optionally auto-update the issue with AI suggestions
        if (req.body.autoApply) {
            issue.priority = classification.priority.toLowerCase();
            // You could also update labels/tags here
            await issueRepository.save(issue);
        }

        res.json({
            success: true,
            classification,
            issueKey: issue.key
        });
    } catch (error) {
        console.error('Error classifying bug:', error);
        res.status(500).json({
            error: 'Failed to classify bug',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * POST /api/bug-ai/find-similar/:issueId
 * Find similar/duplicate bugs
 */
router.post('/find-similar/:issueId', async (req: Request, res: Response) => {
    try {
        const issueRepository = AppDataSource.getRepository(Issue);
        const issue = await issueRepository.findOne({
            where: { id: req.params.issueId }
        });

        if (!issue) {
            return res.status(404).json({ error: 'Issue not found' });
        }

        // Get all bugs from the same project
        const allIssues = await issueRepository.find({
            where: { projectId: issue.projectId }
        });

        const similarBugs = await aiBugAnalyzer.findSimilarBugs(issue, allIssues);

        res.json({
            success: true,
            issueKey: issue.key,
            similarBugs,
            count: similarBugs.length
        });
    } catch (error) {
        console.error('Error finding similar bugs:', error);
        res.status(500).json({
            error: 'Failed to find similar bugs',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * POST /api/bug-ai/root-cause/:issueId
 * Analyze root cause from stack trace
 */
router.post('/root-cause/:issueId', async (req: Request, res: Response) => {
    try {
        const issueRepository = AppDataSource.getRepository(Issue);
        const issue = await issueRepository.findOne({
            where: { id: req.params.issueId }
        });

        if (!issue) {
            return res.status(404).json({ error: 'Issue not found' });
        }

        const stackTrace = req.body.stackTrace; // Optional override
        const analysis = await aiBugAnalyzer.analyzeRootCause(issue, stackTrace);

        res.json({
            success: true,
            issueKey: issue.key,
            analysis
        });
    } catch (error) {
        console.error('Error analyzing root cause:', error);
        res.status(500).json({
            error: 'Failed to analyze root cause',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * POST /api/bug-ai/generate-tests/:issueId
 * Generate test cases for a bug
 */
router.post('/generate-tests/:issueId', async (req: Request, res: Response) => {
    try {
        const issueRepository = AppDataSource.getRepository(Issue);
        const issue = await issueRepository.findOne({
            where: { id: req.params.issueId }
        });

        if (!issue) {
            return res.status(404).json({ error: 'Issue not found' });
        }

        const testCases = await aiBugAnalyzer.generateTestCases(issue);

        res.json({
            success: true,
            issueKey: issue.key,
            testCases,
            count: testCases.length
        });
    } catch (error) {
        console.error('Error generating test cases:', error);
        res.status(500).json({
            error: 'Failed to generate test cases',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * POST /api/bug-ai/predict-impact/:issueId
 * Predict bug impact and priority
 */
router.post('/predict-impact/:issueId', async (req: Request, res: Response) => {
    try {
        const issueRepository = AppDataSource.getRepository(Issue);
        const issue = await issueRepository.findOne({
            where: { id: req.params.issueId }
        });

        if (!issue) {
            return res.status(404).json({ error: 'Issue not found' });
        }

        const impact = await aiBugAnalyzer.predictImpact(issue);

        res.json({
            success: true,
            issueKey: issue.key,
            impact
        });
    } catch (error) {
        console.error('Error predicting impact:', error);
        res.status(500).json({
            error: 'Failed to predict impact',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * POST /api/bug-ai/full-analysis/:issueId
 * Run all AI analyses on a bug at once
 */
router.post('/full-analysis/:issueId', async (req: Request, res: Response) => {
    try {
        const issueRepository = AppDataSource.getRepository(Issue);
        const issue = await issueRepository.findOne({
            where: { id: req.params.issueId }
        });

        if (!issue) {
            return res.status(404).json({ error: 'Issue not found' });
        }

        if (issue.type !== 'bug') {
            return res.status(400).json({ error: 'This endpoint is only for bug issues' });
        }

        // Get all bugs for similarity check
        const allIssues = await issueRepository.find({
            where: { projectId: issue.projectId }
        });

        // Run all analyses in parallel
        const [classification, similarBugs, rootCause, testCases, impact] = await Promise.all([
            aiBugAnalyzer.classifyBug(issue),
            aiBugAnalyzer.findSimilarBugs(issue, allIssues),
            aiBugAnalyzer.analyzeRootCause(issue),
            aiBugAnalyzer.generateTestCases(issue),
            aiBugAnalyzer.predictImpact(issue)
        ]);

        res.json({
            success: true,
            issueKey: issue.key,
            analysis: {
                classification,
                similarBugs,
                rootCause,
                testCases,
                impact
            }
        });
    } catch (error) {
        console.error('Error running full analysis:', error);
        res.status(500).json({
            error: 'Failed to run full analysis',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
