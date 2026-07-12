const express = require('express');
const router = express.Router();
const { getDashboardKPIs, getRecentActivity } = require('../services/dashboardService');

// GET /api/dashboard/kpis
router.get('/kpis', async (req, res) => {
  try {
    const kpis = await getDashboardKPIs();
    res.json(kpis);
  } catch (error) {
    console.error("Error fetching KPIs:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/activities
router.get('/activities', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    const activities = await getRecentActivity(limit);
    res.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
