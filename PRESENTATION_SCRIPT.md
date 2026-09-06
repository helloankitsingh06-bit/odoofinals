# 🎬 PeoplePay360 - Video Presentation Script
### **Enterprise HR & Payroll Management Platform**
⏱️ **Target Duration:** ~7:30 – 8:00 Minutes  
🗣️ **Target Speaking Pace:** ~130–140 words per minute  

---

## 📊 Presentation Timeline Overview

```
0:00 ─── 0:50 │ Segment 1: Project Overview & Problem Vision
0:50 ─── 1:40 │ Segment 2: Architecture & Security Foundations
1:40 ─── 2:40 │ Segment 3: User Roles & Role-Based Access Control (RBAC)
2:40 ─── 3:40 │ Segment 4: Employee Directory & Organizational Hierarchy
3:40 ─── 4:30 │ Segment 5: Employment Contracts & Salary Structures
4:30 ─── 5:30 │ Segment 6: Real-Time Attendance & Compliance Activity
5:30 ─── 6:20 │ Segment 7: Time-Off Management & Unpaid Leave Integration
6:20 ─── 7:20 │ Segment 8: Pure Payroll Computation Engine & Payrun Wizard
7:20 ─── 8:00 │ Segment 9: Automated Testing, Verification & Conclusion
```

---

## 🎙️ Detailed Segment-by-Segment Script & Visual Guide

---

### **[0:00 – 0:50] Segment 1: Project Overview & Vision**

**Visual / Action on Screen:**
- Start on the **PeoplePay360** login screen showcasing the glassmorphism UI, dual dark/light theme toggle, vibrant gradients, and branding.

**Voiceover / Spoken Script:**
> *"Hello everyone, and welcome to the presentation of **PeoplePay360** — a modern, enterprise-grade HR and Payroll Management Platform built to streamline the entire employee lifecycle from onboarding to automated payroll settlement.*
>
> *Traditional payroll systems are often fragmented, error-prone, and painful to navigate. PeoplePay360 solves this by bridging real-time attendance tracking, time-off allocations, and dynamic sequential salary calculations into a unified, glassmorphic single-page application.*
>
> *Today, I will walk you through our platform architecture, our strict role-based access control, our employee directory with over 100 seeded records, our attendance compliance audits, and our pure payroll engine in action."*

---

### **[0:50 – 1:40] Segment 2: Architecture & Security Foundations**

**Visual / Action on Screen:**
- Show a brief architecture overview highlighting: React 18, TypeScript, Tailwind CSS, Node.js/Express, Prisma ORM, and Vitest suite (34 passing automated tests).

**Voiceover / Spoken Script:**
> *"Before we dive into the workflows, let’s look at the underlying architecture.*
>
> *On the frontend, PeoplePay360 is powered by **React 18** and **TypeScript**, styled with tailored design tokens, dark and light mode glassmorphism, and interactive **Recharts** visualizations.*
>
> *On the backend, we have an **Express and TypeScript** API utilizing **Prisma ORM** for robust relational modeling across employees, contracts, time-off requests, and payslips.*
>
> *Security is fundamental: we implement stateless **JWT authentication**, **bcrypt** password hashing, and zero-trust backend authorization guards. Critical payroll calculations are powered by an isolated, deterministic safe math evaluator with zero reliance on unsafe JavaScript `eval`."*

---

### **[1:40 – 2:40] Segment 3: User Roles & Role-Based Access Control (RBAC)**

**Visual / Action on Screen:**
1. Show the dedicated **Sign-In page** with Quick Role Access cards.
2. Click **Employee** (`kevin@gmail.com`) &rarr; Show that navigation is strictly restricted to *My Profile*, *Attendance*, and *Time Off*.
3. Log out and switch to **HR Payroll Manager** (`ankit@gmail.com`) &rarr; Show full management menu (*Dashboard*, *Employees*, *Contracts*, *Structures*, *Payruns*).

