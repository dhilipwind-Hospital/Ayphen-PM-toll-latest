"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
class RedisService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.connect();
    }
    connect() {
        try {
            // Try to connect to Redis, but don't fail if unavailable
            this.client = new ioredis_1.default({
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD,
                retryStrategy: (times) => {
                    if (times > 3) {
                        console.log('⚠️  Redis unavailable, using in-memory sessions as fallback');
                        return null; // Stop retrying
                    }
                    return Math.min(times * 100, 3000);
                },
            });
            this.client.on('connect', () => {
                this.isConnected = true;
                console.log('✅ Redis connected successfully');
            });
            this.client.on('error', (err) => {
                this.isConnected = false;
                console.log('⚠️  Redis error (using in-memory fallback):', err.message);
            });
        }
        catch (error) {
            console.log('⚠️  Redis not available, using in-memory sessions');
            this.client = null;
        }
    }
    async setSession(sessionId, data, ttl = 86400) {
        if (!this.client || !this.isConnected)
            return false;
        try {
            await this.client.setex(`session:${sessionId}`, ttl, JSON.stringify(data));
            return true;
        }
        catch (error) {
            console.error('Redis setSession error:', error);
            return false;
        }
    }
    async getSession(sessionId) {
        if (!this.client || !this.isConnected)
            return null;
        try {
            const data = await this.client.get(`session:${sessionId}`);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            console.error('Redis getSession error:', error);
            return null;
        }
    }
    async deleteSession(sessionId) {
        if (!this.client || !this.isConnected)
            return false;
        try {
            await this.client.del(`session:${sessionId}`);
            return true;
        }
        catch (error) {
            console.error('Redis deleteSession error:', error);
            return false;
        }
    }
    async setPasswordResetToken(email, token, ttl = 3600) {
        if (!this.client || !this.isConnected)
            return false;
        try {
            await this.client.setex(`reset:${email}`, ttl, token);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async getPasswordResetToken(email) {
        if (!this.client || !this.isConnected)
            return null;
        try {
            return await this.client.get(`reset:${email}`);
        }
        catch (error) {
            return null;
        }
    }
    async deletePasswordResetToken(email) {
        if (!this.client || !this.isConnected)
            return false;
        try {
            await this.client.del(`reset:${email}`);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    isAvailable() {
        return this.isConnected && this.client !== null;
    }
}
exports.redisService = new RedisService();
