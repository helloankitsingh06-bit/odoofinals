const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

// Initializes the Firebase Admin SDK (db / auth / storage). Import for the side
// effect even though index.js doesn't use the handles directly.
require('./firebase');

const { verifyToken } = require('./src/middleware/auth');
const itemRoutes = require('./routes/itemRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

/* ----------------------------- Global middleware ---------------------------- */
app.use(cors());
app.use(express.json());

/* ------------------------------- Health check ------------------------------ */
app.get('/', (req, res) => {
  res.json({ message: 'Starter template backend is running' });
});

/* --------------------------------- Routes --------------------------------- */
// Returns the authenticated caller's identity + role. Handy for the frontend
// to confirm auth works end to end.
app.get('/api/me', verifyToken, (req, res) => {
  res.json({
    uid: req.user.uid,
    email: req.user.email || null,
    role: req.user.role || 'Employee',
  });
});

// User and Auth routes
app.use('/api/users', userRoutes);

// Generic CRUD example. Copy this pattern for real domain entities.
app.use('/api/items', itemRoutes);

/* -------------------------- Centralized error handler --------------------- */
// Any route that calls next(err) lands here. Keep this last.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('❌ Error handler:', err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred on the server',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