**Voiceover / Spoken Script:**
> *"PeoplePay360 features 5 distinct user roles, ensuring strict segregation of duties as mandated by corporate governance:*
>
> *1. **System Administrator** (our CEO, Krish D R), with full administrative privileges.*
> *2. **HR Manager** (Diya Ann Dennis), who manages employee onboarding, organizational structures, and leave allocations.*
> *3. **HR Payroll Manager** (Ankit Singh), who creates salary structures and executes company-wide payroll runs.*
> *4. **HR Payroll User** (Srikar), who reviews attendance logs and verifies draft payslips.*
> *5. And **Employee** (such as Kevin or Anna), who access a dedicated self-service portal.*
>
> *Notice how logging in as Kevin immediately clamps the interface to self-service items only. Management endpoints return strict 403 Forbidden errors if accessed unauthorized. Switching to our Payroll Manager unlocks the full operational suite."*

---

### **[2:40 – 3:40] Segment 4: Employee Directory & Organizational Hierarchy**

**Visual / Action on Screen:**
1. Navigate to the **Employees** tab.
2. Demonstrate real-time search (search for *"Anna"*, *"Developer"*, or *"Finance"*).
3. Filter by department (*Engineering*, *Human Resources*, *Sales & Marketing*).
4. Click an employee card to open the detailed drawer/modal showing their reporting manager name alongside manager ID.

**Voiceover / Spoken Script:**
> *"Let's navigate to the **Employee Directory**.*
>
> *The database is populated with over 100 realistic employee records distributed across 8 core departments — including Executive Leadership, Engineering, Product & Design, Finance, HR, Sales, Support, and Legal.*
>
> *Each employee profile maintains clear organizational hierarchy. For example, our Software Developers report to our Engineering Leads, who in turn report to executive leadership. Notice that the database and UI store and display both the **Manager ID** and the **Manager Name** directly for instant organizational clarity.*
>
> *Admins and HR managers can edit employee details, reassign departments, update work schedules, or create new team members with instant validation."*

---

### **[3:40 – 4:30] Segment 5: Employment Contracts & Salary Structures**

**Visual / Action on Screen:**
1. Navigate to **Contracts** page.
2. Click **+ New Contract** &rarr; demonstrate the **searchable employee picker** (typing employee name to filter instantly).
3. Show base wage input (formatted in ₹ INR), contract start/end dates, and assigned salary structure.

**Voiceover / Spoken Script:**
> *"Every active employee is backed by an active **Employment Contract**.*
>
> *When creating or modifying a contract, instead of scrolling through a long standard dropdown, we engineered a dedicated **Searchable Employee Picker**. HR managers can simply type any name to select the employee instantly.*
>
> *Contracts define the base monthly wage, contract validity period, and link directly to one of our tailored **Salary Structures** — such as the Engineering & Product Structure, Executive Structure, or Support Structure.*
>
> *Our backend ensures contract integrity by verifying that an employee cannot have overlapping active contracts during the same payroll period."*

---

### **[4:30 – 5:30] Segment 6: Real-Time Attendance & Compliance Activity**

**Visual / Action on Screen:**
1. Navigate to **Attendance** page.
2. Show the **Punch In / Punch Out** widget.
3. Show the **Attendance Log Activity** dashboard widget with categorized totals (*Present: 6,255, Overtime: 547, Late: 284, Missing Check-Outs: 196, Manual Edits: 155*).
4. Filter the log table by status: select *Overtime* or *MissingCheckout*.

**Voiceover / Spoken Script:**
> *"Next, let's explore **Attendance Tracking**.*
>
> *Employees can punch in and punch out in real time. The system automatically computes worked hours and flags punch categories dynamically:*
>
> *• Check-ins after 9:30 AM are automatically marked as **Late Arrivals**.*
> *• Shifts exceeding standard working hours calculate exact **Overtime Hours**.*
> *• Check-ins left open at end-of-day trigger **Missing Check-Out** warnings for HR audits.*
>
> *With over 7,200 attendance records spanning June to September 2026, the Attendance Dashboard aggregates compliance health scores in real time, alerting payroll managers to discrepancies before payroll is processed."*

---

### **[5:30 – 6:20] Segment 7: Time-Off Management & Unpaid Leave Integration**

