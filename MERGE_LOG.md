# PeoplePay360 — Integration & Merge Log (Person 1 Scope)

## Branch: `feature/p1-auth-employee-contract`
**Integration Lead**: Person 1 (Auth + Employee + Contract + Schedule)

---

## 1. Deliverables Implemented & Status

### Deliverable 1: Auth & RBAC
- **Status**: Completed & Tested
- **Key Changes**:
  - Replaced legacy template mock roles with the 5 locked schema roles: `['Employee', 'HRManager', 'HRPayrollUser', 'HRPayrollManager', 'Admin']`.
  - Self-signup strictly sets `role: "Employee"` server-side. Client-provided role inputs on signup are ignored.
  - Implemented `PATCH /api/users/:id/role` (Admin-only) with validation of the 5 allowed roles (rejects anything else with 400). Updates Firestore `users` doc and sets Firebase Auth custom claims.
  - Added `backend/routes/userRoutes.js`, `backend/controllers/userController.js`, and `backend/services/userService.js`.
  - Added role guards: `requireAdmin`, `requireHRManager`, `requireHRPayrollUser`, `requireHRPayrollManager`, `requireHRorPayroll`.

### Deliverable 2: Employee Master
- **Status**: Completed & Tested
- **Key Changes**:
  - Implemented `backend/services/employeeService.js`, `controllers/employeeController.js`, `routes/employeeRoutes.js`.
  - Schema strictly conforms to: `{ id, name, department, managerId, jobPosition, workingScheduleId, status: "Active"|"Inactive", createdAt }`.
  - `status` validated strictly to `"Active" | "Inactive"` (case-sensitive).
  - No `email` field stored directly on `employees` (linked via `users.employeeId`).
  - Supports query filters: `department`, `managerId`, `status`, `jobPosition`, free-text `search` (on name), and pagination (`page`, `limit`).
  - Implemented soft deletion (`DELETE /api/employees/:id` sets `status: "Inactive"`).

### Deliverable 3: Contract Management (Highest Priority Logic)
- **Status**: Completed & Tested (All 7 mandatory test cases pass)
- **Key Changes**:
  - Implemented `backend/services/contractService.js`, `controllers/contractController.js`, `routes/contractRoutes.js`.
  - Schema strictly conforms to: `{ id, employeeId, startDate, endDate, wage, salaryStructureId, department, jobPosition, status: "Active"|"Expired"|"Draft", createdAt }`.
  - `status` has exactly 3 valid values: `"Draft" | "Active" | "Expired"` (no "Cancelled").
  - `endDate` is nullable (treated as open-ended).
  - **Transaction-based Active Overlap Validation**:
    - Wrapped inside `db.runTransaction()` to prevent race conditions.
    - Inclusive date range overlap: `startA <= effectiveEndB && startB <= effectiveEndA` (where null end date is `Infinity`).
    - Validates that no two active contracts exist for the same `employeeId` covering overlapping dates.
    - Rejects conflicts with HTTP 400 and structured JSON body `{ error: 'ValidationError', message, conflictingContractId, conflictingDates }`.
  - Implemented computed `isActive: boolean` on list/get responses.

### Deliverable 4: Working Schedules Setup
- **Status**: Completed & Tested
- **Key Changes**:
  - Implemented `backend/services/workingScheduleService.js`, `controllers/workingScheduleController.js`, `routes/workingScheduleRoutes.js`.
  - Schema: `{ id, name, type: "Fixed"|"Flexible", weeklyPattern: [{ day, startTime, endTime, breakMins }], totalWeeklyHours (computed), createdAt }`.
  - Field is strictly `breakMins` (not `breakMinutes`).
  - `totalWeeklyHours` is strictly server-computed from the pattern on create and update (`(shiftDuration - breakMins) / 60` for each working day) and stored on the document.

### Deliverable 5: Frontend Views & Components
- **Status**: Completed & Built
- **Key Changes**:
  - **Employee Master (`/employees`)**:
    - Toggle between Department Kanban view and Table list view.
    - Search by name/position, filter by department and status.
    - Create / Edit employee modal with searchable manager and schedule picker.
    - Smart-buttons: "Contracts (n)" (shows live count badge), "Attendance", "Time Off" linking to respective routes.
  - **Contracts Management (`/contracts` & `/employees/:id/contracts`)**:
    - Highlights Active contracts with distinct emerald glow badges.
    - Filter by employee and status.
    - Create / Edit contract modal with open-ended checkbox.
    - Prominent error banner displaying conflicting contract ID and active dates when overlap occurs.
  - **Working Schedules (`/schedules`)**:
    - Card grid showing schedules with computed weekly hours.
    - 7-day pattern builder UI with working toggles, start/end times, and break minutes.
    - Live client-side calculation of `totalWeeklyHours` as user adjusts inputs.
  - **User Management (`/admin/users`)**:
    - Admin-only console to view registered users and assign/promote roles.
  - **Navigation & Layout**:
    - Dark glassmorphism theme with emerald accents, sidebar navigation with role gating, and dev role switcher.

---

## 2. Automated Test Suite Results

All 24 automated tests pass via `npm test` in `backend/`:

| Test Suite | Tests | Result |
|---|---|---|
| `authAndRbac.test.js` | 4 tests | ✅ PASS |
| `employeeService.test.js` | 7 tests | ✅ PASS |
| `contractOverlap.test.js` (Mandatory 7 Cases) | 7 tests | ✅ PASS |
| `workingScheduleService.test.js` | 6 tests | ✅ PASS |
| **Total** | **24 tests** | **✅ ALL PASS** |

### Mandatory Overlap Test Verification Details:
1. `Create contract A (Active, Jan 1–Jun 30)` -> ✅ Succeeded.
2. `Create contract B (Active, Apr 1–Sep 30)` -> ✅ Failed with 400 ValidationError (conflicting contract A).
3. `Create contract C (Active, Jul 1–Dec 31)` -> ✅ Succeeded (adjacent to A, non-overlapping).
4. `Create contract D (Draft, Apr 1–Sep 30)` -> ✅ Succeeded (Draft contracts never conflict).
5. `Update contract D's status to Active` -> ✅ Failed with 400 ValidationError (overlaps A and C).
6. `Create contract E (Active, open-ended, Nov 1)` then `contract F (Active, Dec 1)` -> ✅ Failed with 400 ValidationError (open-ended treated as ongoing).
7. `Near-simultaneous create requests for overlapping Active ranges` -> ✅ Exactly 1 succeeded, 1 rejected with 400 (transaction concurrency safe).

---

## 3. Schema Agreement & Tie-Breaker Reference for P2 & P3

- `users.role`: `"Employee" | "HRManager" | "HRPayrollUser" | "HRPayrollManager" | "Admin"`
- `employees.status`: `"Active" | "Inactive"`
- `contracts.status`: `"Draft" | "Active" | "Expired"`
- `workingSchedules.type`: `"Fixed" | "Flexible"`
- `workingSchedules.weeklyPattern[].breakMins`: integer minutes
- All date fields: ISO `YYYY-MM-DD` string format.
