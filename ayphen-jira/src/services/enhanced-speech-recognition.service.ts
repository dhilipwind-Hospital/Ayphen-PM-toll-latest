/**
 * Enhanced Speech Recognition Service
 * Provides advanced speech recognition with confidence scoring, multi-language support,
 * and fallback mechanisms
 */

export interface TranscriptResult {
  text: string;
  confidence: number; // 0-1
  alternatives: Array<{ text: string; confidence: number }>;
  isFinal: boolean;
  language: string;
}

export interface RecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  confidenceThreshold: number;
  customVocabulary?: string[];
}

export interface RecognitionCallbacks {
  onResult: (result: TranscriptResult) => void;
  onError: (error: RecognitionError) => void;
  onStart: () => void;
  onEnd: () => void;
  onAudioLevel?: (level: number) => void;
}

export interface RecognitionError {
  type: 'no-speech' | 'aborted' | 'audio-capture' | 'network' | 'not-allowed' | 'service-not-allowed' | 'bad-grammar' | 'language-not-supported' | 'unknown';
  message: string;
  recoverable: boolean;
}

export class EnhancedSpeechRecognitionService {
  private recognition: any = null;
  private isSupported: boolean = false;
  private config: RecognitionConfig;
  private callbacks: RecognitionCallbacks | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioLevelInterval: number | null = null;

  constructor(config?: Partial<RecognitionConfig>) {
    this.config = {
      language: 'en-US',
      continuous: false,
      interimResults: true,
      maxAlternatives: 3,
      confidenceThreshold: 0.7,
      ...config
    };

    this.checkSupport();
    if (this.isSupported) {
      this.initializeRecognition();
    }
  }

  /**
   * Check if speech recognition is supported in the current browser
   */
  private checkSupport(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.isSupported = !!SpeechRecognition;
  }

  /**
   * Get browser support status
   */
  public isBrowserSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get detailed browser compatibility info
   */
  public getBrowserInfo(): {
    supported: boolean;
    browser: string;
    features: {
      speechRecognition: boolean;
      audioContext: boolean;
      mediaDevices: boolean;
    };
  } {
    const userAgent = navigator.userAgent.toLowerCase();
    let browser = 'unknown';

    if (userAgent.includes('chrome')) browser = 'chrome';
    else if (userAgent.includes('safari')) browser = 'safari';
    else if (userAgent.includes('firefox')) browser = 'firefox';
    else if (userAgent.includes('edge')) browser = 'edge';

    return {
      supported: this.isSupported,
      browser,
      features: {
        speechRecognition: this.isSupported,
        audioContext: !!(window as any).AudioContext || !!(window as any).webkitAudioContext,
        mediaDevices: !!navigator.mediaDevices
      }
    };
  }

