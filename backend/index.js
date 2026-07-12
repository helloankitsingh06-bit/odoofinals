const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables from .env
require('dotenv').config({ path: path.join(__dirname, '.env') });

const dashboardRoutes = require('./src/routes/dashboardRoutes');
const { registerAsset } = require('./src/services/assetService');
const { bookResource, cancelBooking } = require('./src/services/bookingService');
const { verifyToken, requireAssetManager } = require('./src/middleware/auth');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Base Route
app.get('/', (req, res) => {
  res.json({ message: "Welcome to the AssetFlow Backend Server!" });
});

// GET /api/me - Returns authenticated user details and role based on Firebase claims
app.get('/api/me', verifyToken, (req, res) => {
  res.json({
    uid: req.user.uid,
    email: req.user.email || null,
    role: req.user.role || 'Employee' // defaults to Employee if no custom role is set
  });
});

// Mounted Routes
app.use('/api/dashboard', dashboardRoutes);

// Assets APIs (Only AssetManagers or Admins can register assets)
app.post('/api/assets', verifyToken, requireAssetManager, async (req, res) => {
  try {
    const result = await registerAsset(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error registering asset:", error);
    res.status(500).json({ error: error.message });
  }
});

// Bookings APIs (Any verified logged-in user can book)
app.post('/api/bookings', verifyToken, async (req, res) => {
  try {
    const { assetId, startTime, endTime, bookedBy } = req.body;
    const result = await bookResource(assetId, new Date(startTime), new Date(endTime), bookedBy);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bookings/:id/cancel', verifyToken, async (req, res) => {
  try {
    await cancelBooking(req.params.id);
    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 AssetFlow Backend Server running on http://localhost:${PORT}`);
});
