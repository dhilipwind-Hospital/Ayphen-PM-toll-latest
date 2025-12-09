/**
 * Voice Enhanced Components - Export Index
 * Phase 1-2 Foundation Features
 */

export { EnhancedVoiceAssistant } from './EnhancedVoiceAssistant';
export { VoiceWaveform } from './VoiceWaveform';
export { ConfidenceBar } from './ConfidenceBar';
export { CommandPreview } from './CommandPreview';

// Re-export services
export { 
  EnhancedSpeechRecognitionService,
  getEnhancedSpeechRecognition,
  resetEnhancedSpeechRecognition
} from '../../services/enhanced-speech-recognition.service';

export { 
  offlineCommandQueue,
  OfflineCommandQueueService 
} from '../../services/offline-command-queue.service';

// Re-export types
export type { 
  TranscriptResult,
  RecognitionConfig,
  RecognitionCallbacks,
  RecognitionError
} from '../../services/enhanced-speech-recognition.service';

export type {
  QueuedCommand
} from '../../services/offline-command-queue.service';
