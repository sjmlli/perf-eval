import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { db } from "./db.js";
import { signToken, requireAuth, requireRole } from "./auth.js";

const app = express();
app.use(cors());
app.use(express.json());

// ---------- helpers ----------
function audit(userId, action, entityType, entityId, meta = {}) {
  db.prepare(
    `INSERT INTO audit_logs(id,user_id,action,entity_type,entity_id,meta_json)
     VALUES(?,?,?,?,?,?)`
  ).run(uuid(), userId, action, entityType, entityId, JSON.stringify(meta));
}

function weightedScore(items) {
  // items: [{score, weight}]
  const sumW = items.reduce((a, x) => a + x.weight, 0);
  if (sumW <= 0) return 0;
  const sum = items.reduce((a, x) => a + (x.score * x.weight), 0);
  return sum / sumW;
}

// ---------- CSV helpers (for export / "امتیازی") ----------
function csvValue(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[\",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowsToCsv(headers, rows) {
  const head = headers.join(",");
  const lines = rows.map(r => headers.map(h => csvValue(r[h])).join(","));
  return [head, ...lines].join("\n");
}

function sendCsv(res, filename, headers, rows) {
  const csv = rowsToCsv(headers, rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
}

function getManagerEmployeeId(userId) {
  const row = db.prepare("SELECT id FROM employees WHERE user_id=?").get(userId);
  return row?.id || null;
}

function getApplicableTemplateForEmployee(employee) {
  // Choose the most specific active template:
  // match unit/jobTitle; order by specificity (both > one > none), then version desc, created_at desc
  const t = db.prepare(`
    SELECT *
    FROM kpi_templates
    WHERE is_active=1
      AND (applies_to_unit IS NULL OR applies_to_unit = ?)
      AND (applies_to_job_title IS NULL OR applies_to_job_title = ?)
    ORDER BY
      (CASE WHEN applies_to_unit IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN applies_to_job_title IS NOT NULL THEN 1 ELSE 0 END) DESC,
      version DESC,
      created_at DESC
    LIMIT 1
  `).get(employee.unit, employee.job_title);

  if (!t) return null;

  const items = db.prepare(`
    SELECT ti.kpi_id, ti.weight, k.title, k.type, k.scale_min, k.scale_max
    FROM kpi_template_items ti
    JOIN kpis k ON k.id = ti.kpi_id
    WHERE ti.template_id = ?
      AND k.is_active=1
    ORDER BY k.title
  `).all(t.id);

  return { template: t, items };
}

// ---------- Auth ----------
app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  const u = db.prepare("SELECT * FROM users WHERE username=?").get(username);
  if (!u) return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  if (!bcrypt.compareSync(password, u.password_hash)) return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  return res.json({ token: signToken(u), role: u.role, username: u.username });
});

// ---------- KPI CRUD (HR/CEO) ----------
app.get("/api/kpis", requireAuth, (req, res) => {
  const rows = db.prepare("SELECT * FROM kpis WHERE is_active=1 ORDER BY title").all();
  res.json(rows);
});

app.post("/api/kpis", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const { title, type, scale_min=0, scale_max=100 } = req.body || {};
  if (!title || !type) return res.status(400).json({ error: "VALIDATION" });
  if (Number(scale_min) >= Number(scale_max)) return res.status(400).json({ error: "INVALID_SCALE_RANGE" });
  const id = uuid();
  db.prepare("INSERT INTO kpis(id,title,type,scale_min,scale_max,is_active) VALUES(?,?,?,?,?,1)")
    .run(id, title, type, scale_min, scale_max);
  audit(req.user.uid, "CREATE_KPI", "kpis", id, { title, type });
  res.json({ id });
});

app.put("/api/kpis/:id", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const { id } = req.params;
  const { title, type, scale_min, scale_max, is_active } = req.body || {};
  if (Number(scale_min) >= Number(scale_max)) return res.status(400).json({ error: "INVALID_SCALE_RANGE" });
  db.prepare(`UPDATE kpis SET title=?, type=?, scale_min=?, scale_max=?, is_active=? WHERE id=?`)
    .run(title, type, scale_min, scale_max, is_active ? 1 : 0, id);
  audit(req.user.uid, "UPDATE_KPI", "kpis", id, { title, type });
  res.json({ ok: true });
});

// ---------- KPI TEMPLATE (industrial: weights from template, not from client) ----------
app.get("/api/kpi-templates", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const rows = db.prepare(`
    SELECT id, applies_to_unit, applies_to_job_title, version, is_active, created_at
    FROM kpi_templates
    ORDER BY created_at DESC
  `).all();
  res.json(rows);
});

