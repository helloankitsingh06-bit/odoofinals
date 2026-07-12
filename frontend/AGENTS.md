# AssetFlow — Frontend A
Role: Frontend A. 8-hour hackathon build. React (Vite) + Tailwind.
Firebase functions are owned by Backend A/B — always import and call their functions, never reimplement backend/auth/data logic on the frontend. If a needed backend function doesn't exist yet, stub it clearly in src/lib or src/hooks with a comment `// TODO: replace with real Backend A/B export`.

Screens, build in this exact order:
1. Shared Layout/Sidebar — role-based menu (Admin sees Org Setup, others don't). Frontend B depends on this component's props — keep them stable and simple.
2. Organization Setup (Admin only) — 3 tabs: Departments, Categories, Employee Directory (promote button).
3. Login/Signup — signup creates Employee only, no role picker, forgot-password stub, no empty submits.
4. Dashboard — KPI cards, red overdue-returns section, quick action buttons.
5. Activity Log — reads activityLogs, most recent first.

Rules:
- Clean, minimal, uncluttered UI — this is meant to demo "clean ERP architecture" to judges.
- Every form must be validated, no empty submits.
- Never write backend/business logic — only call imported functions.
- After building each screen, open it in the browser and verify it renders with no console errors before considering it done.

## Update — No Hardcoded Data (hard rule)
Every dropdown, list, table, and KPI number on screen must come from a live Firestore query at runtime — never a hardcoded JS array/object in component code.
Banned: const departments = ["Engineering", "Facilities"]
Required: query via a service function, e.g. orgService.listEmployees(), orgService.listDepartments(), assetService.listCategories(), assetService.listAssets()
Exception: a seedData.js script may write initial data INTO Firestore once for prototyping — that's the only place static arrays are allowed, and it must never be imported by component code.
Applies to: category picker, employee picker, department picker, asset picker dropdowns, all tables, and Dashboard KPI cards (must be computed via count queries against Firestore, not typed placeholder numbers).

## Update — Activity Log screen
Needs filter toggle buttons above the feed: [All] [Alerts] [Approvals] [Bookings]. Filter client-side by mapping each activityLogs.actionType value into one of these 4 buckets (define the mapping explicitly in code, don't guess silently).

## Update — Dashboard screen
Add a separate "Recent Activity" mini-feed component (not a reused Activity Log component) showing the top 3 items via Backend B's getRecentActivity(3). Format each row as: "<assetName> - <action> to <personName> - <deptName>", e.g. "Laptop AF-0114 - allocated to Priya shah - IT dept".

## Update — Org Setup
Confirmed as originally scoped: single page, 3 tabs (Departments / Categories / Employee), table view with status badges. No changes.

## Update — Additional Screens (Audit, Reports, Notifications)
Unassigned in original scope, now owned by Frontend A. Build in this order: Audit, Reports, Notifications. Same rules apply: no hardcoded data, every list/table/number from a stub async service call (empty/zero for now, // TODO Firestore comment), consistent styling with the established design system (asset-green accents, h-10 rounded-md inputs/buttons, px-2.5 py-1 rounded-md font-mono badges, gap-6/p-6 spacing scale, hidden scrollbar).

