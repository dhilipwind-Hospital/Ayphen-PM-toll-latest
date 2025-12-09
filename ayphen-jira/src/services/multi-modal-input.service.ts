/**
 * Multi-Modal Input Service
 * Phase 5-6: Advanced Features
 * 
 * Handles combined voice + touch + keyboard inputs
 * Example: "Set this to high" + clicking an issue
 */

export interface MultiModalInput {
  voice?: string;
  target?: HTMLElement;
  gesture?: 'click' | 'swipe' | 'long-press' | 'drag';
  keyboard?: string[];
  timestamp: number;
}

export interface ResolvedCommand {
  command: string;
  context: {
    issueId?: string;
    issueKey?: string;
    elementType?: string;
    elementData?: any;
  };
  mode: 'voice-only' | 'touch-only' | 'voice-touch' | 'voice-keyboard' | 'hybrid';
  confidence: number;
}

export class MultiModalInputService {
  private pendingVoiceCommand: string | null = null;
  private pendingVoiceTimestamp: number = 0;
  private readonly VOICE_TIMEOUT = 3000; // 3 seconds to combine with touch
  private listeners: Array<(command: ResolvedCommand) => void> = [];
  private activeElement: HTMLElement | null = null;

  /**
   * Handle voice input
   */
  handleVoiceInput(voiceCommand: string): void {
    this.pendingVoiceCommand = voiceCommand;
    this.pendingVoiceTimestamp = Date.now();

    // Check if voice command is complete on its own
    if (this.isCompleteCommand(voiceCommand)) {
      this.resolveCommand({
        voice: voiceCommand,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle touch/click input
   */
  handleTouchInput(target: HTMLElement, gesture: 'click' | 'swipe' | 'long-press' | 'drag' = 'click'): void {
    this.activeElement = target;

    // Check if there's a pending voice command
    if (this.pendingVoiceCommand && this.isVoiceCommandRecent()) {
      // Combine voice + touch
      this.resolveCommand({
        voice: this.pendingVoiceCommand,
        target,
        gesture,
        timestamp: Date.now()
      });
      
      this.clearPendingVoice();
    } else {
      // Touch-only command
      this.resolveCommand({
        target,
        gesture,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle keyboard input
   */
  handleKeyboardInput(keys: string[]): void {
    // Check if there's a pending voice command
    if (this.pendingVoiceCommand && this.isVoiceCommandRecent()) {
      // Combine voice + keyboard
      this.resolveCommand({
        voice: this.pendingVoiceCommand,
        keyboard: keys,
        timestamp: Date.now()
      });
      
      this.clearPendingVoice();
    }
  }

  /**
   * Resolve multi-modal command
   */
  private resolveCommand(input: MultiModalInput): void {
    const resolved = this.buildResolvedCommand(input);
    this.notifyListeners(resolved);
  }

  /**
   * Build resolved command from multi-modal input
   */
  private buildResolvedCommand(input: MultiModalInput): ResolvedCommand {
    const context: any = {};
    let command = '';
    let mode: ResolvedCommand['mode'] = 'voice-only';
    let confidence = 1.0;

    // Extract context from target element
    if (input.target) {
      const issueId = input.target.dataset.issueId;
      const issueKey = input.target.dataset.issueKey;
      const elementType = input.target.dataset.type || input.target.tagName.toLowerCase();

      context.issueId = issueId;
      context.issueKey = issueKey;
      context.elementType = elementType;
      context.elementData = this.extractElementData(input.target);
    }

    // Build command based on input combination
    if (input.voice && input.target) {
      // Voice + Touch
      command = this.combineVoiceAndTouch(input.voice, input.target);
      mode = 'voice-touch';
      confidence = 0.95;
    } else if (input.voice && input.keyboard) {
      // Voice + Keyboard
      command = this.combineVoiceAndKeyboard(input.voice, input.keyboard);
      mode = 'voice-keyboard';
      confidence = 0.9;
    } else if (input.voice) {
      // Voice only
      command = input.voice;
      mode = 'voice-only';
      confidence = 0.85;
    } else if (input.target) {
      // Touch only
      command = this.touchToCommand(input.target, input.gesture);
      mode = 'touch-only';
      confidence = 0.8;
    }

    return {
      command,
      context,
      mode,
      confidence
    };
  }

  /**
   * Combine voice command with touch target
   */
  private combineVoiceAndTouch(voice: string, target: HTMLElement): string {
    const issueKey = target.dataset.issueKey;
    const issueId = target.dataset.issueId;
    
    // Replace pronouns with actual issue reference
    let combined = voice.toLowerCase();
    
    if (issueKey) {
      combined = combined.replace(/\bthis\b/gi, issueKey);
      combined = combined.replace(/\bit\b/gi, issueKey);
      combined = combined.replace(/\bthat\b/gi, issueKey);
    } else if (issueId) {
      combined = combined.replace(/\bthis\b/gi, issueId);
      combined = combined.replace(/\bit\b/gi, issueId);
      combined = combined.replace(/\bthat\b/gi, issueId);
    }

    return combined;
  }

  /**
   * Combine voice command with keyboard input
   */
  private combineVoiceAndKeyboard(voice: string, keys: string[]): string {
    // Example: Voice "create issue" + Keyboard typing "Fix login bug"
    const keyboardText = keys.join('');
    return `${voice}: ${keyboardText}`;
  }

  /**
   * Convert touch gesture to command
   */
  private touchToCommand(target: HTMLElement, gesture?: string): string {
    const issueKey = target.dataset.issueKey;
    const elementType = target.dataset.type;

    switch (gesture) {
      case 'long-press':
        return `show details for ${issueKey}`;
      case 'swipe':
        return `move ${issueKey}`;
      case 'drag':
        return `reorder ${issueKey}`;
      default:
        // Click
        if (elementType === 'priority') {
          return `change priority for ${issueKey}`;
        } else if (elementType === 'status') {
          return `change status for ${issueKey}`;
        } else {
          return `select ${issueKey}`;
        }
    }
  }

  /**
   * Extract data from element
   */
  private extractElementData(element: HTMLElement): any {
    return {
      id: element.id,
      className: element.className,
      text: element.textContent?.trim(),
      ...element.dataset
    };
  }

  /**
   * Check if voice command is complete on its own
   */
  private isCompleteCommand(command: string): boolean {
    const cmd = command.toLowerCase();
    
    // Commands that don't need a target
    const completePatterns = [
      /^(show|go to|navigate|open)/,
      /^create (a |an )?/,
      /^find|search/,
      /^help/,
      /^what/
    ];

    return completePatterns.some(pattern => pattern.test(cmd));
  }

  /**
   * Check if pending voice command is still recent
   */
  private isVoiceCommandRecent(): boolean {
    return Date.now() - this.pendingVoiceTimestamp < this.VOICE_TIMEOUT;
  }

  /**
   * Clear pending voice command
   */
  private clearPendingVoice(): void {
    this.pendingVoiceCommand = null;
    this.pendingVoiceTimestamp = 0;
  }

  /**
   * Subscribe to resolved commands
   */
  subscribe(listener: (command: ResolvedCommand) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify listeners
   */
  private notifyListeners(command: ResolvedCommand): void {
    this.listeners.forEach(listener => listener(command));
  }

  /**
   * Get pending voice command
   */
  getPendingVoice(): string | null {
    if (this.isVoiceCommandRecent()) {
      return this.pendingVoiceCommand;
    }
    return null;
  }

  /**
   * Get active element
   */
  getActiveElement(): HTMLElement | null {
    return this.activeElement;
  }

  /**
   * Clear active element
   */
  clearActiveElement(): void {
    this.activeElement = null;
  }

  /**
   * Setup global listeners for multi-modal input
   */
  setupGlobalListeners(): void {
    // Click listener
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.dataset.issueId || target.dataset.issueKey) {
        this.handleTouchInput(target, 'click');
      }
    });

    // Long press listener
    let pressTimer: number | null = null;
    document.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      if (target.dataset.issueId || target.dataset.issueKey) {
        pressTimer = window.setTimeout(() => {
          this.handleTouchInput(target, 'long-press');
        }, 500);
      }
    });

    document.addEventListener('mouseup', () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    });

    // Keyboard listener
    const keyBuffer: string[] = [];
    let keyTimer: number | null = null;

    document.addEventListener('keydown', (e) => {
      if (this.pendingVoiceCommand) {
        keyBuffer.push(e.key);
        
        if (keyTimer) {
          clearTimeout(keyTimer);
        }
        
        keyTimer = window.setTimeout(() => {
          if (keyBuffer.length > 0) {
            this.handleKeyboardInput([...keyBuffer]);
            keyBuffer.length = 0;
          }
        }, 1000);
      }
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.clearPendingVoice();
    this.clearActiveElement();
    this.listeners = [];
  }
}

// Singleton instance
let globalMultiModalInstance: MultiModalInputService | null = null;

export const getMultiModalInput = (): MultiModalInputService => {
  if (!globalMultiModalInstance) {
    globalMultiModalInstance = new MultiModalInputService();
  }
  return globalMultiModalInstance;
};

export const resetMultiModalInput = (): void => {
  if (globalMultiModalInstance) {
    globalMultiModalInstance.destroy();
    globalMultiModalInstance = null;
  }
};

/**
 * React Hook for multi-modal input
 */
export const useMultiModalInput = (onCommand: (command: ResolvedCommand) => void) => {
  const service = getMultiModalInput();
  
  // Subscribe to commands
  const unsubscribe = service.subscribe(onCommand);
  
  // Setup global listeners
  service.setupGlobalListeners();
  
  return {
    handleVoice: (command: string) => service.handleVoiceInput(command),
    handleTouch: (target: HTMLElement, gesture?: 'click' | 'swipe' | 'long-press' | 'drag') => 
      service.handleTouchInput(target, gesture),
    handleKeyboard: (keys: string[]) => service.handleKeyboardInput(keys),
    getPendingVoice: () => service.getPendingVoice(),
    cleanup: () => {
      unsubscribe();
      service.destroy();
    }
  };
};