app.get("/api/kpi-templates/:id/items", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const { id } = req.params;
  const rows = db.prepare(`
    SELECT ti.id, ti.kpi_id, k.title, k.type, ti.weight
    FROM kpi_template_items ti JOIN kpis k ON k.id=ti.kpi_id
    WHERE ti.template_id=?
    ORDER BY k.title
  `).all(id);
  res.json(rows);
});

// Create template + items in one call
app.post("/api/kpi-templates/full", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const { applies_to_unit=null, applies_to_job_title=null, version=1, items=[] } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "ITEMS_REQUIRED" });

  const tplId = uuid();
  db.prepare(`INSERT INTO kpi_templates(id, applies_to_unit, applies_to_job_title, version, is_active)
              VALUES(?,?,?,?,1)`)
    .run(tplId, applies_to_unit, applies_to_job_title, version);

  const insItem = db.prepare(`INSERT INTO kpi_template_items(id, template_id, kpi_id, weight)
                              VALUES(?,?,?,?)`);
  const seen = new Set();
  let sumW = 0;
  for (const it of items) {
    if (!it.kpi_id || typeof it.weight !== "number" || it.weight <= 0) {
      return res.status(400).json({ error: "INVALID_ITEM" });
    }
    sumW += it.weight;
    if (seen.has(it.kpi_id)) return res.status(400).json({ error: "DUPLICATE_KPI_IN_TEMPLATE" });
    seen.add(it.kpi_id);
    insItem.run(uuid(), tplId, it.kpi_id, it.weight);
  }

  if (Math.round(sumW * 1000) / 1000 !== 100) return res.status(400).json({ error: "WEIGHTS_MUST_SUM_TO_100", sumW });

  audit(req.user.uid, "CREATE_KPI_TEMPLATE", "kpi_templates", tplId, {
    applies_to_unit, applies_to_job_title, version, itemsCount: items.length
  });

  res.json({ id: tplId });
});

app.post("/api/kpi-templates/:id/deactivate", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const { id } = req.params;
  db.prepare("UPDATE kpi_templates SET is_active=0 WHERE id=?").run(id);
  audit(req.user.uid, "DEACTIVATE_TEMPLATE", "kpi_templates", id);
  res.json({ ok: true });
});

// Get applicable template for an employee (used by evaluation UI)
app.get("/api/kpi-templates/applicable/:employeeId", requireAuth, (req, res) => {
  const { employeeId } = req.params;

  // RBAC: Manager can only request for direct reports
  if (req.user.role === "MANAGER") {
    const mgrEmpId = getManagerEmployeeId(req.user.uid);
    const emp = db.prepare("SELECT * FROM employees WHERE id=?").get(employeeId);
    if (!emp || emp.manager_id !== mgrEmpId) return res.status(403).json({ error: "FORBIDDEN" });
  }

  const employee = db.prepare("SELECT * FROM employees WHERE id=?").get(employeeId);
  if (!employee) return res.status(404).json({ error: "EMPLOYEE_NOT_FOUND" });

  const out = getApplicableTemplateForEmployee(employee);
  if (!out) return res.status(404).json({ error: "TEMPLATE_NOT_FOUND" });

  res.json(out);
});

// ---------- Period CRUD (HR/CEO) ----------
app.get("/api/periods", requireAuth, (req, res) => {
  const rows = db.prepare("SELECT * FROM evaluation_periods ORDER BY start_date DESC").all();
  res.json(rows);
});

app.post("/api/periods", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const { name, period_type, start_date, end_date } = req.body || {};
  if (!name || !period_type || !start_date || !end_date) return res.status(400).json({ error: "VALIDATION" });
  const id = uuid();
  db.prepare(`INSERT INTO evaluation_periods(id,name,period_type,start_date,end_date,status)
              VALUES(?,?,?,?,?,'OPEN')`)
    .run(id, name, period_type, start_date, end_date);
  audit(req.user.uid, "CREATE_PERIOD", "evaluation_periods", id, { name, period_type });
  res.json({ id });
});

app.post("/api/periods/:id/close", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const { id } = req.params;
  db.prepare("UPDATE evaluation_periods SET status='CLOSED' WHERE id=?").run(id);
  audit(req.user.uid, "CLOSE_PERIOD", "evaluation_periods", id);
  res.json({ ok: true });
});

