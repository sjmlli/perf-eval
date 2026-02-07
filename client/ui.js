import { getRole, getToken } from "./api.js";

const LS_THEME = "pe_theme";
const LS_LANG = "pe_lang";

const translations = {
  en: {
    // App
    "app.name": "Performance Evaluation System",
    "app.tagline": "Configurable KPIs • Fair & Transparent • Audit‑ready",
    "sidebar.title": "Navigation",

    // Common
    "common.menu": "Menu",
    "common.theme": "Theme",
    "common.lang": "Language",
    "common.light": "Light",
    "common.dark": "Dark",
    "common.logout": "Logout",
    "common.role": "Role",
    "common.user": "User",
    "common.refresh": "Refresh",
    "common.show": "Show",
    "common.exportCsv": "Export CSV",
    "common.create": "Create",
    "common.save": "Save",
    "common.close": "Close",
    "common.submit": "Submit",
    "common.loading": "Loading…",
    "common.done": "Done.",
    "common.accessDenied": "Access denied (HR/CEO).",
    "common.selectPeriod": "Select period",
    "common.selectUnit": "Select unit",
    "common.selectEmployee": "Select employee",
    "common.threshold": "Threshold",
    "common.statusFilter": "Status filter",
    "common.status": "Status",
    "common.message": "Message",
    "common.reset": "Reset",
    "common.clear": "Clear",

    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.kpis": "KPIs",
    "nav.templates": "KPI Templates",
    "nav.periods": "Periods",
    "nav.evaluations": "Record Evaluation",
    "nav.heatmapEmpKpi": "Heatmap (Employee × KPI)",
    "nav.heatmapUnitPeriod": "Heatmap (Unit × Period)",
    "nav.unitComparison": "Unit Comparison",
    "nav.risk": "Risk Report",
    "nav.objections": "Objections",
    "nav.myResult": "My Result",

    // Titles
    "title.login": "Sign in",
    "title.dashboard": "Dashboard",
    "title.kpis": "KPI Management",
    "title.templates": "KPI Template Management",
    "title.periods": "Period Management",
    "title.evaluations": "Record Evaluation",
    "title.heatmap": "Heatmap (Employee × KPI)",
    "title.unitPeriodHeatmap": "Heatmap (Unit × Period)",
    "title.unitComparison": "Unit Comparison",
    "title.risk": "Risk Report",
    "title.objections": "Objection Workflow",
    "title.myResult": "My Result",

    // Login
    "login.heading": "Welcome back",
    "login.subtitle": "Use demo accounts below to explore the system.",
    "login.username": "Username",
    "login.password": "Password",
    "login.signIn": "Sign in",
    "login.fillDemo": "Fill demo",
    "login.demoTitle": "Demo accounts (password: 1234)",
    "login.demoCeo": "CEO: ceo",
    "login.demoHr": "HR: hr",
    "login.demoMgr": "Manager: mgr / mgr2",
    "login.demoEmp": "Employee: emp / emp2",
    "login.teamLabel": "Team members",
    "login.teamHint": "Replace with your names before submission.",

    // Dashboard
    "dash.subtitle": "Executive overview for HR/CEO + quick insights.",
    "dash.top.title": "Top performers",
    "dash.top.hint": "HR/CEO preview",
    "dash.kpiDriven": "KPI-driven",
    "dash.audit.title": "Audit log",
    "dash.audit.hint": "Last 100 sensitive actions.",
    "dash.audit.badge": "Auditable",
    "dash.trend.title": "Unit trend",
    "dash.trend.hint": "Average score per period (HR/CEO).",
    "dash.trend.badge": "Trend",
    "dash.trend.load": "Load trend",

    // KPI page
    "kpis.subtitle": "Create and manage KPIs (HR/CEO).",
    "kpis.create.title": "Create KPI",
    "kpis.create.hint": "Requires HR/CEO",
    "kpis.fields.title": "Title",
    "kpis.fields.titlePh": "e.g., Teamwork",
    "kpis.fields.type": "Type",
    "kpis.fields.range": "Scale (min/max)",
    "kpis.type.core": "CORE (General)",
    "kpis.type.job": "JOB (Role-specific)",
    "kpis.type.strategic": "STRATEGIC (Organization)",
    "kpis.list.title": "KPI list",
    "kpis.list.hint": "Read-only list from database.",
    "kpis.table.title": "Title",
    "kpis.table.type": "Type",
    "kpis.table.range": "Range",

    // Templates
    "tpl.subtitle": "Templates define weights for fairness and comparability (HR/CEO).",
    "tpl.create.title": "Create KPI Template",
    "tpl.create.hint": "Weights must sum to 100.",
    "tpl.fields.unit": "Unit (optional)",
    "tpl.fields.unitPh": "e.g., Sales (empty = all units)",
    "tpl.fields.job": "Job title (optional)",
    "tpl.fields.jobPh": "e.g., Sales Specialist (empty = all jobs)",
    "tpl.fields.version": "Version",
    "tpl.selectKpis": "Select KPIs & weights",
    "tpl.btn.create": "Create template",
    "tpl.btn.showItems": "View items",
    "tpl.btn.deactivate": "Deactivate",
    "tpl.list.title": "Existing templates",
    "tpl.list.hint": "Latest templates appear first.",
    "tpl.msg.selectOne": "Select at least one KPI.",
    "tpl.msg.sum100": "Total weights must be exactly 100.",

    // Periods
    "periods.subtitle": "Define evaluation periods and close them for auditability (HR/CEO).",
    "periods.create.title": "Create evaluation period",
    "periods.create.hint": "Requires HR/CEO",
    "periods.fields.name": "Period name",
    "periods.fields.namePh": "e.g., Q1-2026",
    "periods.fields.type": "Type",
    "periods.fields.dates": "Start / End",
    "periods.type.monthly": "MONTHLY",
    "periods.type.quarterly": "QUARTERLY",
    "periods.type.yearly": "YEARLY",
    "periods.list.title": "Periods",
    "periods.list.hint": "Close a period to make it read-only for managers.",
    "periods.table.name": "Name",
    "periods.table.type": "Type",
    "periods.table.range": "Range",
    "periods.table.status": "Status",
    "periods.table.actions": "Actions",

    // Evaluations
    "eval.subtitle": "Managers evaluate direct reports using template weights.",
    "eval.form.title": "Performance evaluation",
    "eval.form.hint": "Weights come from the applicable template. Scores are validated.",
    "eval.template.title": "Applied template",
    "eval.scores.title": "KPI scores",
    "eval.save": "Save evaluation",
    "eval.score": "Score",
    "eval.evidence": "Evidence / comment",
    "eval.evidencePh": "Optional note to justify the score…",

    // Heatmap
    "heatmap.subtitle": "Real database heatmap for HR/CEO analytics.",
    "heatmap.employee": "Employee",
    "heatmap.unitJob": "Unit / Job",
    "heatmap.legend": "Legend",

    // Unit × Period heatmap
    "uheat.subtitle": "Average score per unit across periods (HR/CEO).",
    "uheat.hint": "Use this for trend analysis and unit comparisons.",
    "uheat.unit": "Unit",

    // Unit comparison
    "ucomp.subtitle": "Compare unit averages vs. previous period (HR/CEO).",
    "ucomp.current": "Current period",
    "ucomp.previous": "Previous period",
    "ucomp.unit": "Unit",
    "ucomp.avgCurrent": "Avg (current)",
    "ucomp.avgPrev": "Avg (previous)",
    "ucomp.n": "n",

    // Risk
    "risk.subtitle": "Employees below a threshold (HR/CEO). Exportable.",
    "risk.none": "No employees below threshold",
    "risk.count": "Count",
    "risk.code": "Code",
    "risk.name": "Name",
    "risk.unit": "Unit",
    "risk.job": "Job",
    "risk.score": "Final score",

    // Objections (management)
    "obj.subtitle": "OPEN → REVIEWED → RESOLVED. HR/CEO (all) • Manager (direct reports).",
    "obj.all": "All",
    "obj.none": "No items found.",
    "obj.message": "Message",
    "obj.response": "Response",
    "obj.responsePh": "Write HR/manager response…",
    "obj.markReviewed": "Mark REVIEWED",
    "obj.markResolved": "Mark RESOLVED",
    "obj.updated": "Updated.",
    "obj.resolved": "Resolved.",

    // My result
    "my.subtitle": "Transparency: final score, breakdown, and objection workflow.",
    "my.finalScore": "Final score",
    "my.employee": "Employee",
    "my.unitJob": "Unit / Job",
    "my.period": "Period",
    "my.formula": "Formula",
    "my.evalId": "Evaluation ID",
    "my.kpi": "KPI",
    "my.type": "Type",
    "my.score": "Score",
    "my.weight": "Weight",
    "my.comment": "Comment",
    "my.ob.createTitle": "Submit an objection / feedback",
    "my.ob.hint": "Objection will be linked to the selected period's evaluation.",
    "my.ob.placeholder": "Write your objection or feedback…",
    "my.ob.send": "Send objection",
    "my.ob.statusTitle": "My objections",
    "my.ob.statusHint": "Track statuses (OPEN/REVIEWED/RESOLVED) with responses.",
    "my.ob.noEval": "Load a period result first to see objections.",
    "my.ob.none": "No objections yet.",
    "my.ob.response": "Response",
    "my.ob.needLoad": "Load your result first.",
    "my.ob.empty": "Please write a message.",
    "my.ob.created": "Objection created. ID:",
    "my.ob.createdShort": "Objection submitted.",

    // Toast titles
    "toast.success": "Success",
    "toast.error": "Error",
    "toast.downloaded": "Downloaded.",
    "toast.exportFailed": "Export failed.",
    "toast.reset": "Reset.",
    "toast.cleared": "Cleared.",
    "toast.loaded": "Loaded.",
    "toast.refreshed": "Refreshed.",
    "toast.signedIn": "Signed in.",
    "toast.filledDemo": "Filled demo credentials."
  },

  fa: {
    // App
    "app.name": "سیستم ارزیابی عملکرد پرسنل",
    "app.tagline": "شاخص‌های قابل تنظیم • عادلانه و شفاف • دارای لاگ ممیزی",
    "sidebar.title": "منو",

    // Common
    "common.menu": "منو",
    "common.theme": "تم",
    "common.lang": "زبان",
    "common.light": "روشن",
    "common.dark": "تاریک",
    "common.logout": "خروج",
    "common.role": "نقش",
    "common.user": "کاربر",
    "common.refresh": "بروزرسانی",
    "common.show": "نمایش",
    "common.exportCsv": "خروجی CSV",
    "common.create": "ایجاد",
    "common.save": "ذخیره",
    "common.close": "بستن",
    "common.submit": "ثبت",
    "common.loading": "در حال بارگذاری…",
    "common.done": "انجام شد.",
    "common.accessDenied": "عدم دسترسی (فقط HR/CEO).",
    "common.selectPeriod": "انتخاب دوره",
    "common.selectUnit": "انتخاب واحد",
    "common.selectEmployee": "انتخاب کارمند",
    "common.threshold": "آستانه",
    "common.statusFilter": "فیلتر وضعیت",
    "common.status": "وضعیت",
    "common.message": "پیام",
    "common.reset": "بازنشانی",
    "common.clear": "پاک کردن",

    // Navigation
    "nav.dashboard": "داشبورد",
    "nav.kpis": "شاخص‌ها (KPI)",
    "nav.templates": "قالب‌های KPI",
    "nav.periods": "دوره‌ها",
    "nav.evaluations": "ثبت ارزیابی",
    "nav.heatmapEmpKpi": "هیت‌مپ (فرد × KPI)",
    "nav.heatmapUnitPeriod": "هیت‌مپ (واحد × دوره)",
    "nav.unitComparison": "مقایسه واحدها",
    "nav.risk": "گزارش ریسک",
    "nav.objections": "اعتراضات",
    "nav.myResult": "نتیجه من",

    // Titles
    "title.login": "ورود",
    "title.dashboard": "داشبورد",
    "title.kpis": "مدیریت KPI",
    "title.templates": "مدیریت قالب KPI",
    "title.periods": "مدیریت دوره‌ها",
    "title.evaluations": "ثبت ارزیابی",
    "title.heatmap": "هیت‌مپ (فرد × KPI)",
    "title.unitPeriodHeatmap": "هیت‌مپ (واحد × دوره)",
    "title.unitComparison": "مقایسه واحدها",
    "title.risk": "گزارش ریسک",
    "title.objections": "رسیدگی به اعتراضات",
    "title.myResult": "نتیجه من",

    // Login
    "login.heading": "خوش آمدید",
    "login.subtitle": "برای تست سیستم از اکانت‌های نمونه استفاده کنید.",
    "login.username": "نام کاربری",
    "login.password": "رمز عبور",
    "login.signIn": "ورود",
    "login.fillDemo": "پر کردن نمونه",
    "login.demoTitle": "اکانت‌های نمونه (پسورد: ۱۲۳۴)",
    "login.demoCeo": "مدیرعامل: ceo",
    "login.demoHr": "منابع انسانی: hr",
    "login.demoMgr": "مدیر: mgr / mgr2",
    "login.demoEmp": "کارمند: emp / emp2",
    "login.teamLabel": "اعضای گروه",
    "login.teamHint": "قبل از تحویل، نام‌ها را جایگزین کنید.",

    // Dashboard
    "dash.subtitle": "نمای مدیریتی برای HR/CEO + بینش‌های سریع.",
    "dash.top.title": "برترین‌ها",
    "dash.top.hint": "نمایش برای HR/CEO",
    "dash.kpiDriven": "بر پایه KPI",
    "dash.audit.title": "لاگ ممیزی",
    "dash.audit.hint": "آخرین ۱۰۰ اقدام حساس.",
    "dash.audit.badge": "قابل ممیزی",
    "dash.trend.title": "روند واحد",
    "dash.trend.hint": "میانگین امتیاز به تفکیک دوره (HR/CEO).",
    "dash.trend.badge": "روند",
    "dash.trend.load": "بارگذاری روند",

    // KPI page
    "kpis.subtitle": "ایجاد و مدیریت شاخص‌ها (HR/CEO).",
    "kpis.create.title": "ایجاد KPI",
    "kpis.create.hint": "فقط HR/CEO",
    "kpis.fields.title": "عنوان",
    "kpis.fields.titlePh": "مثلاً: کار تیمی",
    "kpis.fields.type": "نوع",
    "kpis.fields.range": "بازه نمره (حداقل/حداکثر)",
    "kpis.type.core": "CORE (عمومی)",
    "kpis.type.job": "JOB (تخصصی)",
    "kpis.type.strategic": "STRATEGIC (سازمانی)",
    "kpis.list.title": "لیست KPI",
    "kpis.list.hint": "لیست خواندنی از پایگاه داده.",
    "kpis.table.title": "عنوان",
    "kpis.table.type": "نوع",
    "kpis.table.range": "بازه",

    // Templates
    "tpl.subtitle": "قالب‌ها وزن‌ها را برای عدالت و مقایسه‌پذیری تعیین می‌کنند (HR/CEO).",
    "tpl.create.title": "ایجاد قالب KPI",
    "tpl.create.hint": "جمع وزن‌ها باید ۱۰۰ باشد.",
    "tpl.fields.unit": "واحد (اختیاری)",
    "tpl.fields.unitPh": "مثلاً: Sales (خالی = همه واحدها)",
    "tpl.fields.job": "عنوان شغلی (اختیاری)",
    "tpl.fields.jobPh": "مثلاً: Sales Specialist (خالی = همه نقش‌ها)",
    "tpl.fields.version": "نسخه",
    "tpl.selectKpis": "انتخاب KPI و وزن",
    "tpl.btn.create": "ایجاد قالب",
    "tpl.btn.showItems": "نمایش آیتم‌ها",
    "tpl.btn.deactivate": "غیرفعال‌سازی",
    "tpl.list.title": "قالب‌های موجود",
    "tpl.list.hint": "جدیدترین‌ها اول نمایش داده می‌شوند.",
    "tpl.msg.selectOne": "حداقل یک KPI انتخاب کنید.",
    "tpl.msg.sum100": "جمع وزن‌ها باید دقیقاً ۱۰۰ باشد.",

    // Periods
    "periods.subtitle": "تعریف دوره‌های ارزیابی و بستن آن‌ها برای ممیزی (HR/CEO).",
    "periods.create.title": "ایجاد دوره ارزیابی",
    "periods.create.hint": "فقط HR/CEO",
    "periods.fields.name": "نام دوره",
    "periods.fields.namePh": "مثلاً: Q1-2026",
    "periods.fields.type": "نوع",
    "periods.fields.dates": "شروع / پایان",
    "periods.type.monthly": "ماهانه",
    "periods.type.quarterly": "فصلی",
    "periods.type.yearly": "سالانه",
    "periods.list.title": "دوره‌ها",
    "periods.list.hint": "با بستن دوره، مدیران دیگر امکان ویرایش ندارند.",
    "periods.table.name": "نام",
    "periods.table.type": "نوع",
    "periods.table.range": "بازه",
    "periods.table.status": "وضعیت",
    "periods.table.actions": "عملیات",

    // Evaluations
    "eval.subtitle": "مدیران فقط کارکنان مستقیم را با وزن‌های قالب ارزیابی می‌کنند.",
    "eval.form.title": "فرم ارزیابی عملکرد",
    "eval.form.hint": "وزن‌ها از قالب مربوطه می‌آید و نمره‌ها اعتبارسنجی می‌شوند.",
    "eval.template.title": "قالب اعمال‌شده",
    "eval.scores.title": "نمره‌های KPI",
    "eval.save": "ثبت ارزیابی",
    "eval.score": "نمره",
    "eval.evidence": "توضیح/مستند",
    "eval.evidencePh": "یادداشت اختیاری برای توجیه نمره…",

    // Heatmap
    "heatmap.subtitle": "هیت‌مپ واقعی از دیتابیس برای تحلیل (HR/CEO).",
    "heatmap.employee": "کارمند",
    "heatmap.unitJob": "واحد / شغل",
    "heatmap.legend": "راهنما",

    // Unit × Period heatmap
    "uheat.subtitle": "میانگین امتیاز هر واحد در دوره‌ها (HR/CEO).",
    "uheat.hint": "برای تحلیل روند و مقایسه واحدها استفاده کنید.",
    "uheat.unit": "واحد",

    // Unit comparison
    "ucomp.subtitle": "مقایسه میانگین واحدها با دوره قبل (HR/CEO).",
    "ucomp.current": "دوره فعلی",
    "ucomp.previous": "دوره قبل",
    "ucomp.unit": "واحد",
    "ucomp.avgCurrent": "میانگین (فعلی)",
    "ucomp.avgPrev": "میانگین (قبل)",
    "ucomp.n": "تعداد",

    // Risk
    "risk.subtitle": "کارکنان زیر آستانه (HR/CEO). با امکان خروجی.",
    "risk.none": "کارمندی زیر آستانه وجود ندارد",
    "risk.count": "تعداد",
    "risk.code": "کد",
    "risk.name": "نام",
    "risk.unit": "واحد",
    "risk.job": "شغل",
    "risk.score": "امتیاز نهایی",

    // Objections (management)
    "obj.subtitle": "OPEN → REVIEWED → RESOLVED. HR/CEO (همه) • مدیر (زیرمجموعه مستقیم).",
    "obj.all": "همه",
    "obj.none": "موردی یافت نشد.",
    "obj.message": "پیام",
    "obj.response": "پاسخ",
    "obj.responsePh": "پاسخ HR/مدیر را بنویسید…",
    "obj.markReviewed": "ثبت REVIEWED",
    "obj.markResolved": "ثبت RESOLVED",
    "obj.updated": "بروزرسانی شد.",
    "obj.resolved": "حل شد.",

    // My result
    "my.subtitle": "شفافیت: امتیاز نهایی، جزئیات و فرآیند اعتراض.",
    "my.finalScore": "امتیاز نهایی",
    "my.employee": "کارمند",
    "my.unitJob": "واحد / شغل",
    "my.period": "دوره",
    "my.formula": "فرمول",
    "my.evalId": "شناسه ارزیابی",
    "my.kpi": "KPI",
    "my.type": "نوع",
    "my.score": "نمره",
    "my.weight": "وزن",
    "my.comment": "توضیح",
    "my.ob.createTitle": "ثبت اعتراض / بازخورد",
    "my.ob.hint": "اعتراض به ارزیابی همان دوره متصل می‌شود.",
    "my.ob.placeholder": "متن اعتراض یا بازخورد را بنویسید…",
    "my.ob.send": "ارسال اعتراض",
    "my.ob.statusTitle": "اعتراضات من",
    "my.ob.statusHint": "وضعیت‌ها (OPEN/REVIEWED/RESOLVED) و پاسخ‌ها را پیگیری کنید.",
    "my.ob.noEval": "ابتدا نتیجه یک دوره را بارگذاری کنید.",
    "my.ob.none": "هنوز اعتراضی ثبت نشده است.",
    "my.ob.response": "پاسخ",
    "my.ob.needLoad": "ابتدا نتیجه را بارگذاری کنید.",
    "my.ob.empty": "لطفاً متن پیام را وارد کنید.",
    "my.ob.created": "اعتراض ثبت شد. شناسه:",
    "my.ob.createdShort": "اعتراض ارسال شد.",

    // Toast titles
    "toast.success": "موفق",
    "toast.error": "خطا",
    "toast.downloaded": "دانلود شد.",
    "toast.exportFailed": "خروجی ناموفق بود.",
    "toast.reset": "بازنشانی شد.",
    "toast.cleared": "پاک شد.",
    "toast.loaded": "بارگذاری شد.",
    "toast.refreshed": "بروزرسانی شد.",
    "toast.signedIn": "وارد شدید.",
    "toast.filledDemo": "اطلاعات نمونه وارد شد."
  }
};

