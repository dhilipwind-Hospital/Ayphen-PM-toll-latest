/**
 * Voice Conversation Context Service
 * Phase 3-4: AI Intelligence
 * 
 * Manages conversation history and context for voice commands
 * Enables commands like "also set it to high priority" or "assign that to john"
 */

export interface CommandHistoryEntry {
  id: string;
  userId: string;
  timestamp: number;
  transcript: string;
  intent: string;
  entities: Record<string, any>;
  issueId?: string;
  projectId?: string;
  success: boolean;
}

export interface ConversationContext {
  userId: string;
  currentIssue?: {
    id: string;
    key: string;
    summary: string;
    projectId: string;
  };
  lastAction?: CommandHistoryEntry;
  recentCommands: CommandHistoryEntry[];
  sessionStart: number;
  preferences: Record<string, any>;
}

export class VoiceConversationContextService {
  private contexts: Map<string, ConversationContext> = new Map();
  private readonly MAX_HISTORY = 10;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  /**
   * Get or create conversation context for user
   */
  getContext(userId: string): ConversationContext {
    let context = this.contexts.get(userId);

    if (!context || this.isSessionExpired(context)) {
      context = this.createNewContext(userId);
      this.contexts.set(userId, context);
    }

    return context;
  }

  /**
   * Create new conversation context
   */
  private createNewContext(userId: string): ConversationContext {
    return {
      userId,
      recentCommands: [],
      sessionStart: Date.now(),
      preferences: {}
    };
  }

  /**
   * Check if session has expired
   */
  private isSessionExpired(context: ConversationContext): boolean {
    return Date.now() - context.sessionStart > this.SESSION_TIMEOUT;
  }

  /**
   * Add command to history
   */
  addCommand(
    userId: string,
    transcript: string,
    intent: string,
    entities: Record<string, any>,
    success: boolean,
    issueId?: string,
    projectId?: string
  ): void {
    const context = this.getContext(userId);

    const entry: CommandHistoryEntry = {
      id: this.generateId(),
      userId,
      timestamp: Date.now(),
      transcript,
      intent,
      entities,
      issueId,
      projectId,
      success
    };

    context.recentCommands.unshift(entry);
    context.lastAction = entry;

    // Keep only recent commands
    if (context.recentCommands.length > this.MAX_HISTORY) {
      context.recentCommands = context.recentCommands.slice(0, this.MAX_HISTORY);
    }
  }

  /**
   * Set current issue context
   */
  setCurrentIssue(userId: string, issue: {
    id: string;
    key: string;
    summary: string;
    projectId: string;
  }): void {
    const context = this.getContext(userId);
    context.currentIssue = issue;
  }

  /**
   * Resolve pronouns and references in command
   */
  resolveReferences(userId: string, transcript: string): string {
    const context = this.getContext(userId);
    let resolved = transcript.toLowerCase();

    // Resolve "it", "this", "that" to current issue
    if (context.currentIssue) {
      const issueRef = context.currentIssue.key;
      resolved = resolved.replace(/\bit\b/gi, issueRef);
      resolved = resolved.replace(/\bthis\b/gi, issueRef);
      resolved = resolved.replace(/\bthat\b/gi, issueRef);
      resolved = resolved.replace(/\bthe issue\b/gi, issueRef);
    }

    // Resolve "also" to include previous action
    if (resolved.includes('also') && context.lastAction) {
      // "also set priority to high" → "set priority to high for PROJ-123"
      if (context.lastAction.issueId) {
        resolved = resolved.replace(/\balso\b/gi, '');
        resolved = `${resolved} for ${context.lastAction.issueId}`;
      }
    }

    // Resolve "same" to repeat last value
    if (resolved.includes('same') && context.lastAction) {
      // "assign to same person" → use last assignee
      if (context.lastAction.entities.assignee) {
        resolved = resolved.replace(/same\s+person/gi, context.lastAction.entities.assignee);
      }
      if (context.lastAction.entities.priority) {
        resolved = resolved.replace(/same\s+priority/gi, context.lastAction.entities.priority);
      }
    }

    // Resolve "another" to create similar
    if (resolved.includes('another') && context.currentIssue) {
      // "create another one" → "create issue like PROJ-123"
      resolved = resolved.replace(/another\s+one/gi, `issue like ${context.currentIssue.key}`);
    }

    return resolved.trim();
  }

