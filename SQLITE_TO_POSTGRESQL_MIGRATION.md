# SQLite to PostgreSQL Migration Guide

## 🎯 Goal
Migrate your Ayphen Jira application from SQLite to PostgreSQL for production deployment.

---

## 📋 Migration Steps Overview

1. ✅ Set up Supabase (Free PostgreSQL)
2. ✅ Export SQLite schema and data
3. ✅ Update backend code for PostgreSQL
4. ✅ Import data to PostgreSQL
5. ✅ Test and verify
6. ✅ Deploy

**Total Time: 30-45 minutes**

---

## Step 1: Set Up Supabase (5 minutes)

### **Create Account**
```bash
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (no credit card needed)
4. Create new organization (use your name)
5. Create new project:
   - Name: ayphen-jira
   - Database Password: (save this!)
   - Region: Choose closest to you
   - Pricing Plan: Free
6. Wait 2-3 minutes for setup
```

### **Get Connection Details**
```bash
1. Go to Project Settings > Database
2. Copy these values:

Connection String (URI):
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

Direct Connection:
Host: aws-0-[REGION].pooler.supabase.com
Port: 5432
Database: postgres
User: postgres.[PROJECT-REF]
Password: [YOUR-PASSWORD]
```

---

## Step 2: Install PostgreSQL Tools (5 minutes)

### **Install pg (PostgreSQL client)**
```bash
cd /Users/dhilipelango/VS\ Jira\ 2/ayphen-jira-backend

# Install PostgreSQL driver
npm install pg

# Install migration tools
npm install --save-dev sqlite3
```

---

## Step 3: Export SQLite Schema (10 minutes)

### **A. View Current Schema**
```bash
# Install sqlite3 CLI if not installed
brew install sqlite3

# Export schema
sqlite3 ayphen_jira.db .schema > schema.sql

# Export data
sqlite3 ayphen_jira.db .dump > dump.sql
```

### **B. Convert Schema to PostgreSQL**

I'll create a conversion script for you.

---

## Step 4: Update Backend Code (10 minutes)

### **A. Update package.json**
```json
{
  "dependencies": {
    "pg": "^8.11.3",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2"
  }
}
```

### **B. Create Database Connection File**

**File: `db/connection.js`**
```javascript
const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
```

### **C. Update .env**
```env
# OLD (SQLite)
# DATABASE_URL=./ayphen_jira.db

# NEW (PostgreSQL - Supabase)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# For local development (optional)
# DATABASE_URL=postgresql://localhost:5432/ayphen_jira
```

---

## Step 5: Create Migration Scripts

### **A. Schema Migration Script**

