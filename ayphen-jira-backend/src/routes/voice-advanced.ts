/**
 * Voice Advanced Features Routes
 * Phase 5-6: Advanced Features
 * 
 * Routes for TTS, batch operations, and analytics
 */

import { Router } from 'express';
import { voiceBatchOperations } from '../services/voice-batch-operations.service';
import { voiceAnalytics } from '../services/voice-analytics.service';

const router = Router();

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * POST /api/voice-advanced/batch/preview
 * Preview batch operation before execution
 */
router.post('/batch/preview', async (req, res) => {
  try {
    const { operation } = req.body;

    if (!operation) {
      return res.status(400).json({
        success: false,
        error: 'Operation is required'
      });
    }

    const preview = await voiceBatchOperations.previewBatch(operation);

    res.json({
      success: true,
      preview
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/voice-advanced/batch/execute
 * Execute batch operation
 */
router.post('/batch/execute', async (req, res) => {
  try {
    const { operation } = req.body;

    if (!operation) {
      return res.status(400).json({
        success: false,
        error: 'Operation is required'
      });
    }

    const result = await voiceBatchOperations.executeBatch(operation);

    // Track analytics
    if (req.body.userId) {
      voiceAnalytics.trackCommand(
        req.body.userId,
        `Batch: ${operation.type}`,
        'batch_operation',
        1.0,
        result.success,
        result.executionTime,
        'batch'
      );
    }

    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/voice-advanced/batch/parse
 * Parse voice command to batch operation
 */
router.post('/batch/parse', async (req, res) => {
  try {
    const { command, context } = req.body;

    if (!command) {
      return res.status(400).json({
        success: false,
        error: 'Command is required'
      });
    }

    const operation = await voiceBatchOperations.parseVoiceCommand(command, context);

    if (!operation) {
      return res.json({
        success: false,
        message: 'Not a batch command'
      });
    }

    res.json({
      success: true,
      operation
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// Analytics
// ============================================================================

/**
 * POST /api/voice-advanced/analytics/track
 * Track analytics event
 */
router.post('/analytics/track', async (req, res) => {
  try {
    const { userId, eventType, data } = req.body;

    if (!userId || !eventType) {
      return res.status(400).json({
        success: false,
        error: 'userId and eventType are required'
      });
    }

    voiceAnalytics.trackEvent({
      userId,
      eventType,
      data: data || {}
    });

    res.json({
      success: true,
      message: 'Event tracked'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/voice-advanced/analytics/summary
 * Get analytics summary
 */
router.get('/analytics/summary', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const summary = voiceAnalytics.getSummary(start, end, userId as string);

    res.json({
      success: true,
      summary
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/voice-advanced/analytics/insights/:userId
 * Get user insights
 */
router.get('/analytics/insights/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days } = req.query;

    const insights = voiceAnalytics.getUserInsights(
      userId,
      days ? parseInt(days as string) : 30
    );

    res.json({
      success: true,
      insights
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/voice-advanced/analytics/realtime
 * Get real-time metrics
 */
router.get('/analytics/realtime', async (req, res) => {
  try {
    const metrics = voiceAnalytics.getRealTimeMetrics();

    res.json({
      success: true,
      metrics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/voice-advanced/analytics/export
 * Export analytics data
 */
router.get('/analytics/export', async (req, res) => {
  try {
    const { startDate, endDate, format } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    const exportFormat = (format as 'json' | 'csv') || 'json';

    const data = voiceAnalytics.exportData(start, end, exportFormat);

    if (exportFormat === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=voice-analytics.csv');
    } else {
      res.setHeader('Content-Type', 'application/json');
    }

    res.send(data);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// TTS Configuration (Frontend will handle actual TTS)
// ============================================================================

/**
 * GET /api/voice-advanced/tts/voices
 * Get available TTS voices (metadata only)
 */
router.get('/tts/voices', async (req, res) => {
  try {
    // Return metadata about recommended voices
    const voices = [
      { name: 'Google US English', lang: 'en-US', gender: 'female', recommended: true },
      { name: 'Google UK English Male', lang: 'en-GB', gender: 'male', recommended: true },
      { name: 'Microsoft David', lang: 'en-US', gender: 'male', recommended: false },
      { name: 'Microsoft Zira', lang: 'en-US', gender: 'female', recommended: false }
    ];

    res.json({
      success: true,
      voices
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/voice-advanced/tts/response
 * Generate TTS response text for command result
 */
router.post('/tts/response', async (req, res) => {
  try {
    const { success, message, emotion } = req.body;

    const prefix = success ? 'Done!' : 'Sorry,';
    const responseText = `${prefix} ${message}`;

    res.json({
      success: true,
      response: {
        text: responseText,
        emotion: emotion || (success ? 'success' : 'error'),
        priority: 'high'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
