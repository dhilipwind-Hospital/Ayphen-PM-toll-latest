-- Manual Test Cases Table
CREATE TABLE IF NOT EXISTS manual_test_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  steps TEXT,
  priority TEXT DEFAULT 'Medium',
  project_id INTEGER,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Test Suites Table
CREATE TABLE IF NOT EXISTS test_suites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  project_id INTEGER,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Suite Test Cases Junction Table
CREATE TABLE IF NOT EXISTS suite_test_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  suite_id INTEGER NOT NULL,
  test_case_id INTEGER NOT NULL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (suite_id) REFERENCES test_suites(id) ON DELETE CASCADE,
  FOREIGN KEY (test_case_id) REFERENCES manual_test_cases(id) ON DELETE CASCADE
);

-- Test Runs Table
CREATE TABLE IF NOT EXISTS test_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  suite_id INTEGER NOT NULL,
  status TEXT DEFAULT 'Running',
  started_by INTEGER NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (suite_id) REFERENCES test_suites(id) ON DELETE CASCADE,
  FOREIGN KEY (started_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Test Results Table
CREATE TABLE IF NOT EXISTS test_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER NOT NULL,
  test_case_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (run_id) REFERENCES test_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (test_case_id) REFERENCES manual_test_cases(id) ON DELETE CASCADE
);