// ---------- Employees (HR/CEO/MANAGER) ----------
app.get("/api/employees", requireAuth, requireRole("HR","CEO","MANAGER"), (req, res) => {
  let rows;
  if (req.user.role === "MANAGER") {
    const mgrEmpId = getManagerEmployeeId(req.user.uid);
    rows = db.prepare("SELECT * FROM employees WHERE manager_id=? ORDER BY full_name").all(mgrEmpId);
  } else {
    rows = db.prepare("SELECT * FROM employees ORDER BY unit, full_name").all();
  }
  res.json(rows);
});

// ---------- Record Evaluation (MANAGER/HR/CEO) with template weights ----------
app.post("/api/evaluations", requireAuth, requireRole("MANAGER","HR","CEO"), (req, res) => {
  const { employee_id, period_id, scores } = req.body || {};
  if (!employee_id || !period_id || !Array.isArray(scores) || scores.length === 0)
    return res.status(400).json({ error: "VALIDATION" });

  // Security: Manager can only evaluate direct reports
  if (req.user.role === "MANAGER") {
    const mgrEmpId = getManagerEmployeeId(req.user.uid);
    const empCheck = db.prepare("SELECT manager_id FROM employees WHERE id=?").get(employee_id);
    if (!empCheck || empCheck.manager_id !== mgrEmpId) return res.status(403).json({ error: "FORBIDDEN" });
  }

  const employee = db.prepare("SELECT * FROM employees WHERE id=?").get(employee_id);
  if (!employee) return res.status(404).json({ error: "EMPLOYEE_NOT_FOUND" });

  const period = db.prepare("SELECT * FROM evaluation_periods WHERE id=?").get(period_id);
  if (!period) return res.status(404).json({ error: "PERIOD_NOT_FOUND" });
  if (period.status !== "OPEN") return res.status(409).json({ error: "PERIOD_CLOSED" });

  const tplOut = getApplicableTemplateForEmployee(employee);
  if (!tplOut) return res.status(404).json({ error: "TEMPLATE_NOT_FOUND" });

  const tplItems = tplOut.items; // [{kpi_id, weight, scale_min, scale_max, ...}]
  if (tplItems.length === 0) return res.status(400).json({ error: "TEMPLATE_EMPTY" });

  const weightsByKpi = new Map(tplItems.map(x => [x.kpi_id, x.weight]));
  const kpiMetaById = new Map(tplItems.map(x => [x.kpi_id, x]));

  // Validate: no extra KPI, no missing KPI
  const provided = new Set(scores.map(s => s.kpi_id));
  for (const s of scores) {
    if (!weightsByKpi.has(s.kpi_id)) return res.status(400).json({ error: "KPI_NOT_IN_TEMPLATE", kpi_id: s.kpi_id });
  }
  for (const it of tplItems) {
    if (!provided.has(it.kpi_id)) return res.status(400).json({ error: "MISSING_KPI_SCORE", kpi_id: it.kpi_id });
  }

  // Validate ranges and compute
  const items = [];
  for (const s of scores) {
    const meta = kpiMetaById.get(s.kpi_id);
    const score = Number(s.score);
    if (!Number.isFinite(score) || score < meta.scale_min || score > meta.scale_max)
      return res.status(400).json({ error: "INVALID_SCORE_RANGE", kpi_id: s.kpi_id, min: meta.scale_min, max: meta.scale_max });

    items.push({ score, weight: weightsByKpi.get(s.kpi_id) });
  }

  const finalScore = weightedScore(items);

  const evalId = uuid();
  try {
    db.prepare(`INSERT INTO evaluations(id, employee_id, period_id, evaluator_user_id, template_id, final_score)
                VALUES(?,?,?,?,?,?)`)
      .run(evalId, employee_id, period_id, req.user.uid, tplOut.template.id, finalScore);
  } catch {
    return res.status(409).json({ error: "EVALUATION_ALREADY_EXISTS" });
  }

  const insScore = db.prepare(`INSERT INTO evaluation_scores(id, evaluation_id, kpi_id, score, weight, comment)
                               VALUES(?,?,?,?,?,?)`);
  for (const s of scores) {
    const w = weightsByKpi.get(s.kpi_id);
    insScore.run(uuid(), evalId, s.kpi_id, Number(s.score), w, s.comment || null);
  }

  audit(req.user.uid, "CREATE_EVALUATION", "evaluations", evalId, {
    employee_id, period_id, template_id: tplOut.template.id, finalScore
  });

  res.json({ id: evalId, finalScore, templateId: tplOut.template.id });
});

