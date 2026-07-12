const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

// Load environment variables from .env
require('dotenv').config({ path: path.join(__dirname, '.env') });

const dashboardRoutes = require('./src/routes/dashboardRoutes');
const { registerAsset } = require('./src/services/assetService');
const { bookResource, cancelBooking } = require('./src/services/bookingService');
const { verifyToken, requireAssetManager } = require('./src/middleware/auth');
const assetRoutes = require('./routes/assetRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const allocationRoutes = require('./routes/allocationRoutes');
const transferRoutes = require('./routes/transferRoutes');
const { runOverdueCheck } = require('./jobs/overdueAllocationCheck');

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
    role: req.user.role || 'Employee'
  });
});

app.use('/api/assets', assetRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/transfers', transferRoutes);

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
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ MongoDB connected');

    app.listen(PORT, () => {
      console.log(`🚀 AssetFlow Backend Server running on http://localhost:${PORT}`);
    });

    setInterval(async () => {
      try {
        await runOverdueCheck();
      } catch (err) {
        console.error('Overdue allocation check failed', err.message);
      }
    }, 15 * 60 * 1000);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

startServer();
