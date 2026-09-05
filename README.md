# PeoplePay360 — Next-Gen Full HR & Payroll Platform

> Built for the 24-Hour Hackathon • Non-Firebase Relational Architecture (Node.js + Express + Prisma + PostgreSQL/SQLite + React + Vite)

---

## 🌟 Architectural Highlights

1. **Authoritative Relational Data Model**:
   - Strictly enforced PostgreSQL/Prisma relational schema with referential integrity.
   - Self-referential manager hierarchies, explicit sequence ordering in `SalaryStructureRule.position`, and child day schedules.
2. **Deterministic Salary Computation Engine (Pure & Tested)**:
   - Evaluates rules strictly in sequence via `SalaryStructureRule.position`.
   - Maintains an in-memory `computedValues` map enforcing valid forward references.
   - Constrained mathematical AST evaluator (safe parser, zero `eval`).
   - Attendance-driven `workedDays` calculation with non-blocking audit warnings.
3. **Strict Role-Based Access Control (RBAC)**:
   - 5 distinct user roles: `Employee`, `HRManager`, `HRPayrollUser`, `HRPayrollManager`, `Admin`.
   - Table-driven route guard middleware.
4. **Live Time-Off Allocation Deduction Flow**:
   - Approving time-off requests automatically deducts duration from matching allocations in real time.
5. **PDF Generation & Transactional Email API Dispatch**:
   - High-fidelity payslip PDFs generated server-side with `pdfkit`.
   - Real Resend transactional email integration with audit fallback log.
6. **Executive Dashboard Analytics**:
   - Real-time SQL aggregations across contracts, attendance logs, and paid payslips.

---

## 🚀 Quick Start Guide

### 1. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts    # Seeds full realistic demo database
npm run dev               # Starts backend at http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev               # Starts frontend at http://localhost:3000
```

### 3. Run Automated Tests
```bash
cd backend
npm run test:engine       # 7 isolated computation engine tests
npm run test:rbac         # 11 table-driven RBAC matrix tests
npm test                  # Runs full vitest test suite
```

---

## 🔑 Pre-Seeded Hackathon Evaluator Credentials

| Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Employee** | `employee@peoplepay360.com` | `Password123!` | Self-service profile, punch clock, view leave balance, submit requests |
| **HR Manager** | `hrmanager@peoplepay360.com` | `Password123!` | Full CRUD on employees, contracts, schedules, approve/refuse leave |
| **Payroll User** | `payrolluser@peoplepay360.com` | `Password123!` | Create & compute payruns, validate warnings; read-only rules |
| **Payroll Manager** | `payrollmgr@peoplepay360.com` | `Password123!` | Full payroll lifecycle, mark payruns as Paid, manage salary structures |
| **Administrator** | `admin@peoplepay360.com` | `Password123!` | Full unrestricted access to all modules and user management |

*(Note: The login page includes 1-click quick role login cards for immediate evaluator switching)*

---

## 🎬 5-Minute Live Demo Pitch Script

### Flow A: End-to-End Payroll Lifecycle & Delivery
1. Log in as **Sophia Chen (Payroll Manager)** (`payrollmgr@peoplepay360.com`).
2. Click **Payruns & Payslips** → **Launch Payrun Wizard**.
3. **Step 1 (Staged)**: Select *Engineering & Product Structure* and the current month period.
4. Click **Next: Filter Eligible Employees** → Review the list of eligible employees with active contracts.
5. Click **Confirm & Create Draft Payrun** → The payrun is created in `Draft` status.
6. Click **Run Engine Compute** → Watch the engine calculate every rule line (`BASIC`, `HRA`, `GROSS`, `PF`, `NET`) and worked days from attendance.
7. Click **Validate Warnings** → The system checks for contract expiry, missing checkouts, or formula anomalies and transitions to `Validated`.
8. Click **Mark as Paid** → The payrun and all child payslips atomically transition to `Paid`.
9. Click **Rule Lines** on any employee to view the itemized breakdown, or click **Download Official PDF** to see the generated PDF payslip!
10. Click **Dispatch Emails & PDFs** → Triggers transactional email delivery via Resend.

### Flow B: Leave Allocation & Live Balance Deduction
1. Click **Quick Role Switch: Employee** (or login as `employee@peoplepay360.com`).
2. Navigate to **Time Off & Leave** → Observe initial **Paid Annual Leave** balance (e.g. 18 days remaining).
3. Click **Request Time Off** → Submit a 3-day request for "Annual Vacation".
4. Switch to **HR Manager** (`hrmanager@peoplepay360.com`).
5. In **Time Off & Leave**, locate the pending request and click **Approve (Deduct)**.
6. Observe the employee's remaining allocation balance automatically decrement from 18 to 15 days in real-time.

---

## 🔮 Future Roadmap (Next Steps)

1. **AI-Powered Payslip Explainability**: LLM copilot summarizing payroll line changes, tax implications, and overtime bonuses for employees.
2. **Payroll Anomaly & Fraud Detection**: Machine learning model flagging statistical outliers in bonus awards, overtime hours, and retroactive contract edits.
3. **What-If Compensation Simulator**: Financial modeling workbench for HR leadership to simulate company-wide compensation adjustments and predict annual runway impact.
4. **Multi-Jurisdiction Statutory Tax Tables**: Automated compliance rules engine supporting localized tax brackets (US W-2, UK PAYE, India TDS).
