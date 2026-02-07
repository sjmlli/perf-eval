# Performance Evaluation System (KPIs قابل تنظیم) — نسخه صنعتی/امتیازی

این پروژه یک نمونه **واقعاً اجراشدنی** برای «سیستم ارزیابی عملکرد پرسنل با شاخص‌های قابل تنظیم (KPI)» است که علاوه بر نیازهای دانشگاهی، چند قابلیت امتیازی/صنعتی هم دارد:

## امکانات

### هسته سیستم
- مدیریت **KPI** (ایجاد/ویرایش، دامنه نمره 0..100)
- تعریف **Template KPI** برای واحد/سمت (وزن‌ها از Template می‌آیند)  
  - **قانون صنعتی:** مجموع وزن‌ها باید **دقیقاً 100** باشد
- تعریف **دوره ارزیابی** (ماهانه/فصلی/سالانه، OPEN/CLOSED)
- ثبت **ارزیابی** برای یک کارمند در یک دوره (Unique: employee+period)
- مشاهده نتیجه برای کارمند (شفافیت + محاسبه نهایی)

### امتیازی/صنعتی
- **Authentication + Role-based Authorization** (CEO / HR / MANAGER / EMPLOYEE)
- **Audit Log** (ثبت رویدادهای مهم مانند ساخت KPI، ساخت Template، ثبت ارزیابی، رسیدگی به اعتراض)
- **Workflow اعتراضات**: `OPEN -> REVIEWED -> RESOLVED` + ثبت پاسخ مدیر/HR
- گزارش‌ها + **Export CSV**:
  - Top Performers (JSON + CSV)
  - Heatmap واقعی (Employee × KPI) (JSON + CSV)
  - Heatmap واقعی (Unit × Period) (JSON + CSV)
  - Unit Comparison (دوره منتخب در برابر دوره قبل) (JSON + CSV)
  - Risk Report (افراد زیر آستانه) (JSON + CSV)
  - Audit Log CSV
  - Objections CSV

## تکنولوژی‌ها
- Backend: Node.js + Express
- Database: SQLite (better-sqlite3)
- Frontend: HTML/CSS/JS
- Chart: Chart.js (در داشبورد)

## اجرای پروژه

### 1) Backend
```bash
cd server
npm install
npm run initdb
npm run dev
```
- API روی آدرس `http://localhost:3001` بالا می‌آید.

### 2) Frontend
برای اینکه CORS / file-origin مشکل ندهد، بهتر است UI را با یک static server اجرا کنید:

```bash
cd client
python -m http.server 5173
```
سپس:
- `http://localhost:5173/login.html`

## اکانت‌های آماده (Seed)
رمز همه: `1234`
- CEO: `ceo`
- HR: `hr`
- Manager: `mgr`
- Employee: `emp`
- Manager (Support): `mgr2`
- Employee (Support): `emp2`

Seed شامل چند دوره + چند ارزیابی + یک اعتراض نمونه است تا داشبوردها خالی نباشند.

## صفحات UI
- `login.html`
- `dashboard.html`
- `kpis.html`
- `templates.html`
- `periods.html`
- `evaluations.html`
- `my-result.html`
- `heatmap.html` (Employee×KPI)
- `unit-period-heatmap.html` (Unit×Period)
- `unit-comparison.html`
- `risk.html`
- `objections.html`

## نکته
این پروژه برای کاربرد دانشگاهی + امتیازی آماده است، ولی برای محیط واقعی بهتر است:
- SECRET را از ENV بخوانید
- Password policy و reset اضافه شود
- Pagination + filtering برای گزارش‌ها و audit
- Migration و versioning دیتابیس