  /**
   * Get context summary for AI
   */
  getContextSummary(userId: string): string {
    const context = this.getContext(userId);
    const summary: string[] = [];

    if (context.currentIssue) {
      summary.push(`Current Issue: ${context.currentIssue.key} - ${context.currentIssue.summary}`);
    }

    if (context.lastAction) {
      summary.push(`Last Command: "${context.lastAction.transcript}" (${context.lastAction.intent})`);
    }

    if (context.recentCommands.length > 0) {
      const recentIntents = context.recentCommands
        .slice(0, 3)
        .map(cmd => cmd.intent)
        .join(', ');
      summary.push(`Recent Actions: ${recentIntents}`);
    }

    return summary.join('\n');
  }

  /**
   * Detect command chaining
   * Example: "set priority to high and assign to john"
   */
  detectChaining(transcript: string): string[] {
    const chainWords = [' and ', ' then ', ' also ', ', '];
    
    for (const word of chainWords) {
      if (transcript.toLowerCase().includes(word)) {
        return transcript.split(new RegExp(word, 'i')).map(cmd => cmd.trim());
      }
    }

    return [transcript];
  }

  /**
   * Get command suggestions based on context
   */
  getSuggestions(userId: string): string[] {
    const context = this.getContext(userId);
    const suggestions: string[] = [];

    // Suggest based on current issue
    if (context.currentIssue) {
      suggestions.push(`Set priority for ${context.currentIssue.key}`);
      suggestions.push(`Change status of ${context.currentIssue.key}`);
      suggestions.push(`Assign ${context.currentIssue.key} to someone`);
    }

    // Suggest based on recent patterns
    const recentIntents = context.recentCommands.map(cmd => cmd.intent);
    
    if (recentIntents.includes('update_priority')) {
      suggestions.push('Change status to in progress');
    }
    if (recentIntents.includes('create_issue')) {
      suggestions.push('Create another similar issue');
    }

    // Suggest common actions
    if (suggestions.length < 3) {
      suggestions.push('Show me my issues');
      suggestions.push('Go to the board');
      suggestions.push('Create a new bug');
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Get user preferences
   */
  getPreferences(userId: string): Record<string, any> {
    const context = this.getContext(userId);
    return context.preferences;
  }

  /**
   * Update user preferences
   */
  updatePreferences(userId: string, preferences: Record<string, any>): void {
    const context = this.getContext(userId);
    context.preferences = { ...context.preferences, ...preferences };
  }

  /**
   * Learn from user corrections
   */
  learnFromCorrection(
    userId: string,
    originalTranscript: string,
    correctedTranscript: string,
    correctIntent: string
  ): void {
    const context = this.getContext(userId);
    
    // Store user-specific patterns
    if (!context.preferences.corrections) {
      context.preferences.corrections = [];
    }

    context.preferences.corrections.push({
      original: originalTranscript,
      corrected: correctedTranscript,
      intent: correctIntent,
      timestamp: Date.now()
    });

    // Keep only recent corrections
    if (context.preferences.corrections.length > 20) {
      context.preferences.corrections = context.preferences.corrections.slice(-20);
    }
  }

  /**
   * Get command history for user
   */
  getHistory(userId: string, limit: number = 10): CommandHistoryEntry[] {
    const context = this.getContext(userId);
    return context.recentCommands.slice(0, limit);
  }

  /**
   * Clear conversation context
   */
  clearContext(userId: string): void {
    this.contexts.delete(userId);
  }

  /**
   * Get active sessions count
   */
  getActiveSessionsCount(): number {
    return this.contexts.size;
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions(): number {
    let cleaned = 0;
    
    for (const [userId, context] of this.contexts.entries()) {
      if (this.isSessionExpired(context)) {
        this.contexts.delete(userId);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get statistics
   */
  getStats(userId: string): {
    totalCommands: number;
    successRate: number;
    topIntents: Array<{ intent: string; count: number }>;
    sessionDuration: number;
  } {
    const context = this.getContext(userId);
    const totalCommands = context.recentCommands.length;
    const successfulCommands = context.recentCommands.filter(cmd => cmd.success).length;
    const successRate = totalCommands > 0 ? successfulCommands / totalCommands : 0;

    // Count intents
    const intentCounts: Record<string, number> = {};
    context.recentCommands.forEach(cmd => {
      intentCounts[cmd.intent] = (intentCounts[cmd.intent] || 0) + 1;
    });

    const topIntents = Object.entries(intentCounts)
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const sessionDuration = Date.now() - context.sessionStart;

    return {
      totalCommands,
      successRate,
      topIntents,
      sessionDuration
    };
  }
}

// Export singleton instance
export const voiceConversationContext = new VoiceConversationContextService();

// Cleanup expired sessions every 10 minutes
setInterval(() => {
  const cleaned = voiceConversationContext.cleanupExpiredSessions();
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired voice conversation sessions`);
  }
}, 10 * 60 * 1000);
