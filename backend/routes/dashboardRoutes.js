const express = require('express');
const router = express.Router();
const dashboardService = require('../services/dashboardService');

// GET /api/dashboard
router.get('/', async (req, res, next) => {
  try {
    const { startDate, endDate, payrunId } = req.query;
    const metrics = await dashboardService.getDashboardMetrics({
      startDate,
      endDate,
      payrunId,
    });
    res.json(metrics);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