// ---------- View Results (Employee/Manager/HR/CEO) ----------
app.get("/api/results/my/:periodId", requireAuth, (req, res) => {
  const { periodId } = req.params;

  const emp = db.prepare("SELECT * FROM employees WHERE user_id=?").get(req.user.uid);
  if (!emp) return res.status(404).json({ error: "EMPLOYEE_LINK_NOT_FOUND" });

  const ev = db.prepare(`
    SELECT ev.id, ev.final_score, ev.created_at, p.name as period_name
    FROM evaluations ev
    JOIN evaluation_periods p ON p.id = ev.period_id
    WHERE ev.employee_id=? AND ev.period_id=?
  `).get(emp.id, periodId);
  if (!ev) return res.status(404).json({ error: "EVALUATION_NOT_FOUND" });

  const breakdown = db.prepare(`
    SELECT k.title, k.type, es.score, es.weight, es.comment
    FROM evaluation_scores es
    JOIN kpis k ON k.id = es.kpi_id
    WHERE es.evaluation_id=?
    ORDER BY k.title
  `).all(ev.id);

  res.json({ employee: { full_name: emp.full_name, unit: emp.unit, job_title: emp.job_title }, evaluation: ev, breakdown });
});

// ---------- Submit Objection (Employee) ----------
app.post("/api/objections", requireAuth, requireRole("EMPLOYEE"), (req, res) => {
  const { evaluation_id, message } = req.body || {};
  if (!evaluation_id || !message?.trim()) return res.status(400).json({ error: "VALIDATION" });

  const emp = db.prepare("SELECT * FROM employees WHERE user_id=?").get(req.user.uid);
  if (!emp) return res.status(404).json({ error: "EMPLOYEE_LINK_NOT_FOUND" });

  // must belong to employee
  const ev = db.prepare("SELECT id FROM evaluations WHERE id=? AND employee_id=?").get(evaluation_id, emp.id);
  if (!ev) return res.status(403).json({ error: "FORBIDDEN" });

  const id = uuid();
  db.prepare(`INSERT INTO objections(id, evaluation_id, employee_id, message) VALUES(?,?,?,?)`)
    .run(id, evaluation_id, emp.id, message.trim());

  audit(req.user.uid, "SUBMIT_OBJECTION", "objections", id, { evaluation_id });
  res.json({ id });
});

// ---------- Objection workflow (HR/CEO/Manager) ----------
// Employee can view their objections (optionally filter by evaluation_id)
app.get("/api/objections/my", requireAuth, requireRole("EMPLOYEE"), (req, res) => {
  const { evaluation_id } = req.query || {};
  const emp = db.prepare("SELECT * FROM employees WHERE user_id=?").get(req.user.uid);
  if (!emp) return res.status(404).json({ error: "EMPLOYEE_LINK_NOT_FOUND" });

  const rows = db.prepare(`
    SELECT o.id, o.evaluation_id, o.message, o.status, o.response_message, o.created_at,
           o.reviewed_at, o.resolved_at,
           p.name as period_name
    FROM objections o
    JOIN evaluations ev ON ev.id = o.evaluation_id
    JOIN evaluation_periods p ON p.id = ev.period_id
    WHERE o.employee_id = ?
      AND (? IS NULL OR o.evaluation_id = ?)
    ORDER BY o.created_at DESC
  `).all(emp.id, evaluation_id || null, evaluation_id || null);

  res.json(rows);
});

// HR/CEO/Manager can list objections; manager sees only direct reports
app.get("/api/objections", requireAuth, requireRole("HR","CEO","MANAGER"), (req, res) => {
  const { status } = req.query || {};

  if (req.user.role === "MANAGER") {
    const mgrEmpId = getManagerEmployeeId(req.user.uid);
    const rows = db.prepare(`
      SELECT o.id, o.status, o.message, o.response_message, o.created_at,
             o.reviewed_at, o.resolved_at,
             e.full_name, e.unit, e.job_title,
             p.name as period_name,
             ev.id as evaluation_id
      FROM objections o
      JOIN employees e ON e.id = o.employee_id
      JOIN evaluations ev ON ev.id = o.evaluation_id
      JOIN evaluation_periods p ON p.id = ev.period_id
      WHERE e.manager_id = ?
        AND (? IS NULL OR o.status = ?)
      ORDER BY o.created_at DESC
    `).all(mgrEmpId, status || null, status || null);
    return res.json(rows);
  }

  const rows = db.prepare(`
    SELECT o.id, o.status, o.message, o.response_message, o.created_at,
           o.reviewed_at, o.resolved_at,
           e.full_name, e.unit, e.job_title,
           p.name as period_name,
           ev.id as evaluation_id
    FROM objections o
    JOIN employees e ON e.id = o.employee_id
    JOIN evaluations ev ON ev.id = o.evaluation_id
    JOIN evaluation_periods p ON p.id = ev.period_id
    WHERE (? IS NULL OR o.status = ?)
    ORDER BY o.created_at DESC
  `).all(status || null, status || null);
  res.json(rows);
});