  /**
   * Initialize speech recognition with configuration
   */
  private initializeRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.lang = this.config.language;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for speech recognition
   */
  private setupEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      if (this.callbacks?.onStart) {
        this.callbacks.onStart();
      }
      this.startAudioLevelMonitoring();
    };

    this.recognition.onresult = (event: any) => {
      const results = this.parseResults(event);
      
      for (const result of results) {
        if (this.callbacks?.onResult) {
          this.callbacks.onResult(result);
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      const error = this.parseError(event);
      if (this.callbacks?.onError) {
        this.callbacks.onError(error);
      }
    };

    this.recognition.onend = () => {
      if (this.callbacks?.onEnd) {
        this.callbacks.onEnd();
      }
      this.stopAudioLevelMonitoring();
    };
  }

  /**
   * Parse speech recognition results with confidence scoring
   */
  private parseResults(event: any): TranscriptResult[] {
    const results: TranscriptResult[] = [];

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const isFinal = result.isFinal;

      // Get primary transcript
      const primaryTranscript = result[0].transcript;
      const primaryConfidence = result[0].confidence || 0;

      // Get alternatives
      const alternatives: Array<{ text: string; confidence: number }> = [];
      for (let j = 0; j < Math.min(result.length, this.config.maxAlternatives); j++) {
        alternatives.push({
          text: result[j].transcript,
          confidence: result[j].confidence || 0
        });
      }

      results.push({
        text: primaryTranscript,
        confidence: primaryConfidence,
        alternatives,
        isFinal,
        language: this.config.language
      });
    }

    return results;
  }

  /**
   * Parse and categorize errors
   */
  private parseError(event: any): RecognitionError {
    const errorType = event.error;
    let message = '';
    let recoverable = true;

    switch (errorType) {
      case 'no-speech':
        message = 'No speech was detected. Please try again.';
        recoverable = true;
        break;
      case 'aborted':
        message = 'Speech recognition was aborted.';
        recoverable = true;
        break;
      case 'audio-capture':
        message = 'No microphone was found or microphone is not working.';
        recoverable = false;
        break;
      case 'network':
        message = 'Network error occurred. Please check your connection.';
        recoverable = true;
        break;
      case 'not-allowed':
        message = 'Microphone access was denied. Please allow microphone access.';
        recoverable = false;
        break;
      case 'service-not-allowed':
        message = 'Speech recognition service is not allowed.';
        recoverable = false;
        break;
      case 'bad-grammar':
        message = 'Speech recognition grammar error.';
        recoverable = true;
        break;
      case 'language-not-supported':
        message = `Language ${this.config.language} is not supported.`;
        recoverable = false;
        break;
      default:
        message = 'An unknown error occurred.';
        recoverable = true;
    }

    return {
      type: errorType,
      message,
      recoverable
    };
  }

  /**
   * Start audio level monitoring for visual feedback
   */
  private async startAudioLevelMonitoring(): Promise<void> {
    if (!this.callbacks?.onAudioLevel) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);
      this.analyser.fftSize = 256;

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        if (!this.analyser || !this.callbacks?.onAudioLevel) return;
        
        this.analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const normalizedLevel = average / 255;

        this.callbacks.onAudioLevel(normalizedLevel);
      };

      this.audioLevelInterval = window.setInterval(updateLevel, 100);
    } catch (error) {
      console.error('Failed to start audio level monitoring:', error);
    }
  }

  /**
   * Stop audio level monitoring
   */
  private stopAudioLevelMonitoring(): void {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
  }

  /**
   * Start speech recognition
   */
  public start(callbacks: RecognitionCallbacks): void {
    if (!this.isSupported) {
      callbacks.onError({
        type: 'service-not-allowed',
        message: 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.',
        recoverable: false
      });
      return;
    }

    this.callbacks = callbacks;

    try {
      this.recognition.start();
    } catch (error: any) {
      callbacks.onError({
        type: 'unknown',
        message: error.message || 'Failed to start speech recognition',
        recoverable: true
      });
    }
  }

  /**
   * Stop speech recognition
   */
  public stop(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
    this.stopAudioLevelMonitoring();
  }

  /**
   * Abort speech recognition
   */
  public abort(): void {
    if (this.recognition) {
      this.recognition.abort();
    }
    this.stopAudioLevelMonitoring();
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<RecognitionConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.recognition) {
      this.recognition.lang = this.config.language;
      this.recognition.continuous = this.config.continuous;
      this.recognition.interimResults = this.config.interimResults;
      this.recognition.maxAlternatives = this.config.maxAlternatives;
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): RecognitionConfig {
    return { ...this.config };
  }

  /**
   * Check if confidence meets threshold
   */
  public isConfidenceAcceptable(confidence: number): boolean {
    return confidence >= this.config.confidenceThreshold;
  }

  /**
   * Get supported languages
   */
  public static getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'es-ES', name: 'Spanish (Spain)' },
      { code: 'es-MX', name: 'Spanish (Mexico)' },
      { code: 'fr-FR', name: 'French (France)' },
      { code: 'de-DE', name: 'German (Germany)' },
      { code: 'it-IT', name: 'Italian (Italy)' },
      { code: 'pt-BR', name: 'Portuguese (Brazil)' },
      { code: 'pt-PT', name: 'Portuguese (Portugal)' },
      { code: 'ru-RU', name: 'Russian (Russia)' },
      { code: 'ja-JP', name: 'Japanese (Japan)' },
      { code: 'ko-KR', name: 'Korean (Korea)' },
      { code: 'zh-CN', name: 'Chinese (Simplified)' },
      { code: 'zh-TW', name: 'Chinese (Traditional)' },
      { code: 'hi-IN', name: 'Hindi (India)' },
      { code: 'ar-SA', name: 'Arabic (Saudi Arabia)' }
    ];
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stop();
    this.callbacks = null;
    this.recognition = null;
  }
}

// Singleton instance for global use
let globalInstance: EnhancedSpeechRecognitionService | null = null;

export const getEnhancedSpeechRecognition = (config?: Partial<RecognitionConfig>): EnhancedSpeechRecognitionService => {
  if (!globalInstance) {
    globalInstance = new EnhancedSpeechRecognitionService(config);
  } else if (config) {
    globalInstance.updateConfig(config);
  }
  return globalInstance;
};

export const resetEnhancedSpeechRecognition = (): void => {
  if (globalInstance) {
    globalInstance.destroy();
    globalInstance = null;
  }
};