export function getLang() {
  return localStorage.getItem(LS_LANG) || "en";
}

export function setLang(lang) {
  localStorage.setItem(LS_LANG, lang);
  applyLang(lang);
  applyI18n();
}

export function getTheme() {
  return localStorage.getItem(LS_THEME) || "dark";
}

export function setTheme(theme) {
  localStorage.setItem(LS_THEME, theme);
  applyTheme(theme);
  updateToggles();
}

export function t(key) {
  const lang = getLang();
  return (translations[lang] && translations[lang][key]) || translations.en[key] || key;
}

export function toast(message, type = "ok", title) {
  const toasts = document.getElementById("toasts");
  if (!toasts) return;
  const node = document.createElement("div");
  node.className = `toast ${type === "danger" ? "danger" : "ok"}`;
  node.innerHTML = `
    <div class="title">${escapeHtml(title || (type === "danger" ? t("toast.error") : t("toast.success")))}</div>
    <div class="desc">${escapeHtml(message)}</div>
  `;
  toasts.appendChild(node);
  setTimeout(() => node.remove(), 3200);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

function applyLang(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
}

function applyI18n() {
  const titleKey = document.body?.dataset?.titleKey;
  if (titleKey) document.title = t(titleKey);

  // text nodes
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });

  // placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
  });

  // html (rare)
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });

  updateToggles();
}

