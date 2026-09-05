const express = require('express');
const router = express.Router();
const salaryRuleService = require('../services/salaryRuleService');

// GET /api/salary-rules
router.get('/', async (req, res, next) => {
  try {
    const rules = await salaryRuleService.getSalaryRules(req.query);
    res.json(rules);
  } catch (err) {
    next(err);
  }
});

// GET /api/salary-rules/:id
router.get('/:id', async (req, res, next) => {
  try {
    const rule = await salaryRuleService.getSalaryRuleById(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Salary rule not found' });
    }
    res.json(rule);
  } catch (err) {
    next(err);
  }
});

// POST /api/salary-rules
router.post('/', async (req, res, next) => {
  try {
    const created = await salaryRuleService.createSalaryRule(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT /api/salary-rules/:id
router.put('/:id', async (req, res, next) => {
  try {
    const updated = await salaryRuleService.updateSalaryRule(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/salary-rules/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await salaryRuleService.deleteSalaryRule(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Salary rule not found' });
    }
    res.json({ message: 'Salary rule deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