**Visual / Action on Screen:**
1. Navigate to **Time Off** page.
2. Show Leave Allocations cards (20 Paid Annual Days, 10 Sick Days).
3. Show the Time Off Requests table with status badges (*Approved*, *Pending*, *Refused*).
4. Highlight an approved **Unpaid Leave** request.

**Voiceover / Spoken Script:**
> *"Managing leave balances is seamless in PeoplePay360.*
>
> *We support multiple leave categories: Paid Annual Leave, Sick Leave, Other, and **Unpaid Leave**.*
>
> *Employees can submit requests with date ranges and reasons. Managers review, approve, or refuse requests in real time, with leave balances updating automatically.*
>
> *Crucially, our time-off system integrates directly with payroll: any approved **Unpaid Leave** days during a pay period are automatically captured and passed into the salary engine to deduct the exact pro-rated amount from the employee's salary."*

---

### **[6:20 – 7:20] Segment 8: Pure Payroll Computation Engine & Payrun Wizard**

**Visual / Action on Screen:**
1. Navigate to **Salary Structures** &rarr; show rules sequence (Basic &rarr; HRA &rarr; Conveyance &rarr; Overtime &rarr; Gross &rarr; PF &rarr; Health Ins &rarr; Unpaid Leave Deduction &rarr; Net).
2. Navigate to **Payroll Runs (Payruns)**.
3. Click **+ New Payroll Run** &rarr; select *August 2026* &rarr; select *Engineering & Product Structure* &rarr; Click **Generate Payrun**.
4. Click into the newly computed payrun &rarr; show payslip breakdown lines for Kevin / Krish D R with exact Overtime and Unpaid Leave deductions.
5. Click **Validate** &rarr; **Mark as Paid**.

**Voiceover / Spoken Script:**
> *"Now, let's look at the core of the platform: our **Sequential Payroll Computation Engine**.*
>
> *In the Salary Structures interface, administrators can create and re-order formula and percentage rules. Our validator performs static dry-run checks to prevent forward-references — guaranteeing that `GROSS` and allowances compute before deductions, and `NET` computes last.*
>
> *Let’s run live payroll for August 2026 using the **Payrun Wizard**:*
>
> *1. We select our structure and period dates, then click **Generate**.*
> *2. In milliseconds, the pure engine processes all contracts, aggregates worked days, computes overtime hours, deducts unpaid leaves, and generates itemized payslips.*
> *3. Clicking into any payslip shows the full calculation ledger — Basic wage, HRA, Overtime pay, Provident Fund, Health Insurance, and final Net Salary.*
> *4. Once reviewed, the Payroll Manager validates the batch and marks it as **Paid**."*

---

### **[7:20 – 8:00] Segment 9: Automated Testing, Verification & Conclusion**

**Visual / Action on Screen:**
1. Show terminal output of `vitest run` (34/34 tests passing).
2. Return to the main Dashboard showing live payroll metrics and department salary distribution charts.
3. End on title card with team/project credits.

**Voiceover / Spoken Script:**
> *"To ensure maximum reliability, PeoplePay360 comes with a comprehensive automated test suite covering RBAC permissions, salary structure dry-run validations, leave deduction math, and contract boundary conditions — with 34 out of 34 unit and integration tests passing green.*
>
> *In summary, PeoplePay360 delivers an elegant, high-performance, and compliant HR & Payroll solution ready for enterprise deployment.*
>
> *Thank you for your time, and we look forward to your questions and feedback!"*

---

## 🎯 Quick Demo Credentials Cheat Sheet

| Role | Email | Password | Access Highlights |
| :--- | :--- | :--- | :--- |
| **CEO / Admin** | `krish@gmail.com` | `Password123!` | Full system access, all departments |
| **Finance Head / Payroll Manager** | `ankit@gmail.com` | `Password123!` | Salary structures, contracts, payrun wizard |
| **HR Head / HR Manager** | `diya@gmail.com` | `Password123!` | Employee directory, leave allocations |
| **HR Assistant / Payroll User** | `srikar@gmail.com` | `Password123!` | Attendance reviews, payslip audit |
| **Developer / Employee** | `kevin@gmail.com` | `Password123!` | Self-service profile, punch in/out, leave requests |