// CSV export for objections list (HR/CEO only)
app.get("/api/objections.csv", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const rows = db.prepare(`
    SELECT o.id, o.status, o.created_at, o.message, o.response_message,
           e.employee_code, e.full_name, e.unit, e.job_title,
           p.name as period_name,
           ev.id as evaluation_id
    FROM objections o
    JOIN employees e ON e.id = o.employee_id
    JOIN evaluations ev ON ev.id = o.evaluation_id
    JOIN evaluation_periods p ON p.id = ev.period_id
    ORDER BY o.created_at DESC
  `).all();
  sendCsv(res, "objections.csv", [
    "id","status","created_at","period_name","employee_code","full_name","unit","job_title","evaluation_id","message","response_message"
  ], rows);
});

function ensureObjectionAccessForManager(userId, objectionId) {
  const mgrEmpId = getManagerEmployeeId(userId);
  const row = db.prepare(`
    SELECT o.id
    FROM objections o
    JOIN employees e ON e.id = o.employee_id
    WHERE o.id = ? AND e.manager_id = ?
  `).get(objectionId, mgrEmpId);
  return !!row;
}

app.post("/api/objections/:id/review", requireAuth, requireRole("HR","CEO","MANAGER"), (req, res) => {
  const { id } = req.params;
  const { response_message } = req.body || {};

  if (req.user.role === "MANAGER" && !ensureObjectionAccessForManager(req.user.uid, id)) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }

  const obj = db.prepare("SELECT id, status FROM objections WHERE id=?").get(id);
  if (!obj) return res.status(404).json({ error: "OBJECTION_NOT_FOUND" });

  db.prepare(`
    UPDATE objections
    SET status='REVIEWED',
        response_message = COALESCE(?, response_message),
        resolver_user_id = ?,
        reviewed_at = COALESCE(reviewed_at, datetime('now'))
    WHERE id = ?
  `).run((response_message || null), req.user.uid, id);

  audit(req.user.uid, "REVIEW_OBJECTION", "objections", id, { response_message: response_message || null });
  res.json({ ok: true });
});

app.post("/api/objections/:id/resolve", requireAuth, requireRole("HR","CEO","MANAGER"), (req, res) => {
  const { id } = req.params;
  const { response_message } = req.body || {};
  if (!response_message?.trim()) return res.status(400).json({ error: "RESPONSE_REQUIRED" });

  if (req.user.role === "MANAGER" && !ensureObjectionAccessForManager(req.user.uid, id)) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }

  const obj = db.prepare("SELECT id, status FROM objections WHERE id=?").get(id);
  if (!obj) return res.status(404).json({ error: "OBJECTION_NOT_FOUND" });

  db.prepare(`
    UPDATE objections
    SET status='RESOLVED',
        response_message = ?,
        resolver_user_id = ?,
        resolved_at = datetime('now')
    WHERE id = ?
  `).run(response_message.trim(), req.user.uid, id);

  audit(req.user.uid, "RESOLVE_OBJECTION", "objections", id, { response_message: response_message.trim() });
  res.json({ ok: true });
});

// ---------- Reports ----------
// Units list (for dashboard selectors)
app.get("/api/reports/units", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const rows = db.prepare("SELECT DISTINCT unit FROM employees ORDER BY unit").all();
  res.json(rows.map(r => r.unit));
});

// ---- Top performers (JSON + CSV) ----
app.get("/api/reports/top-performers/:periodId.csv", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const { periodId } = req.params;
  const rows = db.prepare(`
    SELECT e.full_name, e.unit, ev.final_score
    FROM evaluations ev
    JOIN employees e ON e.id = ev.employee_id
    WHERE ev.period_id=?
    ORDER BY ev.final_score DESC
    LIMIT 10
  `).all(periodId);
  sendCsv(res, `top-performers-${periodId}.csv`, ["full_name","unit","final_score"], rows);
});

app.get("/api/reports/top-performers/:periodId", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const { periodId } = req.params;
  const rows = db.prepare(`
    SELECT e.full_name, e.unit, ev.final_score
    FROM evaluations ev
    JOIN employees e ON e.id = ev.employee_id
    WHERE ev.period_id=?
    ORDER BY ev.final_score DESC
    LIMIT 10
  `).all(periodId);
  res.json(rows);
});

