import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

// Log database URL (masked for security)
const dbUrl = process.env.DATABASE_URL || '';
const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
console.log('🔗 Database URL configured:', maskedUrl);

export const AppDataSource = new DataSource({
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
export async function connectWithRetry(maxRetries = 3, delayMs = 2000): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Database connection attempt ${attempt}/${maxRetries}...`);
      await AppDataSource.initialize();
      console.log('✅ Database connected successfully');
      return;
    } catch (error: any) {
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