function ensureAuth() {
  const requires = document.body?.dataset?.requiresAuth === "1";
  const isLogin = document.body?.dataset?.page === "login";
  const hasToken = !!getToken();

  if (requires && !hasToken) {
    location.replace("./login.html");
    return false;
  }

  if (isLogin && hasToken) {
    location.replace("./dashboard.html");
    return false;
  }

  return true;
}

function navItemsForRole(role) {
  const all = [
    { id: "dashboard", href: "./dashboard.html", icon: "layout-dashboard", key: "nav.dashboard", roles: ["CEO", "HR", "MANAGER"] },
    { id: "my-result", href: "./my-result.html", icon: "user-check", key: "nav.myResult", roles: ["EMPLOYEE"] },

    { id: "evaluations", href: "./evaluations.html", icon: "clipboard-check", key: "nav.evaluations", roles: ["CEO", "HR", "MANAGER"] },

    { id: "kpis", href: "./kpis.html", icon: "sliders-horizontal", key: "nav.kpis", roles: ["CEO", "HR"] },
    { id: "templates", href: "./templates.html", icon: "layers", key: "nav.templates", roles: ["CEO", "HR"] },
    { id: "periods", href: "./periods.html", icon: "calendar-range", key: "nav.periods", roles: ["CEO", "HR"] },

    { id: "heatmap", href: "./heatmap.html", icon: "grid-3x3", key: "nav.heatmapEmpKpi", roles: ["CEO", "HR"] },
    { id: "unit-period-heatmap", href: "./unit-period-heatmap.html", icon: "grid-2x2", key: "nav.heatmapUnitPeriod", roles: ["CEO", "HR"] },
    { id: "unit-comparison", href: "./unit-comparison.html", icon: "gauge", key: "nav.unitComparison", roles: ["CEO", "HR"] },
    { id: "risk", href: "./risk.html", icon: "triangle-alert", key: "nav.risk", roles: ["CEO", "HR"] },

    { id: "objections", href: "./objections.html", icon: "message-square-warning", key: "nav.objections", roles: ["CEO", "HR", "MANAGER", "EMPLOYEE"] }
  ];

  if (!role) return [];
  return all.filter((x) => x.roles.includes(role));
}

