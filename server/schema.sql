PRAGMA foreign_keys = ON;

-- USERS (Auth)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('CEO','HR','MANAGER','EMPLOYEE')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- EMPLOYEES
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  employee_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  job_title TEXT NOT NULL,
  manager_id TEXT,
  user_id TEXT UNIQUE,
  FOREIGN KEY(manager_id) REFERENCES employees(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- KPI
CREATE TABLE kpis (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('CORE','JOB','STRATEGIC')),
  scale_min INTEGER NOT NULL DEFAULT 0,
  scale_max INTEGER NOT NULL DEFAULT 100,
  is_active INTEGER NOT NULL DEFAULT 1
);

-- KPI TEMPLATE (per unit/job)
CREATE TABLE kpi_templates (
  id TEXT PRIMARY KEY,
  applies_to_unit TEXT,
  applies_to_job_title TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE kpi_template_items (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  kpi_id TEXT NOT NULL,
  weight REAL NOT NULL CHECK(weight > 0),
  FOREIGN KEY(template_id) REFERENCES kpi_templates(id),
  FOREIGN KEY(kpi_id) REFERENCES kpis(id),
  UNIQUE(template_id, kpi_id)
);

-- PERIODS
CREATE TABLE evaluation_periods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK(period_type IN ('MONTHLY','QUARTERLY','YEARLY')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('OPEN','CLOSED')) DEFAULT 'OPEN'
);

-- EVALUATIONS
CREATE TABLE evaluations (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  period_id TEXT NOT NULL,
  evaluator_user_id TEXT NOT NULL,
  template_id TEXT,
  final_score REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(employee_id) REFERENCES employees(id),
  FOREIGN KEY(period_id) REFERENCES evaluation_periods(id),
  FOREIGN KEY(evaluator_user_id) REFERENCES users(id),
  FOREIGN KEY(template_id) REFERENCES kpi_templates(id),
  UNIQUE(employee_id, period_id) -- DR-01
);

CREATE TABLE evaluation_scores (
  id TEXT PRIMARY KEY,
  evaluation_id TEXT NOT NULL,
  kpi_id TEXT NOT NULL,
  score REAL NOT NULL,
  weight REAL NOT NULL,
  comment TEXT,
  FOREIGN KEY(evaluation_id) REFERENCES evaluations(id),
  FOREIGN KEY(kpi_id) REFERENCES kpis(id),
  UNIQUE(evaluation_id, kpi_id)
);

-- OBJECTIONS (feedback)
CREATE TABLE objections (
  id TEXT PRIMARY KEY,
  evaluation_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('OPEN','REVIEWED','RESOLVED')) DEFAULT 'OPEN',
  response_message TEXT,
  resolver_user_id TEXT,
  reviewed_at TEXT,
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(evaluation_id) REFERENCES evaluations(id),
  FOREIGN KEY(employee_id) REFERENCES employees(id),
  FOREIGN KEY(resolver_user_id) REFERENCES users(id)
);

-- AUDIT LOG (امتیازی)
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  meta_json TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
