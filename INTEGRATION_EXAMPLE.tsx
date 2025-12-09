/**
 * Integration Example: How to Use Enhanced Voice Assistant
 * Phase 1-2 Foundation Features
 */

import React, { useState } from 'react';
import { EnhancedVoiceAssistant } from './ayphen-jira/src/components/VoiceEnhanced';

// ============================================================================
// EXAMPLE 1: Basic Integration (Replace Existing Voice Assistant)
// ============================================================================

export function IssueDetailPageExample() {
  const [issue, setIssue] = useState<any>(null);

  const handleUpdate = async () => {
    // Refetch issue data after voice command
    const response = await fetch(`/api/issues/${issue.id}`);
    const data = await response.json();
    setIssue(data);
  };

  return (
    <div>
      <h1>{issue?.summary}</h1>
      
      {/* Enhanced Voice Assistant with all Phase 1-2 features */}
      <EnhancedVoiceAssistant
        issueId={issue?.id}
        projectId={issue?.projectId}
        onUpdate={handleUpdate}
        mode="voice" // or "text" or "hybrid"
        showPreview={true} // Show command preview before execution
        autoExecute={false} // Require confirmation
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Text Mode (Firefox Fallback)
// ============================================================================

export function TextModeExample() {
  return (
    <EnhancedVoiceAssistant
      issueId="PROJ-123"
      mode="text" // Force text mode
      showPreview={false} // Skip preview for faster execution
      autoExecute={true} // Execute on Ctrl+Enter
    />
  );
}

// ============================================================================
// EXAMPLE 3: Custom Visual Feedback
// ============================================================================

import { VoiceWaveform, ConfidenceBar } from './ayphen-jira/src/components/VoiceEnhanced';

export function CustomVisualizationExample() {
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [confidence, setConfidence] = useState(0);

  return (
    <div>
      {/* Waveform Visualization */}
      <VoiceWaveform
        isListening={isListening}
        audioLevel={audioLevel}
        style="bars" // or "gradient" or "circle"
        barCount={12}
        color="#EC4899"
      />

      {/* Confidence Indicator */}
      <ConfidenceBar
        confidence={confidence}
        threshold={0.7}
        showPercentage={true}
        showLabel={true}
        size="medium"
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Offline Queue Management
// ============================================================================

import { offlineCommandQueue } from './ayphen-jira/src/components/VoiceEnhanced';

export function OfflineQueueExample() {
  const [queueStats, setQueueStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    failed: 0,
    completed: 0
  });

  React.useEffect(() => {
    // Subscribe to queue changes
    const unsubscribe = offlineCommandQueue.subscribe((queue) => {
      const stats = offlineCommandQueue.getStats();
      setQueueStats(stats);
    });

    return unsubscribe;
  }, []);

  const handleSyncQueue = async () => {
    const result = await offlineCommandQueue.syncQueue();
    console.log(`Synced: ${result.successful} successful, ${result.failed} failed`);
  };

  const handleClearCompleted = () => {
    offlineCommandQueue.clearCompleted();
  };

  return (
    <div>
      <h3>Offline Queue Status</h3>
      <p>Total: {queueStats.total}</p>
      <p>Pending: {queueStats.pending}</p>
      <p>Processing: {queueStats.processing}</p>
      <p>Failed: {queueStats.failed}</p>
      <p>Completed: {queueStats.completed}</p>

      <button onClick={handleSyncQueue}>Sync Now</button>
      <button onClick={handleClearCompleted}>Clear Completed</button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Multi-Language Support
// ============================================================================

import { EnhancedSpeechRecognitionService } from './ayphen-jira/src/components/VoiceEnhanced';

export function MultiLanguageExample() {
  const [language, setLanguage] = useState('en-US');
  const languages = EnhancedSpeechRecognitionService.getSupportedLanguages();

  return (
    <div>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        {languages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>

      <EnhancedVoiceAssistant
        issueId="PROJ-123"
        mode="voice"
        // Language is automatically applied from the dropdown in the component
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Command Preview with Custom Actions
// ============================================================================

import { CommandPreview } from './ayphen-jira/src/components/VoiceEnhanced';

export function CommandPreviewExample() {
  const [command, setCommand] = useState('set priority to high');
  const [parsedAction, setParsedAction] = useState({
    intent: 'update_priority',
    entities: { priority: 'high' },
    description: 'Update issue priority to high'
  });

  const handleConfirm = async () => {
    console.log('Executing command:', command);
    // Execute the command
  };

  const handleEdit = (newCommand: string) => {
    setCommand(newCommand);
    // Re-parse the command
  };

  const handleCancel = () => {
    setCommand('');
    setParsedAction(null);
  };

  return (
    <CommandPreview
      command={command}
      parsedAction={parsedAction}
      confidence={0.92}
      onConfirm={handleConfirm}
      onEdit={handleEdit}
      onCancel={handleCancel}
      isProcessing={false}
    />
  );
}

// ============================================================================
// EXAMPLE 7: Browser Compatibility Detection
// ============================================================================

import { getEnhancedSpeechRecognition } from './ayphen-jira/src/components/VoiceEnhanced';

export function BrowserCompatibilityExample() {
  const [browserInfo, setBrowserInfo] = useState<any>(null);

  React.useEffect(() => {
    const recognition = getEnhancedSpeechRecognition();
    const info = recognition.getBrowserInfo();
    setBrowserInfo(info);
  }, []);

  if (!browserInfo) return null;

  return (
    <div>
      <h3>Browser Compatibility</h3>
      <p>Browser: {browserInfo.browser}</p>
      <p>Speech Recognition: {browserInfo.features.speechRecognition ? '✅' : '❌'}</p>
      <p>Audio Context: {browserInfo.features.audioContext ? '✅' : '❌'}</p>
      <p>Media Devices: {browserInfo.features.mediaDevices ? '✅' : '❌'}</p>

      {!browserInfo.supported && (
        <div style={{ color: 'red' }}>
          Voice input not supported. Please use Chrome, Edge, or Safari.
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: Advanced Configuration
// ============================================================================

import { getEnhancedSpeechRecognition } from './ayphen-jira/src/components/VoiceEnhanced';

export function AdvancedConfigExample() {
  React.useEffect(() => {
    const recognition = getEnhancedSpeechRecognition({
      language: 'en-US',
      continuous: false,
      interimResults: true,
      maxAlternatives: 3,
      confidenceThreshold: 0.7
    });

    // Start listening with custom callbacks
    recognition.start({
      onStart: () => console.log('Started listening'),
      onResult: (result) => {
        console.log('Transcript:', result.text);
        console.log('Confidence:', result.confidence);
        console.log('Alternatives:', result.alternatives);
      },
      onError: (error) => {
        console.error('Error:', error.message);
        console.log('Recoverable:', error.recoverable);
      },
      onEnd: () => console.log('Stopped listening'),
      onAudioLevel: (level) => console.log('Audio level:', level)
    });

    return () => {
      recognition.destroy();
    };
  }, []);

  return <div>Advanced configuration example</div>;
}

// ============================================================================
// EXAMPLE 9: Integration with Existing Components
// ============================================================================

// Replace in IssueDetailPanel.tsx
export function IssueDetailPanelIntegration() {
  return (
    <div className="issue-detail-panel">
      {/* ... other components ... */}
      
      {/* Replace old VoiceAssistant with EnhancedVoiceAssistant */}
      <EnhancedVoiceAssistant
        issueId={issue.id}
        projectId={issue.projectId}
        onUpdate={refetchIssue}
        mode="voice"
        showPreview={true}
        autoExecute={false}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 10: Complete Feature Showcase
// ============================================================================

export function CompleteFeatureShowcase() {
  const [mode, setMode] = useState<'voice' | 'text' | 'hybrid'>('voice');
  const [showPreview, setShowPreview] = useState(true);
  const [autoExecute, setAutoExecute] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Enhanced Voice Assistant - Complete Feature Showcase</h2>

      {/* Configuration Controls */}
      <div style={{ marginBottom: '20px' }}>
        <label>
          Mode:
          <select value={mode} onChange={(e) => setMode(e.target.value as any)}>
            <option value="voice">Voice</option>
            <option value="text">Text</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </label>

        <label style={{ marginLeft: '20px' }}>
          <input
            type="checkbox"
            checked={showPreview}
            onChange={(e) => setShowPreview(e.target.checked)}
          />
          Show Preview
        </label>

        <label style={{ marginLeft: '20px' }}>
          <input
            type="checkbox"
            checked={autoExecute}
            onChange={(e) => setAutoExecute(e.target.checked)}
          />
          Auto Execute
        </label>
      </div>

      {/* Enhanced Voice Assistant */}
      <EnhancedVoiceAssistant
        issueId="PROJ-123"
        projectId="proj-1"
        onUpdate={() => console.log('Issue updated!')}
        mode={mode}
        showPreview={showPreview}
        autoExecute={autoExecute}
      />

      {/* Feature List */}
      <div style={{ marginTop: '40px' }}>
        <h3>Features Demonstrated:</h3>
        <ul>
          <li>✅ Enhanced speech recognition with confidence scoring</li>
          <li>✅ Real-time audio waveform visualization</li>
          <li>✅ Confidence bar with color-coded levels</li>
          <li>✅ Command preview before execution</li>
          <li>✅ Edit transcript inline</li>
          <li>✅ Multi-language support (16 languages)</li>
          <li>✅ Voice/Text/Hybrid mode switching</li>
          <li>✅ Offline command queue with auto-sync</li>
          <li>✅ Browser compatibility detection</li>
          <li>✅ Graceful fallback to text mode</li>
          <li>✅ Online/offline status indicator</li>
          <li>✅ Queued commands counter</li>
        </ul>
      </div>
    </div>
  );
}