// ---- Employee × KPI heatmap (JSON + CSV) ----
app.get("/api/reports/heatmap/:periodId.csv", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const { periodId } = req.params;

  const employees = db.prepare(`
    SELECT DISTINCT e.id, e.full_name, e.unit, e.job_title
    FROM evaluations ev
    JOIN employees e ON e.id = ev.employee_id
    WHERE ev.period_id=?
    ORDER BY e.unit, e.full_name
  `).all(periodId);

  const kpis = db.prepare(`
    SELECT DISTINCT k.id, k.title
    FROM evaluation_scores es
    JOIN evaluations ev ON ev.id = es.evaluation_id
    JOIN kpis k ON k.id = es.kpi_id
    WHERE ev.period_id=?
    ORDER BY k.title
  `).all(periodId);

  const scoreRows = db.prepare(`
    SELECT ev.employee_id, es.kpi_id, es.score
    FROM evaluation_scores es
    JOIN evaluations ev ON ev.id = es.evaluation_id
    WHERE ev.period_id=?
  `).all(periodId);

  const byKey = new Map();
  for (const r of scoreRows) byKey.set(`${r.employee_id}__${r.kpi_id}`, r.score);

  const headers = ["full_name","unit","job_title", ...kpis.map(k => k.title)];
  const rows = employees.map(e => {
    const obj = { full_name: e.full_name, unit: e.unit, job_title: e.job_title };
    for (const k of kpis) obj[k.title] = byKey.get(`${e.id}__${k.id}`) ?? "";
    return obj;
  });

  sendCsv(res, `heatmap-employee-kpi-${periodId}.csv`, headers, rows);
});

// Heatmap real: employees x KPIs for a period
app.get("/api/reports/heatmap/:periodId", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const { periodId } = req.params;

  const employees = db.prepare(`
    SELECT DISTINCT e.id, e.full_name, e.unit, e.job_title
    FROM evaluations ev
    JOIN employees e ON e.id = ev.employee_id
    WHERE ev.period_id=?
    ORDER BY e.unit, e.full_name
  `).all(periodId);

  const kpis = db.prepare(`
    SELECT DISTINCT k.id, k.title, k.type
    FROM evaluation_scores es
    JOIN evaluations ev ON ev.id = es.evaluation_id
    JOIN kpis k ON k.id = es.kpi_id
    WHERE ev.period_id=?
    ORDER BY k.title
  `).all(periodId);

  // map scores
  const scoreRows = db.prepare(`
    SELECT ev.employee_id, es.kpi_id, es.score
    FROM evaluation_scores es
    JOIN evaluations ev ON ev.id = es.evaluation_id
    WHERE ev.period_id=?
  `).all(periodId);

  const byKey = new Map();
  for (const r of scoreRows) byKey.set(`${r.employee_id}__${r.kpi_id}`, r.score);

  const matrix = employees.map(emp => ({
    employee_id: emp.id,
    full_name: emp.full_name,
    unit: emp.unit,
    job_title: emp.job_title,
    scores: kpis.map(k => (byKey.has(`${emp.id}__${k.id}`) ? byKey.get(`${emp.id}__${k.id}`) : null))
  }));

  res.json({ employees, kpis, matrix, scale: { min: 0, max: 100 } });
});

// ---- Unit × Period heatmap (JSON + CSV) ----
app.get("/api/reports/heatmap-unit-period.csv", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const periods = db.prepare("SELECT id, name, start_date FROM evaluation_periods ORDER BY start_date").all();
  const units = db.prepare("SELECT DISTINCT unit FROM employees ORDER BY unit").all().map(r => r.unit);

  const rows = db.prepare(`
    SELECT e.unit as unit, ev.period_id as period_id,
           AVG(ev.final_score) as avg_score,
           COUNT(*) as n
    FROM evaluations ev
    JOIN employees e ON e.id = ev.employee_id
    GROUP BY e.unit, ev.period_id
  `).all();

  const map = new Map();
  for (const r of rows) map.set(`${r.unit}__${r.period_id}`, r.avg_score);

  const headers = ["unit", ...periods.map(p => p.name)];
  const out = units.map(u => {
    const obj = { unit: u };
    for (const p of periods) obj[p.name] = map.get(`${u}__${p.id}`) ?? "";
    return obj;
  });

  sendCsv(res, "heatmap-unit-period.csv", headers, out);
});

