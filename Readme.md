
# AssetFlow

AssetFlow is an asset-management application with role-based access for administrators, asset managers, department heads, and employees.

## Features

- Asset, category, allocation, transfer, maintenance, and booking management
- Department and employee directory management
- Admin-managed employee invitations and roles
- Firebase Authentication with backend token validation
- Employee login access only after their email is registered by an administrator

## Requirements

- Node.js 18 or later
- Firebase project with Authentication and Firestore enabled
- MongoDB connection for the backend services that use MongoDB

## Installation

Install dependencies for both applications:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Configuration

Create `backend/.env` using your Firebase Admin credentials and database connection:

```env
PORT=5001
MONGO_URL=your_mongodb_connection_string

FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_client_email
FIREBASE_PRIVATE_KEY="your_private_key_with_escaped_newlines"

# The first system administrator's email address
ADMIN_EMAIL=admin@example.com
```

Update the Firebase client configuration in `frontend/src/lib/firebase.js` to match the same Firebase project.

## Running the application

Start the backend:

```bash
cd backend
npm start
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open the URL shown by Vite, normally `http://localhost:5173`.

## Employee and role workflow

1. Sign in using the email configured as `ADMIN_EMAIL`.
2. Open **Organization Setup** → **Employees**.
3. Add the employee's name, email, department, and system role.
4. The email and role are stored in the `employees` collection.
5. The employee signs in with the same email through Firebase Authentication.
6. The backend verifies that email exists in the employee directory before allowing access.

Roles are assigned by an administrator and cannot be selected by a user from the login screen:

- `Admin`
- `Employee`
- `AssetManager`
- `DeptHead`

For email/password login, create the user's Firebase Authentication account in Firebase. For Google sign-in, the Google account email must exactly match the email added by the administrator.

## Useful commands

```bash
# Build the frontend for production
cd frontend && npm run build

# Seed backend data, if required
cd backend && npm run seed
```
