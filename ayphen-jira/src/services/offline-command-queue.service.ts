/**
 * Offline Command Queue Service
 * Queues voice commands when offline and syncs when back online
 */
import { ENV } from '../config/env';

export interface QueuedCommand {
  id: string;
  command: string;
  context: {
    issueId?: string;
    projectId?: string;
    userId?: string;
  };
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  error?: string;
}

export class OfflineCommandQueueService {
  private static instance: OfflineCommandQueueService;
  private queue: QueuedCommand[] = [];
  private readonly STORAGE_KEY = 'voice_command_queue';
  private readonly MAX_RETRIES = 3;
  private syncInterval: number | null = null;
  private listeners: Array<(queue: QueuedCommand[]) => void> = [];

  private constructor() {
    this.loadQueue();
    this.setupOnlineListener();
    this.startAutoSync();
  }

  public static getInstance(): OfflineCommandQueueService {
    if (!OfflineCommandQueueService.instance) {
      OfflineCommandQueueService.instance = new OfflineCommandQueueService();
    }
    return OfflineCommandQueueService.instance;
  }

  /**
   * Add a command to the queue
   */
  public async addCommand(
    command: string,
    context: QueuedCommand['context'],
    executeImmediately: boolean = true
  ): Promise<{ queued: boolean; result?: any; error?: string }> {
    const queuedCommand: QueuedCommand = {
      id: this.generateId(),
      command,
      context,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    };

    // If online and should execute immediately, try to execute
    if (navigator.onLine && executeImmediately) {
      try {
        const result = await this.executeCommand(queuedCommand);
        return { queued: false, result };
      } catch (error: any) {
        // If execution fails, add to queue
        this.queue.push(queuedCommand);
        this.saveQueue();
        this.notifyListeners();
        return { queued: true, error: error.message };
      }
    }

    // Add to queue if offline or immediate execution not requested
    this.queue.push(queuedCommand);
    this.saveQueue();
    this.notifyListeners();
    return { queued: true };
  }

  /**
   * Execute a queued command
   */
  private async executeCommand(queuedCommand: QueuedCommand): Promise<any> {
    queuedCommand.status = 'processing';
    this.notifyListeners();

    try {
      const response = await fetch(`${ENV.API_URL}/voice-assistant/process-enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command: queuedCommand.command,
          context: queuedCommand.context
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      queuedCommand.status = 'completed';
      this.removeFromQueue(queuedCommand.id);
      return result;
    } catch (error: any) {
      queuedCommand.retryCount++;
      
      if (queuedCommand.retryCount >= this.MAX_RETRIES) {
        queuedCommand.status = 'failed';
        queuedCommand.error = error.message;
      } else {
        queuedCommand.status = 'pending';
      }
      
      this.saveQueue();
      this.notifyListeners();
      throw error;
    }
  }

  /**
   * Sync all pending commands
   */
  public async syncQueue(): Promise<{
    successful: number;
    failed: number;
    pending: number;
  }> {
    if (!navigator.onLine) {
      return { successful: 0, failed: 0, pending: this.queue.length };
    }

    const pendingCommands = this.queue.filter(
      cmd => cmd.status === 'pending' && cmd.retryCount < this.MAX_RETRIES
    );

    let successful = 0;
    let failed = 0;

    for (const command of pendingCommands) {
      try {
        await this.executeCommand(command);
        successful++;
      } catch (error) {
        failed++;
      }
    }

    const pending = this.queue.filter(cmd => cmd.status === 'pending').length;

    return { successful, failed, pending };
  }

  /**
   * Get all queued commands
   */
  public getQueue(): QueuedCommand[] {
    return [...this.queue];
  }

  /**
   * Get queue statistics
   */
  public getStats(): {
    total: number;
    pending: number;
    processing: number;
    failed: number;
    completed: number;
  } {
    return {
      total: this.queue.length,
      pending: this.queue.filter(cmd => cmd.status === 'pending').length,
      processing: this.queue.filter(cmd => cmd.status === 'processing').length,
      failed: this.queue.filter(cmd => cmd.status === 'failed').length,
      completed: this.queue.filter(cmd => cmd.status === 'completed').length
    };
  }

  /**
   * Remove a command from the queue
   */
  public removeFromQueue(commandId: string): void {
    this.queue = this.queue.filter(cmd => cmd.id !== commandId);
    this.saveQueue();
    this.notifyListeners();
  }

  /**
   * Clear completed commands
   */
  public clearCompleted(): void {
    this.queue = this.queue.filter(cmd => cmd.status !== 'completed');
    this.saveQueue();
    this.notifyListeners();
  }

  /**
   * Clear all commands
   */
  public clearAll(): void {
    this.queue = [];
    this.saveQueue();
    this.notifyListeners();
  }

  /**
   * Retry a failed command
   */
  public async retryCommand(commandId: string): Promise<any> {
    const command = this.queue.find(cmd => cmd.id === commandId);
    if (!command) {
      throw new Error('Command not found');
    }

    command.retryCount = 0;
    command.status = 'pending';
    command.error = undefined;
    
    return await this.executeCommand(command);
  }

  /**
   * Subscribe to queue changes
   */
  public subscribe(listener: (queue: QueuedCommand[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of queue changes
   */
  private notifyListeners(): void {
    const queue = this.getQueue();
    this.listeners.forEach(listener => listener(queue));
  }

  /**
   * Save queue to localStorage
   */
  private saveQueue(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save queue to localStorage:', error);
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load queue from localStorage:', error);
      this.queue = [];
    }
  }

  /**
   * Setup online/offline event listener
   */
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      this.syncQueue();
    });

    window.addEventListener('offline', () => {
    });
  }

  /**
   * Start auto-sync interval
   */
  private startAutoSync(): void {
    // Sync every 30 seconds if online
    this.syncInterval = window.setInterval(() => {
      if (navigator.onLine && this.queue.length > 0) {
        this.syncQueue();
      }
    }, 30000);
  }

  /**
   * Stop auto-sync
   */
  public stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.stopAutoSync();
    this.listeners = [];
  }
}

// Export singleton instance
export const offlineCommandQueue = OfflineCommandQueueService.getInstance();