**File: `scripts/migrate-schema.js`**
```javascript
const pool = require('../db/connection');

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'member',
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        key VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        lead_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Issues table
    await client.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,
        key VARCHAR(50) UNIQUE NOT NULL,
        summary TEXT NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'To Do',
        priority VARCHAR(50) DEFAULT 'Medium',
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        assignee_id INTEGER REFERENCES users(id),
        reporter_id INTEGER REFERENCES users(id),
        parent_id INTEGER REFERENCES issues(id),
        epic_id INTEGER REFERENCES issues(id),
        story_points INTEGER,
        sprint_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Comments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        issue_id INTEGER REFERENCES issues(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Attachments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attachments (
        id SERIAL PRIMARY KEY,
        issue_id INTEGER REFERENCES issues(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        size INTEGER,
        uploaded_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // History table
    await client.query(`
      CREATE TABLE IF NOT EXISTS history (
        id SERIAL PRIMARY KEY,
        issue_id INTEGER REFERENCES issues(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        field VARCHAR(100) NOT NULL,
        old_value TEXT,
        new_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Sprints table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sprints (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        start_date DATE,
        end_date DATE,
        status VARCHAR(50) DEFAULT 'planned',
        goal TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Test cases table
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_cases (
        id SERIAL PRIMARY KEY,
        issue_id INTEGER REFERENCES issues(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        steps TEXT,
        expected_result TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_issues_project ON issues(project_id);
      CREATE INDEX IF NOT EXISTS idx_issues_assignee ON issues(assignee_id);
      CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
      CREATE INDEX IF NOT EXISTS idx_comments_issue ON comments(issue_id);
      CREATE INDEX IF NOT EXISTS idx_history_issue ON history(issue_id);
    `);
    
    await client.query('COMMIT');
    console.log('✅ All tables created successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migration
createTables()
  .then(() => {
    console.log('✅ Schema migration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
```

### **B. Data Migration Script**

**File: `scripts/migrate-data.js`**
```javascript
const sqlite3 = require('sqlite3').verbose();
const pool = require('../db/connection');

const migrateData = async () => {
  const sqliteDb = new sqlite3.Database('./ayphen_jira.db');
  const pgClient = await pool.connect();
  
  try {
    console.log('🔄 Starting data migration...');
    
    // Migrate Users
    await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM users', async (err, rows) => {
        if (err) reject(err);
        
        for (const row of rows) {
          await pgClient.query(
            `INSERT INTO users (id, email, password, name, role, avatar_url, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO NOTHING`,
            [row.id, row.email, row.password, row.name, row.role, row.avatar_url, row.created_at]
          );
        }
        console.log(`✅ Migrated ${rows.length} users`);
        resolve();
      });
    });
    
    // Migrate Projects
    await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM projects', async (err, rows) => {
        if (err) reject(err);
        
        for (const row of rows) {
          await pgClient.query(
            `INSERT INTO projects (id, name, key, description, lead_id, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`,
            [row.id, row.name, row.key, row.description, row.lead_id, row.created_at]
          );
        }
        console.log(`✅ Migrated ${rows.length} projects`);
        resolve();
      });
    });
    
    // Migrate Issues
    await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM issues', async (err, rows) => {
        if (err) reject(err);
        
        for (const row of rows) {
          await pgClient.query(
            `INSERT INTO issues (id, key, summary, description, type, status, priority, 
                                project_id, assignee_id, reporter_id, parent_id, epic_id, 
                                story_points, sprint_id, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (id) DO NOTHING`,
            [row.id, row.key, row.summary, row.description, row.type, row.status, 
             row.priority, row.project_id, row.assignee_id, row.reporter_id, 
             row.parent_id, row.epic_id, row.story_points, row.sprint_id, row.created_at]
          );
        }
        console.log(`✅ Migrated ${rows.length} issues`);
        resolve();
      });
    });
    
    // Migrate Comments
    await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM comments', async (err, rows) => {
        if (err) reject(err);
        
        for (const row of rows) {
          await pgClient.query(
            `INSERT INTO comments (id, issue_id, user_id, content, created_at)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO NOTHING`,
            [row.id, row.issue_id, row.user_id, row.content, row.created_at]
          );
        }
        console.log(`✅ Migrated ${rows.length} comments`);
        resolve();
      });
    });
    
    // Update sequences to match max IDs
    await pgClient.query(`
      SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
      SELECT setval('projects_id_seq', (SELECT MAX(id) FROM projects));
      SELECT setval('issues_id_seq', (SELECT MAX(id) FROM issues));
      SELECT setval('comments_id_seq', (SELECT MAX(id) FROM comments));
    `);
    
    console.log('✅ Data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    sqliteDb.close();
    pgClient.release();
  }
};

// Run migration
migrateData()
  .then(() => {
    console.log('✅ All data migrated!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
```

---

## Step 6: Update API Routes

### **Example: Update a route to use PostgreSQL**

**Before (SQLite):**
```javascript
app.get('/api/issues', (req, res) => {
  db.all('SELECT * FROM issues', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
```

**After (PostgreSQL):**
```javascript
const pool = require('./db/connection');

app.get('/api/issues', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM issues');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Step 7: Run Migration (5 minutes)

### **Execute Migration**
```bash
cd /Users/dhilipelango/VS\ Jira\ 2/ayphen-jira-backend

# 1. Install dependencies
npm install

# 2. Update .env with Supabase connection string
# DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@...

# 3. Run schema migration
node scripts/migrate-schema.js

# 4. Run data migration
node scripts/migrate-data.js

# 5. Test connection
node -e "require('./db/connection').query('SELECT NOW()').then(r => console.log('✅ Connected:', r.rows[0]))"
```

---

## Step 8: Verify Migration

### **Check Data in Supabase**
```bash
1. Go to Supabase Dashboard
2. Click "Table Editor"
3. Verify tables exist:
   - users
   - projects
   - issues
   - comments
   - attachments
   - history
   - sprints
   - test_cases

4. Check row counts match SQLite
```

### **Test API Endpoints**
```bash
# Start backend
npm start

# Test in browser or curl
curl http://localhost:8500/api/projects
curl http://localhost:8500/api/issues
```

---

## Step 9: Update for Production

### **Production .env**
```env
# Supabase PostgreSQL (Production)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Server
PORT=10000
NODE_ENV=production

# CORS (update with your Vercel URL)
CORS_ORIGIN=https://your-app.vercel.app

# AI Services
CEREBRAS_API_KEY=csk-tyt2cxmxjedhfkjnce5kw3txxr9vh4j4kfc52vhkj4ehpfv5

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=dhilipwind@gmail.com
SMTP_PASSWORD=qdvgzvyylflccqvw
SMTP_FROM_EMAIL=dhilipwind@gmail.com
```

---

## 🎯 Quick Migration Checklist

- [ ] Create Supabase account
- [ ] Get PostgreSQL connection string
- [ ] Install pg package
- [ ] Create db/connection.js
- [ ] Create migration scripts
- [ ] Update .env with DATABASE_URL
- [ ] Run schema migration
- [ ] Run data migration
- [ ] Update all API routes to use pool.query
- [ ] Test locally
- [ ] Deploy to Render/Vercel
- [ ] Verify production data

---

## 🔧 Troubleshooting

### **Connection Error**
```bash
# Check connection string format
# Should be: postgresql://user:password@host:port/database

# Test connection
psql "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
```

### **SSL Error**
```javascript
// Add to connection.js
ssl: {
  rejectUnauthorized: false
}
```

### **Migration Fails**
```bash
# Drop all tables and retry
# In Supabase SQL Editor:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# Then run migration again
node scripts/migrate-schema.js
```

---

## 📚 Next Steps

After successful migration:

1. ✅ Test all features locally
2. ✅ Commit changes to Git
3. ✅ Deploy backend to Render
4. ✅ Deploy frontend to Vercel
5. ✅ Update frontend VITE_API_URL
6. ✅ Test production deployment

---

**Ready to start?** Let me know and I'll help you through each step!