app.get("/api/reports/heatmap-unit-period", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const periods = db.prepare("SELECT id, name, start_date FROM evaluation_periods ORDER BY start_date").all();
  const units = db.prepare("SELECT DISTINCT unit FROM employees ORDER BY unit").all().map(r => r.unit);

  const rows = db.prepare(`
    SELECT e.unit as unit, ev.period_id as period_id,
           AVG(ev.final_score) as avg_score,
           COUNT(*) as n
    FROM evaluations ev
    JOIN employees e ON e.id = ev.employee_id
    GROUP BY e.unit, ev.period_id
  `).all();

  const map = new Map();
  for (const r of rows) map.set(`${r.unit}__${r.period_id}`, { avg_score: r.avg_score, n: r.n });

  const matrix = units.map(u => ({
    unit: u,
    values: periods.map(p => (map.get(`${u}__${p.id}`)?.avg_score ?? null)),
    counts: periods.map(p => (map.get(`${u}__${p.id}`)?.n ?? 0))
  }));

  res.json({ units, periods, matrix, scale: { min: 0, max: 100 } });
});

// ---- Unit comparison vs previous period (JSON + CSV) ----
app.get("/api/reports/unit-comparison/:periodId.csv", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const { periodId } = req.params;

  const cur = db.prepare("SELECT * FROM evaluation_periods WHERE id=?").get(periodId);
  if (!cur) return res.status(404).json({ error: "PERIOD_NOT_FOUND" });

  const prev = db.prepare(
    "SELECT * FROM evaluation_periods WHERE start_date < ? ORDER BY start_date DESC LIMIT 1"
  ).get(cur.start_date);
  if (!prev) return res.status(404).json({ error: "PREVIOUS_PERIOD_NOT_FOUND" });

  const curRows = db.prepare(`
    SELECT e.unit as unit, AVG(ev.final_score) as avg_score, COUNT(*) as n
    FROM evaluations ev JOIN employees e ON e.id = ev.employee_id
    WHERE ev.period_id=?
    GROUP BY e.unit
  `).all(cur.id);
  const prevRows = db.prepare(`
    SELECT e.unit as unit, AVG(ev.final_score) as avg_score, COUNT(*) as n
    FROM evaluations ev JOIN employees e ON e.id = ev.employee_id
    WHERE ev.period_id=?
    GROUP BY e.unit
  `).all(prev.id);

  const curMap = new Map(curRows.map(r => [r.unit, r]));
  const prevMap = new Map(prevRows.map(r => [r.unit, r]));
  const allUnits = Array.from(new Set([...curMap.keys(), ...prevMap.keys()])).sort();

  const rows = allUnits.map(u => {
    const c = curMap.get(u);
    const p = prevMap.get(u);
    const curAvg = c?.avg_score ?? null;
    const prevAvg = p?.avg_score ?? null;
    const delta = (curAvg !== null && prevAvg !== null) ? (curAvg - prevAvg) : null;
    return {
      unit: u,
      current_period: cur.name,
      current_avg: curAvg ?? "",
      current_n: c?.n ?? 0,
      previous_period: prev.name,
      previous_avg: prevAvg ?? "",
      previous_n: p?.n ?? 0,
      delta: (delta ?? "")
    };
  });

  sendCsv(res, `unit-comparison-${cur.name}-vs-${prev.name}.csv`, [
    "unit","current_period","current_avg","current_n","previous_period","previous_avg","previous_n","delta"
  ], rows);
});

app.get("/api/reports/unit-comparison/:periodId", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const { periodId } = req.params;

  const cur = db.prepare("SELECT * FROM evaluation_periods WHERE id=?").get(periodId);
  if (!cur) return res.status(404).json({ error: "PERIOD_NOT_FOUND" });

  const prev = db.prepare(
    "SELECT * FROM evaluation_periods WHERE start_date < ? ORDER BY start_date DESC LIMIT 1"
  ).get(cur.start_date);
  if (!prev) return res.status(404).json({ error: "PREVIOUS_PERIOD_NOT_FOUND" });

  const curRows = db.prepare(`
    SELECT e.unit as unit, AVG(ev.final_score) as avg_score, COUNT(*) as n
    FROM evaluations ev JOIN employees e ON e.id = ev.employee_id
    WHERE ev.period_id=?
    GROUP BY e.unit
  `).all(cur.id);
  const prevRows = db.prepare(`
    SELECT e.unit as unit, AVG(ev.final_score) as avg_score, COUNT(*) as n
    FROM evaluations ev JOIN employees e ON e.id = ev.employee_id
    WHERE ev.period_id=?
    GROUP BY e.unit
  `).all(prev.id);

  const curMap = new Map(curRows.map(r => [r.unit, r]));
  const prevMap = new Map(prevRows.map(r => [r.unit, r]));
  const allUnits = Array.from(new Set([...curMap.keys(), ...prevMap.keys()])).sort();

  const units = allUnits.map(u => {
    const c = curMap.get(u);
    const p = prevMap.get(u);
    const curAvg = c?.avg_score ?? null;
    const prevAvg = p?.avg_score ?? null;
    const delta = (curAvg !== null && prevAvg !== null) ? (curAvg - prevAvg) : null;
    return {
      unit: u,
      current_avg: curAvg,
      current_n: c?.n ?? 0,
      previous_avg: prevAvg,
      previous_n: p?.n ?? 0,
      delta
    };
  });

  res.json({ currentPeriod: { id: cur.id, name: cur.name }, previousPeriod: { id: prev.id, name: prev.name }, units });
});