function renderShell() {
  const header = document.getElementById("topbar");
  if (header) {
    const role = getRole();
    const user = localStorage.getItem("username");
    const hasToken = !!getToken();

    header.className = "topbar";
    header.innerHTML = `
      <div class="topbar-inner">
        <div class="brand">
          <div class="brand-logo" aria-hidden="true">
            <i data-lucide="sparkles"></i>
          </div>
          <div>
            <div class="brand-name" data-i18n="app.name">Performance Evaluation System</div>
            <div class="brand-tagline" data-i18n="app.tagline">Configurable KPIs • Fair & Transparent • Audit‑ready</div>
          </div>
        </div>

        <div class="top-actions">
          <button id="menuBtn" class="icon secondary" type="button">
            <i data-lucide="menu"></i>
          </button>

          <button id="themeBtn" class="icon ghost" type="button">
            <i data-lucide="moon"></i>
          </button>

          <button id="langBtn" class="pill" type="button">EN</button>

          ${hasToken ? `
            <span class="badge"><i data-lucide="user"></i> ${escapeHtml(user || "")}</span>
            <span class="badge"><i data-lucide="shield"></i> ${escapeHtml(role || "")}</span>
            <button id="logoutBtn" class="ghost" type="button" data-i18n="common.logout">Logout</button>
          ` : ``}
        </div>
      </div>
    `;
  }

  const layoutMode = document.body?.dataset?.layout || "app";
  const sidebar = document.getElementById("sidebar");
  const scrim = document.getElementById("sidebarScrim");
  if (layoutMode === "auth") {
    if (sidebar) sidebar.remove();
    if (scrim) scrim.remove();
    document.body.classList.remove("sidebar-open");
  } else {
    if (sidebar) {
      const role = getRole();
      const items = navItemsForRole(role);
      const active = document.body?.dataset?.page;

      sidebar.className = "sidebar";
      sidebar.innerHTML = `
        <div class="sidebar-head">
          <div class="sidebar-title" data-i18n="sidebar.title">Navigation</div>
        </div>
        <div class="sidebar-nav">
          ${items.map((it) => `
            <a class="nav-item ${it.id === active ? "active" : ""}" href="${it.href}">
              <i data-lucide="${it.icon}"></i>
              <div style="min-width:0">
                <div data-i18n="${it.key}">${escapeHtml(t(it.key))}</div>
              </div>
            </a>
          `).join("")}
        </div>
      `;
    }

    if (!document.getElementById("sidebarScrim")) {
      const s = document.createElement("div");
      s.id = "sidebarScrim";
      s.className = "sidebar-scrim";
      document.body.appendChild(s);
      s.addEventListener("click", () => document.body.classList.remove("sidebar-open"));
    }
  }

  // wire buttons
  wireTopbarButtons();
  applyI18n();

  // render icons
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

function updateToggles() {
  const theme = getTheme();
  const lang = getLang();

  const themeBtn = document.getElementById("themeBtn");
  if (themeBtn) {
    themeBtn.innerHTML = theme === "dark"
      ? `<i data-lucide="moon"></i>`
      : `<i data-lucide="sun"></i>`;
    themeBtn.title = `${t("common.theme")}: ${t(theme === "dark" ? "common.dark" : "common.light")}`;
  }

  const langBtn = document.getElementById("langBtn");
  if (langBtn) {
    langBtn.textContent = lang.toUpperCase();
    langBtn.title = `${t("common.lang")}: ${lang.toUpperCase()}`;
  }

  const menuBtn = document.getElementById("menuBtn");
  if (menuBtn) {
    menuBtn.title = t("common.menu");
  }

  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

function wireTopbarButtons() {
  const themeBtn = document.getElementById("themeBtn");
  if (themeBtn) {
    themeBtn.onclick = () => {
      const next = getTheme() === "dark" ? "light" : "dark";
      setTheme(next);
    };
  }

  const langBtn = document.getElementById("langBtn");
  if (langBtn) {
    langBtn.onclick = () => {
      const next = getLang() === "en" ? "fa" : "en";
      setLang(next);
      // For charts, pages may redraw if they want. We keep it simple.
    };
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("username");
      toast(t("common.done"));
      setTimeout(() => location.replace("./login.html"), 250);
    };
  }

  const menuBtn = document.getElementById("menuBtn");
  if (menuBtn) {
    menuBtn.onclick = () => {
      document.body.classList.toggle("sidebar-open");
    };
  }
}

function init() {
  // defaults
  applyTheme(getTheme());
  applyLang(getLang());

  if (!ensureAuth()) return;

  // Create toasts container if missing
  if (!document.getElementById("toasts")) {
    const tNode = document.createElement("div");
    tNode.id = "toasts";
    document.body.appendChild(tNode);
  }

  renderShell();
}

// Auto-init
document.addEventListener("DOMContentLoaded", init);
