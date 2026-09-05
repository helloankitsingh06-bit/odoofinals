# Hackathon Starter Template

A stripped-down, domain-agnostic full-stack starter you can clone at the start of
a 24-hour hackathon and build on immediately.

- **Frontend:** React 19 + Vite + Tailwind, React Router, Firebase Web SDK
- **Backend:** Node + Express 5, Firebase Admin SDK (Firestore / Auth / Storage)
- **Auth:** Firebase ID tokens verified server-side, with a mock-token mode for
  local development and testing
- **Example:** one generic `items` CRUD slice spanning the whole stack

> ⚠️ **This template ships with NO Firebase project and NO credentials.**
> Every team (and ideally every person on the team) must create and plug in their
> own Firebase project before it will run. See
> [§3 Bring your own Firebase project](#3-bring-your-own-firebase-project).

---

## 1. What this template includes

### Backend (`backend/`)

| Path | Purpose |
| --- | --- |
| `firebase.js` | Firebase Admin SDK init. Exports `{ admin, db, auth, storage }`. Loads `serviceAccountKey.json`, falls back to `GOOGLE_APPLICATION_CREDENTIALS`, and exits with setup instructions if neither is present. |
| `serviceAccountKey.example.json` | Shape reference for the private key you download from the Firebase console. Not a real key. |
| `index.js` | Express app: CORS, JSON body parsing, `GET /`, `GET /api/me`, `/api/items` mount, centralized error handler. |
| `src/middleware/auth.js` | `verifyToken`, `requireAdmin`, `requireAssetManager`, `requireDeptHead`. Real Firebase token verification; `mock-<Role>` tokens for dev (rejected in production unless `ALLOW_MOCK_AUTH=true`). |
| `utils/serializeTimestamps.js` | Converts Firestore timestamp shapes (`{_seconds,_nanoseconds}`, `{seconds}`, `Timestamp.toDate()`, native `Date`) to ISO strings. Recurring bug class — solved once. |
| `services/itemService.js` | Generic Firestore CRUD on the `items` collection: `createItem`, `getItems`, `getItemById`, `updateItem`, `deleteItem`. |
| `controllers/itemController.js` | Thin HTTP handlers that call `itemService` and forward errors via `next(err)`. |
| `routes/itemRoutes.js` | `GET / · POST / · GET /:id · PATCH /:id · DELETE /:id`, all behind `verifyToken`. |
| `.env.example` | Copy to `.env`. |

### Frontend (`frontend/`)

| Path | Purpose |
| --- | --- |
| `src/lib/firebase.js` | Firebase Web client init from `VITE_FIREBASE_*` env vars. Exports `{ app, auth, db, googleProvider }`. |
| `src/hooks/useAuth.jsx` | `AuthProvider` + `useAuth()`. Email/password login, sign up, Google popup, logout, dev role switch. Falls back to a local mock user if Firebase is unreachable. |
| `src/components/Layout.jsx` | Auth-gated shell (redirects to `/login`), sidebar + header, `<Outlet/>`. |
| `src/components/Sidebar.jsx` | Nav with role gating (`adminOnly`) and a dev role picker. Two placeholder items. |
| `src/components/AdminRoute.jsx` | Route guard that redirects non-Admins. |
| `src/pages/Login.jsx` | Generic Sign In / Sign Up screen with email, Google, and a dev role picker. |
| `src/lib/itemService.js` | The `request()` pattern: env-based `VITE_API_BASE_URL`, Bearer-token header, throws `Error` with `.status`/`.payload` on non-2xx. CRUD methods for `items`. |
| `src/pages/Items.jsx` | List + create + toggle-status + delete page. End-to-end proof: auth → API → Firestore → UI. |
| `src/App.jsx` | Router: `/login`, gated `/items`, admin-only `/admin`, redirects. |
| `.env.example` | Copy to `.env`. |

---

## 2. Adapting it for a new problem statement

The `items` slice is a template. To model a real entity (say, `tasks`):

**Backend**

1. `cp backend/services/itemService.js backend/services/taskService.js`
   - Change `COLLECTION = 'tasks'`.
   - Change `WRITABLE_FIELDS` to your real fields, and adjust validation in `createItem`.
2. `cp backend/controllers/itemController.js backend/controllers/taskController.js`
   - Point the `require` at `taskService`.
3. `cp backend/routes/itemRoutes.js backend/routes/taskRoutes.js`
   - Require `taskController`. Add role guards where needed, e.g.
     `router.post('/', requireAssetManager, taskController.createTask)`.
4. In `backend/index.js`: `const taskRoutes = require('./routes/taskRoutes');`
   and `app.use('/api/tasks', taskRoutes);`.

**Frontend**

5. `cp frontend/src/lib/itemService.js frontend/src/lib/taskService.js`
   - Rename the export and swap `/items` paths for `/tasks`; adjust the `create`/`update` payload shape.
6. `cp frontend/src/pages/Items.jsx frontend/src/pages/Tasks.jsx`
   - Import `taskService`, rename state, adjust the form fields and list rendering.
7. In `frontend/src/App.jsx`: add `<Route path="/tasks" element={<Tasks />} />`.
8. In `frontend/src/components/Sidebar.jsx`: add `{ name: 'Tasks', path: '/tasks' }`.

Keep `serializeTimestamps()` in the loop for every service that returns Firestore
documents with date fields.

Roles available out of the box: `Admin`, `AssetManager`, `DeptHead`, `Employee`.
Rename or extend them in `backend/src/middleware/auth.js` (and the pickers in
`Login.jsx` / `Sidebar.jsx`).

---

## 3. Bring your own Firebase project

The template is deliberately not wired to any Firebase project. Do this once per
team — or once each, if you want isolated data while developing.

### 3.1 Create the project

**Console (easiest):** <https://console.firebase.google.com/> → **Add project** →
name it (e.g. `our-team-hackathon`) → you can disable Google Analytics.

**Or CLI:**

```bash
npx firebase-tools login
npx firebase-tools projects:create our-team-hackathon --display-name "Our Team Hackathon"
```

### 3.2 Enable the services

In the console for your new project:

1. **Build → Firestore Database → Create database.** Start in **test mode** for
   the hackathon (open rules, 30-day expiry). Tighten
   `firestore.rules` before anything goes public.
2. **Build → Authentication → Get started →** enable **Email/Password** and
   **Google** under *Sign-in method*.

### 3.3 Frontend config (Web app)

1. Console → **Project settings** (gear icon) → **General** → **Your apps** →
   **Add app → Web** (`</>`). Register it (nickname only; skip Hosting).
2. Copy the `firebaseConfig` values into `frontend/.env`:

   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

   These values are meant to be shipped in the browser bundle — access is
   controlled by Firebase Security Rules, not by hiding them.

### 3.4 Backend credentials (Admin SDK)

1. Console → **Project settings** → **Service accounts** →
   **Generate new private key** → confirm. A JSON file downloads.
2. Save it as **`backend/serviceAccountKey.json`**. It is gitignored — **never
   commit it.** `backend/serviceAccountKey.example.json` shows the expected shape.
3. Alternatively, put the file anywhere and set
   `GOOGLE_APPLICATION_CREDENTIALS=/abs/path/to/key.json` in `backend/.env`.

`backend/firebase.js` tries `serviceAccountKey.json` first, then
`GOOGLE_APPLICATION_CREDENTIALS`, and exits with instructions if neither is found.

### 3.5 Point the two halves at the same project

The `project_id` in `backend/serviceAccountKey.json` **must match**
`VITE_FIREBASE_PROJECT_ID` in `frontend/.env`. If they differ, the frontend signs
users into one project and the backend rejects their tokens as issued by another.

---

## 4. Running locally

**Prerequisites:** Node 18+ and a Firebase project set up as in §3.

### Backend

```bash
cd backend
npm install
cp .env.example .env          # then edit ADMIN_EMAIL
# place backend/serviceAccountKey.json (see §3.4)

npm start                     # http://localhost:5001
# or: npm run dev             # auto-restart on file changes
```

Sanity check: `curl http://localhost:5001/` → `{"message":"Starter template backend is running"}`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env          # then fill VITE_FIREBASE_* (see §3.3)

npm run dev                   # http://localhost:5173
```

### Mock auth (no Firebase user needed — but still needs a Firebase project)

With `NODE_ENV` unset (development), the backend accepts `Authorization: Bearer
mock-<Role>` tokens, so you can exercise protected routes without signing in. The
frontend automatically sends `mock-<Role>` when there is no real Firebase
session, using the role chosen on the login screen / dev picker.

```bash
curl -H "Authorization: Bearer mock-Admin"    http://localhost:5001/api/me
curl -H "Authorization: Bearer mock-Employee" http://localhost:5001/api/items
```

Mock tokens still hit real Firestore through the Admin SDK, so
`serviceAccountKey.json` must be in place. In production
(`NODE_ENV=production`) mock tokens are rejected unless `ALLOW_MOCK_AUTH=true`.

---

## 5. Security reminders

- **Never commit `backend/serviceAccountKey.json`** — it is a private key.
  Gitignored by default; keep it that way. Only `serviceAccountKey.example.json`
  (fake) is committed.
- **Never commit `.env` files** — commit only `.env.example`.
- **Use your own Firebase project.** Don't share one person's service-account key
  around the team by pasting it into chat or committing it — each person can
  generate their own key for the same project, or you can share the *frontend*
  config (which is not secret) and one key kept out of git.
- The `VITE_FIREBASE_*` values are public by design; write real
  `firestore.rules` before exposing the app.
- Mock auth is a development convenience. Confirm `ALLOW_MOCK_AUTH` is not `true`
  in any deployed environment.
- If a key ever lands in git history: revoke it in
  **Project settings → Service accounts** and generate a new one. Rotating the
  key is the only real fix — deleting the file in a later commit does not remove
  it from history.
