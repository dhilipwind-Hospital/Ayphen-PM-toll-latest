require('dotenv').config();
const pool = require('../db/connection');

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting schema migration...\n');
    await client.query('BEGIN');
    
    // Users table
    console.log('Creating users table...');
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
    console.log('Creating projects table...');
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
    console.log('Creating issues table...');
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
    console.log('Creating comments table...');
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
    console.log('Creating attachments table...');
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
    console.log('Creating history table...');
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
    console.log('Creating sprints table...');
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
    console.log('Creating test_cases table...');
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
    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_issues_project ON issues(project_id);
      CREATE INDEX IF NOT EXISTS idx_issues_assignee ON issues(assignee_id);
      CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
      CREATE INDEX IF NOT EXISTS idx_issues_type ON issues(type);
      CREATE INDEX IF NOT EXISTS idx_comments_issue ON comments(issue_id);
      CREATE INDEX IF NOT EXISTS idx_history_issue ON history(issue_id);
      CREATE INDEX IF NOT EXISTS idx_attachments_issue ON attachments(issue_id);
    `);
    
    await client.query('COMMIT');
    console.log('\n✅ All tables created successfully!');
    console.log('\n📊 Tables created:');
    console.log('  - users');
    console.log('  - projects');
    console.log('  - issues');
    console.log('  - comments');
    console.log('  - attachments');
    console.log('  - history');
    console.log('  - sprints');
    console.log('  - test_cases');
    console.log('\n✅ Indexes created for optimal performance');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error creating tables:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

// Run migration
createTables()
  .then(() => {
    console.log('\n✅ Schema migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
