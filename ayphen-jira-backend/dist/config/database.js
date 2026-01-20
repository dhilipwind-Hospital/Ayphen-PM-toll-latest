"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
exports.connectWithRetry = connectWithRetry;
const typeorm_1 = require("typeorm");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
// Log database URL (masked for security)
const dbUrl = process.env.DATABASE_URL || '';
const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
console.log('🔗 Database URL configured:', maskedUrl);
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Supabase
    },
    synchronize: true, // Auto-create tables (disable in production)
    logging: false,
    entities: [__dirname + '/../entities/**/*.{ts,js}'],
    migrations: [__dirname + '/../migrations/**/*.{ts,js}'],
    subscribers: [],
    // Connection pool settings for Supabase transaction pooler
    extra: {
        max: 10, // Maximum connections in pool
        idleTimeoutMillis: 30000, // Close idle connections after 30s
        connectionTimeoutMillis: 10000, // Connection timeout 10s
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
    },
    // Retry settings
    connectTimeoutMS: 10000,
});
// Helper function to connect with retries
async function connectWithRetry(maxRetries = 3, delayMs = 2000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 Database connection attempt ${attempt}/${maxRetries}...`);
            await exports.AppDataSource.initialize();
            console.log('✅ Database connected successfully');
            return;
        }
        catch (error) {
            console.error(`❌ Connection attempt ${attempt} failed:`, error.message);
            if (attempt === maxRetries) {
                console.error('❌ All database connection attempts failed');
                throw error;
            }
            console.log(`⏳ Retrying in ${delayMs / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            delayMs *= 1.5; // Exponential backoff
        }
    }
}
