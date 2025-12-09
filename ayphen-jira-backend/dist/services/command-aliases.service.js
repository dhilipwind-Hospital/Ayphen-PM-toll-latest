"use strict";
/**
 * Command Aliases Service
 * Phase 9-10: Analytics & Learning
 *
 * Allows users to create custom command shortcuts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ALIASES = exports.commandAliases = exports.CommandAliasesService = void 0;
class CommandAliasesService {
    constructor() {
        this.aliases = new Map();
        this.SUGGESTION_THRESHOLD = 5; // Suggest alias after 5 uses
    }
    /**
     * Create custom alias
     */
    createAlias(userId, shortcut, fullCommand, tags) {
        const alias = {
            id: this.generateId(),
            userId,
            shortcut: shortcut.toLowerCase().trim(),
            fullCommand: fullCommand.toLowerCase().trim(),
            usageCount: 0,
            createdAt: new Date(),
            tags
        };
        const userAliases = this.aliases.get(userId) || [];
        userAliases.push(alias);
        this.aliases.set(userId, userAliases);
        return alias;
    }
    /**
     * Get user's aliases
     */
    getUserAliases(userId) {
        return this.aliases.get(userId) || [];
    }
    /**
     * Resolve alias to full command
     */
    resolveAlias(userId, input) {
        const userAliases = this.getUserAliases(userId);
        const inputLower = input.toLowerCase().trim();
        // Find exact match
        const alias = userAliases.find(a => a.shortcut === inputLower);
        if (alias) {
            // Update usage stats
            alias.usageCount++;
            alias.lastUsedAt = new Date();
            return alias.fullCommand;
        }
        // Check if input starts with an alias
        const partialMatch = userAliases.find(a => inputLower.startsWith(a.shortcut + ' '));
        if (partialMatch) {
            // Replace alias with full command, keep the rest
            const remainder = inputLower.substring(partialMatch.shortcut.length).trim();
            partialMatch.usageCount++;
            partialMatch.lastUsedAt = new Date();
            return `${partialMatch.fullCommand} ${remainder}`;
        }
        return input;
    }
    /**
     * Update alias
     */
    updateAlias(userId, aliasId, updates) {
        const userAliases = this.getUserAliases(userId);
        const alias = userAliases.find(a => a.id === aliasId);
        if (!alias)
            return null;
        if (updates.shortcut)
            alias.shortcut = updates.shortcut.toLowerCase().trim();
        if (updates.fullCommand)
            alias.fullCommand = updates.fullCommand.toLowerCase().trim();
        if (updates.tags)
            alias.tags = updates.tags;
        return alias;
    }
    /**
     * Delete alias
     */
    deleteAlias(userId, aliasId) {
        const userAliases = this.getUserAliases(userId);
        const index = userAliases.findIndex(a => a.id === aliasId);
        if (index === -1)
            return false;
        userAliases.splice(index, 1);
        return true;
    }
    /**
     * Suggest aliases based on usage patterns
     */
    suggestAliases(userId, commandHistory) {
        const suggestions = [];
        const existingAliases = this.getUserAliases(userId);
        for (const { command, count } of commandHistory) {
            // Only suggest for frequently used commands
            if (count < this.SUGGESTION_THRESHOLD)
                continue;
            // Skip if alias already exists
            if (existingAliases.some(a => a.fullCommand === command))
                continue;
            // Generate shortcut suggestion
            const shortcut = this.generateShortcut(command);
            // Check if shortcut is already taken
            if (existingAliases.some(a => a.shortcut === shortcut))
                continue;
            suggestions.push({
                shortcut,
                fullCommand: command,
                reason: `Used ${count} times`,
                confidence: Math.min(count / 20, 1), // Max confidence at 20 uses
                basedOnUsage: count
            });
        }
        return suggestions.sort((a, b) => b.basedOnUsage - a.basedOnUsage).slice(0, 5);
    }
    /**
     * Generate shortcut from command
     */
    generateShortcut(command) {
        const words = command.toLowerCase().split(' ');
        // Strategy 1: First letters of each word
        if (words.length >= 2) {
            const firstLetters = words.map(w => w[0]).join('');
            if (firstLetters.length >= 2 && firstLetters.length <= 5) {
                return firstLetters;
            }
        }
        // Strategy 2: Key words only
        const keyWords = words.filter(w => !['to', 'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at'].includes(w));
        if (keyWords.length >= 2) {
            return keyWords.slice(0, 2).map(w => w[0]).join('');
        }
        // Strategy 3: First word + action
        if (words.length >= 2) {
            return words[0].substring(0, 2) + words[1].substring(0, 2);
        }
        // Strategy 4: First 4 letters
        return command.replace(/\s/g, '').substring(0, 4);
    }
    /**
     * Get popular aliases across all users
     */
    getPopularAliases(limit = 10) {
        const aliasMap = new Map();
        // Aggregate across all users
        for (const [userId, userAliases] of this.aliases) {
            for (const alias of userAliases) {
                const key = `${alias.shortcut}:${alias.fullCommand}`;
                if (!aliasMap.has(key)) {
                    aliasMap.set(key, {
                        shortcut: alias.shortcut,
                        fullCommand: alias.fullCommand,
                        users: new Set(),
                        totalUsage: 0
                    });
                }
                const entry = aliasMap.get(key);
                entry.users.add(userId);
                entry.totalUsage += alias.usageCount;
            }
        }
        return Array.from(aliasMap.values())
            .map(entry => ({
            shortcut: entry.shortcut,
            fullCommand: entry.fullCommand,
            userCount: entry.users.size,
            totalUsage: entry.totalUsage
        }))
            .sort((a, b) => b.userCount - a.userCount || b.totalUsage - a.totalUsage)
            .slice(0, limit);
    }
    /**
     * Import popular aliases for user
     */
    importPopularAliases(userId, count = 5) {
        const popular = this.getPopularAliases(count);
        const existingAliases = this.getUserAliases(userId);
        const imported = [];
        for (const { shortcut, fullCommand } of popular) {
            // Skip if user already has this alias
            if (existingAliases.some(a => a.shortcut === shortcut || a.fullCommand === fullCommand)) {
                continue;
            }
            const alias = this.createAlias(userId, shortcut, fullCommand, ['imported', 'popular']);
            imported.push(alias);
        }
        return imported;
    }
    /**
     * Get alias statistics
     */
    getAliasStats(userId) {
        const userAliases = this.getUserAliases(userId);
        return {
            totalAliases: userAliases.length,
            totalUsage: userAliases.reduce((sum, a) => sum + a.usageCount, 0),
            mostUsed: userAliases
                .filter(a => a.usageCount > 0)
                .sort((a, b) => b.usageCount - a.usageCount)
                .slice(0, 5),
            recentlyCreated: userAliases
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .slice(0, 5),
            neverUsed: userAliases.filter(a => a.usageCount === 0)
        };
    }
    /**
     * Export aliases
     */
    exportAliases(userId) {
        const aliases = this.getUserAliases(userId);
        return JSON.stringify(aliases, null, 2);
    }
    /**
     * Import aliases
     */
    importAliases(userId, aliasesJson) {
        try {
            const imported = JSON.parse(aliasesJson);
            let count = 0;
            for (const alias of imported) {
                this.createAlias(userId, alias.shortcut, alias.fullCommand, alias.tags);
                count++;
            }
            return count;
        }
        catch (error) {
            throw new Error('Invalid aliases JSON');
        }
    }
    /**
     * Search aliases
     */
    searchAliases(userId, query) {
        const userAliases = this.getUserAliases(userId);
        const queryLower = query.toLowerCase();
        return userAliases.filter(a => a.shortcut.includes(queryLower) ||
            a.fullCommand.includes(queryLower) ||
            a.tags?.some(t => t.includes(queryLower)));
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return `alias_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Clear all aliases for user
     */
    clearUserAliases(userId) {
        this.aliases.delete(userId);
    }
}
exports.CommandAliasesService = CommandAliasesService;
// Export singleton instance
exports.commandAliases = new CommandAliasesService();
/**
 * Default aliases that can be suggested to new users
 */
exports.DEFAULT_ALIASES = [
    { shortcut: 'qh', fullCommand: 'set priority to high', tags: ['priority', 'quick'] },
    { shortcut: 'qm', fullCommand: 'set priority to medium', tags: ['priority', 'quick'] },
    { shortcut: 'ql', fullCommand: 'set priority to low', tags: ['priority', 'quick'] },
    { shortcut: 'ip', fullCommand: 'move to in progress', tags: ['status', 'workflow'] },
    { shortcut: 'done', fullCommand: 'move to done', tags: ['status', 'workflow'] },
    { shortcut: 'me', fullCommand: 'assign to me', tags: ['assign', 'quick'] },
    { shortcut: 'myissues', fullCommand: 'show my issues', tags: ['search', 'quick'] },
    { shortcut: 'bug', fullCommand: 'create a bug', tags: ['create', 'quick'] },
    { shortcut: 'story', fullCommand: 'create a story', tags: ['create', 'quick'] },
    { shortcut: 'task', fullCommand: 'create a task', tags: ['create', 'quick'] }
];
