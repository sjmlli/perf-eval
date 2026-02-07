import fs from "fs";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";
import { db, runSchema } from "./db.js";

const schema = fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
runSchema(schema);

// ---------- helpers ----------
const insUser = db.prepare("INSERT OR IGNORE INTO users(id, username, password_hash, role) VALUES(?,?,?,?)");
function createUser(username, password, role) {
  const id = uuid();
  const hash = bcrypt.hashSync(password, 10);
  insUser.run(id, username, hash, role);
  return id;
}

const ceoId = createUser("ceo", "1234", "CEO");
const hrId = createUser("hr", "1234", "HR");
const mgrUserId = createUser("mgr", "1234", "MANAGER");
const empUserId = createUser("emp", "1234", "EMPLOYEE");

// extra demo accounts (optional, for richer reports)
const mgr2UserId = createUser("mgr2", "1234", "MANAGER");
const emp2UserId = createUser("emp2", "1234", "EMPLOYEE");

// ---------- employees ----------
const insEmp = db.prepare(`INSERT OR IGNORE INTO employees(
  id, employee_code, full_name, unit, job_title, manager_id, user_id
) VALUES(?,?,?,?,?,?,?)`);

const mgrEmpId = uuid();
insEmp.run(mgrEmpId, "M001", "Manager One", "Sales", "Sales Manager", null, mgrUserId);

const empId = uuid();
insEmp.run(empId, "E100", "Employee One", "Sales", "Sales Specialist", mgrEmpId, empUserId);

const mgrEmp2Id = uuid();
insEmp.run(mgrEmp2Id, "M002", "Manager Two", "Support", "Support Manager", null, mgr2UserId);

const emp2Id = uuid();
insEmp.run(emp2Id, "E200", "Employee Two", "Support", "Support Specialist", mgrEmp2Id, emp2UserId);

// ---------- KPIs ----------
const insKpi = db.prepare("INSERT OR IGNORE INTO kpis(id,title,type,scale_min,scale_max,is_active) VALUES(?,?,?,?,?,1)");
const k1 = uuid(); insKpi.run(k1, "Teamwork", "CORE", 0, 100);
const k2 = uuid(); insKpi.run(k2, "Discipline", "CORE", 0, 100);
const k3 = uuid(); insKpi.run(k3, "Conversion Rate", "JOB", 0, 100);
const k4 = uuid(); insKpi.run(k4, "First Response Time", "JOB", 0, 100);

// ---------- Default KPI Template for Sales Specialist ----------
const tplId = uuid();
db.prepare(`INSERT OR IGNORE INTO kpi_templates(id, applies_to_unit, applies_to_job_title, version, is_active)
            VALUES(?,?,?,?,1)`)
  .run(tplId, "Sales", "Sales Specialist", 1);

const insItem = db.prepare(`INSERT OR IGNORE INTO kpi_template_items(id, template_id, kpi_id, weight)
                            VALUES(?,?,?,?)`);
insItem.run(uuid(), tplId, k1, 30);
insItem.run(uuid(), tplId, k2, 30);
insItem.run(uuid(), tplId, k3, 40);

// ---------- Default KPI Template for Support Specialist ----------
const tpl2Id = uuid();
db.prepare(`INSERT OR IGNORE INTO kpi_templates(id, applies_to_unit, applies_to_job_title, version, is_active)
            VALUES(?,?,?,?,1)`)
  .run(tpl2Id, "Support", "Support Specialist", 1);

insItem.run(uuid(), tpl2Id, k1, 30);
insItem.run(uuid(), tpl2Id, k2, 30);
insItem.run(uuid(), tpl2Id, k4, 40);

// ---------- Periods ----------
const insPeriod = db.prepare(`INSERT OR IGNORE INTO evaluation_periods(
  id, name, period_type, start_date, end_date, status
) VALUES(?,?,?,?,?,?)`);

const p1 = uuid();
insPeriod.run(p1, "Q1-1404", "QUARTERLY", "2025-01-01", "2025-03-31", "CLOSED");
const p2 = uuid();
insPeriod.run(p2, "Q2-1404", "QUARTERLY", "2025-04-01", "2025-06-30", "CLOSED");
const p3 = uuid();
insPeriod.run(p3, "Q3-1404", "QUARTERLY", "2025-07-01", "2025-09-30", "OPEN");

// ---------- Demo evaluations for richer dashboards ----------
const insEval = db.prepare(`INSERT OR IGNORE INTO evaluations(
  id, employee_id, period_id, evaluator_user_id, template_id, final_score
) VALUES(?,?,?,?,?,?)`);

const insEvalScore = db.prepare(`INSERT OR IGNORE INTO evaluation_scores(
  id, evaluation_id, kpi_id, score, weight, comment
) VALUES(?,?,?,?,?,?)`);

function addEvaluation({ employeeId, periodId, evaluatorUserId, templateId, scores }) {
  // scores: [{kpiId, score, weight, comment}]
  const final = scores.reduce((a, x) => a + x.score * x.weight, 0) / 100;
  const evalId = uuid();
  insEval.run(evalId, employeeId, periodId, evaluatorUserId, templateId, final);
  for (const s of scores) {
    insEvalScore.run(uuid(), evalId, s.kpiId, s.score, s.weight, s.comment || null);
  }
  return { evalId, final };
}

// Sales employee evaluations
const ev1 = addEvaluation({
  employeeId: empId,
  periodId: p1,
  evaluatorUserId: mgrUserId,
  templateId: tplId,
  scores: [
    { kpiId: k1, score: 70, weight: 30, comment: "Good collaboration" },
    { kpiId: k2, score: 60, weight: 30, comment: "Needs punctuality" },
    { kpiId: k3, score: 75, weight: 40, comment: "Met targets" }
  ]
});

addEvaluation({
  employeeId: empId,
  periodId: p2,
  evaluatorUserId: mgrUserId,
  templateId: tplId,
  scores: [
    { kpiId: k1, score: 80, weight: 30 },
    { kpiId: k2, score: 75, weight: 30 },
    { kpiId: k3, score: 85, weight: 40 }
  ]
});

// Support employee evaluations
addEvaluation({
  employeeId: emp2Id,
  periodId: p1,
  evaluatorUserId: mgr2UserId,
  templateId: tpl2Id,
  scores: [
    { kpiId: k1, score: 65, weight: 30 },
    { kpiId: k2, score: 55, weight: 30 },
    { kpiId: k4, score: 60, weight: 40 }
  ]
});

addEvaluation({
  employeeId: emp2Id,
  periodId: p2,
  evaluatorUserId: mgr2UserId,
  templateId: tpl2Id,
  scores: [
    { kpiId: k1, score: 70, weight: 30 },
    { kpiId: k2, score: 60, weight: 30 },
    { kpiId: k4, score: 65, weight: 40 }
  ]
});

// ---------- Demo objection (employee -> OPEN) ----------
db.prepare(`INSERT OR IGNORE INTO objections(id, evaluation_id, employee_id, message)
            VALUES(?,?,?,?)`)
  .run(uuid(), ev1.evalId, empId, "با نمره نظم موافق نیستم؛ شواهد بیشتری لازم است.");

console.log("DB initialized.");
console.log("Users: ceo/hr/mgr/emp/mgr2/emp2 password=1234");
console.log("Templates: Sales(Sales Specialist) + Support(Support Specialist)");
console.log("Seed includes sample periods + evaluations + one objection for demo dashboards.");
