const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables from .env
require('dotenv').config({ path: path.join(__dirname, '.env') });

const dashboardRoutes = require('./src/routes/dashboardRoutes');
const { registerAsset } = require('./src/services/assetService');
const { bookResource, cancelBooking } = require('./src/services/bookingService');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Base Route
app.get('/', (req, res) => {
  res.json({ message: "Welcome to the AssetFlow Backend Server!" });
});

// Mounted Routes
app.use('/api/dashboard', dashboardRoutes);

// Assets APIs
app.post('/api/assets', async (req, res) => {
  try {
    const result = await registerAsset(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error registering asset:", error);
    res.status(500).json({ error: error.message });
  }
});

// Bookings APIs
app.post('/api/bookings', async (req, res) => {
  try {
    const { assetId, startTime, endTime, bookedBy } = req.body;
    const result = await bookResource(assetId, new Date(startTime), new Date(endTime), bookedBy);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bookings/:id/cancel', async (req, res) => {
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
