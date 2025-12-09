/**
 * Voice Text-to-Speech (TTS) Service
 * Phase 5-6: Advanced Features
 * 
 * Provides voice responses for voice-to-voice interaction
 */

export interface TTSConfig {
  language: string;
  rate: number; // 0.1 to 10
  pitch: number; // 0 to 2
  volume: number; // 0 to 1
  voice?: SpeechSynthesisVoice;
}

export interface TTSResponse {
  text: string;
  emotion?: 'neutral' | 'success' | 'error' | 'warning' | 'info';
  priority?: 'low' | 'normal' | 'high';
  interrupt?: boolean;
}

export class VoiceTTSService {
  private synth: SpeechSynthesis;
  private config: TTSConfig;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private queue: TTSResponse[] = [];
  private isSpeaking: boolean = false;
  private listeners: Array<(event: string, data?: any) => void> = [];

  constructor(config?: Partial<TTSConfig>) {
    this.synth = window.speechSynthesis;
    this.config = {
      language: 'en-US',
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      ...config
    };
  }

  /**
   * Check if TTS is supported
   */
  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices();
  }

  /**
   * Get voices for specific language
   */
  getVoicesForLanguage(language: string): SpeechSynthesisVoice[] {
    return this.getVoices().filter(voice => voice.lang.startsWith(language));
  }

  /**
   * Set preferred voice
   */
  setVoice(voiceName: string): void {
    const voices = this.getVoices();
    const voice = voices.find(v => v.name === voiceName);
    if (voice) {
      this.config.voice = voice;
    }
  }

  /**
   * Speak text with voice
   */
  async speak(response: TTSResponse): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Text-to-Speech not supported');
      return;
    }

    // Handle interrupt
    if (response.interrupt && this.isSpeaking) {
      this.stop();
    }

    // Add to queue if already speaking
    if (this.isSpeaking && !response.interrupt) {
      this.queue.push(response);
      return;
    }

    return this.speakNow(response);
  }

  /**
   * Speak immediately
   */
  private async speakNow(response: TTSResponse): Promise<void> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(response.text);

      // Apply configuration
      utterance.lang = this.config.language;
      utterance.rate = this.config.rate;
      utterance.pitch = this.config.pitch;
      utterance.volume = this.config.volume;

      if (this.config.voice) {
        utterance.voice = this.config.voice;
      }

      // Adjust based on emotion
      if (response.emotion) {
        this.applyEmotion(utterance, response.emotion);
      }

      // Event handlers
      utterance.onstart = () => {
        this.isSpeaking = true;
        this.currentUtterance = utterance;
        this.notifyListeners('start', { text: response.text });
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.notifyListeners('end', { text: response.text });
        
        // Process queue
        if (this.queue.length > 0) {
          const next = this.queue.shift();
          if (next) {
            this.speakNow(next);
          }
        }
        
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.notifyListeners('error', { error: event.error });
        reject(new Error(event.error));
      };

      utterance.onpause = () => {
        this.notifyListeners('pause');
      };

      utterance.onresume = () => {
        this.notifyListeners('resume');
      };

      // Speak
      this.synth.speak(utterance);
    });
  }

  /**
   * Apply emotion to utterance
   */
  private applyEmotion(utterance: SpeechSynthesisUtterance, emotion: string): void {
    switch (emotion) {
      case 'success':
        utterance.pitch = 1.2;
        utterance.rate = 1.1;
        break;
      case 'error':
        utterance.pitch = 0.9;
        utterance.rate = 0.9;
        break;
      case 'warning':
        utterance.pitch = 1.1;
        utterance.rate = 1.0;
        break;
      case 'info':
        utterance.pitch = 1.0;
        utterance.rate = 1.0;
        break;
      default:
        // neutral - use default config
        break;
    }
  }

  /**
   * Stop speaking
   */
  stop(): void {
    if (this.isSpeaking) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.queue = [];
      this.notifyListeners('stop');
    }
  }

  /**
   * Pause speaking
   */
  pause(): void {
    if (this.isSpeaking) {
      this.synth.pause();
    }
  }

  /**
   * Resume speaking
   */
  resume(): void {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): TTSConfig {
    return { ...this.config };
  }

  /**
   * Subscribe to events
   */
  subscribe(listener: (event: string, data?: any) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify listeners
   */
  private notifyListeners(event: string, data?: any): void {
    this.listeners.forEach(listener => listener(event, data));
  }

  /**
   * Get speaking status
   */
  getStatus(): {
    isSpeaking: boolean;
    isPaused: boolean;
    queueLength: number;
    currentText?: string;
  } {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.synth.paused,
      queueLength: this.queue.length,
      currentText: this.currentUtterance?.text
    };
  }

  /**
   * Clear queue
   */
  clearQueue(): void {
    this.queue = [];
  }

  /**
   * Speak command result
   */
  async speakCommandResult(success: boolean, message: string): Promise<void> {
    const emotion = success ? 'success' : 'error';
    const prefix = success ? 'Done!' : 'Sorry,';
    
    await this.speak({
      text: `${prefix} ${message}`,
      emotion,
      priority: 'high',
      interrupt: false
    });
  }

  /**
   * Speak confirmation
   */
  async speakConfirmation(action: string): Promise<void> {
    await this.speak({
      text: `${action}. Is that correct?`,
      emotion: 'info',
      priority: 'high',
      interrupt: false
    });
  }

  /**
   * Speak suggestion
   */
  async speakSuggestion(suggestion: string): Promise<void> {
    await this.speak({
      text: `You could try: ${suggestion}`,
      emotion: 'info',
      priority: 'normal',
      interrupt: false
    });
  }

  /**
   * Speak error with help
   */
  async speakErrorWithHelp(error: string, help: string): Promise<void> {
    await this.speak({
      text: `${error}. ${help}`,
      emotion: 'error',
      priority: 'high',
      interrupt: true
    });
  }

  /**
   * Test TTS with sample text
   */
  async test(): Promise<void> {
    await this.speak({
      text: 'Voice assistant is ready. How can I help you?',
      emotion: 'neutral',
      priority: 'normal'
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    this.listeners = [];
  }
}

// Singleton instance
let globalTTSInstance: VoiceTTSService | null = null;

export const getVoiceTTS = (config?: Partial<TTSConfig>): VoiceTTSService => {
  if (!globalTTSInstance) {
    globalTTSInstance = new VoiceTTSService(config);
  } else if (config) {
    globalTTSInstance.updateConfig(config);
  }
  return globalTTSInstance;
};

export const resetVoiceTTS = (): void => {
  if (globalTTSInstance) {
    globalTTSInstance.destroy();
    globalTTSInstance = null;
  }
};

/**
 * Predefined response templates
 */
export const TTSResponses = {
  // Success responses
  prioritySet: (priority: string) => `Priority set to ${priority}`,
  statusChanged: (status: string) => `Status changed to ${status}`,
  assigned: (name: string) => `Assigned to ${name}`,
  labelAdded: (label: string) => `Label ${label} added`,
  
  // Confirmation requests
  confirmPriority: (priority: string) => `Set priority to ${priority}. Is that correct?`,
  confirmAssign: (name: string) => `Assign to ${name}. Should I proceed?`,
  
  // Errors
  issueNotFound: () => `Sorry, I couldn't find that issue`,
  userNotFound: (name: string) => `Sorry, I couldn't find user ${name}`,
  lowConfidence: () => `I'm not sure I understood that. Could you rephrase?`,
  
  // Help
  help: () => `You can say things like: set priority to high, assign to John, or move to in progress`,
  
  // Greetings
  ready: () => `Voice assistant is ready. How can I help you?`,
  listening: () => `I'm listening`,
  
  // Suggestions
  suggestion: (text: string) => `You could try: ${text}`,
  
  // Multi-step
  whatNext: () => `What would you like to do next?`,
  anythingElse: () => `Anything else I can help with?`
};