// ---- Risk report: employees below threshold (JSON + CSV) ----
app.get("/api/reports/risk/:periodId.csv", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const { periodId } = req.params;
  const threshold = Number(req.query.threshold ?? 60);
  if (!Number.isFinite(threshold)) return res.status(400).json({ error: "INVALID_THRESHOLD" });

  const rows = db.prepare(`
    SELECT e.employee_code, e.full_name, e.unit, e.job_title, ev.final_score
    FROM evaluations ev JOIN employees e ON e.id = ev.employee_id
    WHERE ev.period_id = ? AND ev.final_score < ?
    ORDER BY ev.final_score ASC
  `).all(periodId, threshold);

  sendCsv(res, `risk-period-${periodId}-th-${threshold}.csv`, ["employee_code","full_name","unit","job_title","final_score"], rows);
});

app.get("/api/reports/risk/:periodId", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const { periodId } = req.params;
  const threshold = Number(req.query.threshold ?? 60);
  if (!Number.isFinite(threshold)) return res.status(400).json({ error: "INVALID_THRESHOLD" });

  const rows = db.prepare(`
    SELECT e.employee_code, e.full_name, e.unit, e.job_title, ev.final_score
    FROM evaluations ev JOIN employees e ON e.id = ev.employee_id
    WHERE ev.period_id = ? AND ev.final_score < ?
    ORDER BY ev.final_score ASC
  `).all(periodId, threshold);

  res.json({ periodId, threshold, rows });
});

// ---- Trend export (CSV) ----
app.get("/api/reports/trend/unit/:unit/export.csv", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const { unit } = req.params;
  const rows = db.prepare(`
    SELECT p.name as period_name, AVG(ev.final_score) as avg_score
    FROM evaluations ev
    JOIN employees e ON e.id = ev.employee_id
    JOIN evaluation_periods p ON p.id = ev.period_id
    WHERE e.unit = ?
    GROUP BY ev.period_id
    ORDER BY p.start_date
  `).all(unit);
  sendCsv(res, `trend-unit-${unit}.csv`, ["period_name","avg_score"], rows);
});

// Trend: unit average across periods (optional but useful)
app.get("/api/reports/trend/unit/:unit", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const { unit } = req.params;
  const rows = db.prepare(`
    SELECT p.name as period_name, AVG(ev.final_score) as avg_score
    FROM evaluations ev
    JOIN employees e ON e.id = ev.employee_id
    JOIN evaluation_periods p ON p.id = ev.period_id
    WHERE e.unit = ?
    GROUP BY ev.period_id
    ORDER BY p.start_date
  `).all(unit);
  res.json(rows);
});

// ---------- Audit ----------
app.get("/api/audit.csv", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const rows = db.prepare(`
    SELECT a.timestamp, u.username, a.action, a.entity_type, a.entity_id, a.meta_json
    FROM audit_logs a JOIN users u ON u.id=a.user_id
    ORDER BY a.timestamp DESC LIMIT 100
  `).all();
  sendCsv(res, "audit-last-100.csv", ["timestamp","username","action","entity_type","entity_id","meta_json"], rows);
});

app.get("/api/audit", requireAuth, requireRole("HR","CEO"), (req, res) => {
  const rows = db.prepare(`
    SELECT a.timestamp, u.username, a.action, a.entity_type, a.entity_id, a.meta_json
    FROM audit_logs a JOIN users u ON u.id=a.user_id
    ORDER BY a.timestamp DESC LIMIT 100
  `).all();
  res.json(rows);
});

const PORT = 3001;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
