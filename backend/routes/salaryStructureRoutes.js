const express = require('express');
const router = express.Router();
const salaryStructureService = require('../services/salaryStructureService');

// GET /api/salary-structures
router.get('/', async (req, res, next) => {
  try {
    const structures = await salaryStructureService.getSalaryStructures(req.query);
    res.json(structures);
  } catch (err) {
    next(err);
  }
});

// GET /api/salary-structures/:id
router.get('/:id', async (req, res, next) => {
  try {
    const populate = req.query.populate === 'true';
    const structure = await salaryStructureService.getSalaryStructureById(req.params.id, {
      populateRules: populate,
    });
    if (!structure) {
      return res.status(404).json({ message: 'Salary structure not found' });
    }
    res.json(structure);
  } catch (err) {
    next(err);
  }
});

// POST /api/salary-structures
router.post('/', async (req, res, next) => {
  try {
    const created = await salaryStructureService.createSalaryStructure(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT /api/salary-structures/:id
router.put('/:id', async (req, res, next) => {
  try {
    const updated = await salaryStructureService.updateSalaryStructure(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/salary-structures/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await salaryStructureService.deleteSalaryStructure(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Salary structure not found' });
    }
    res.json({ message: 'Salary structure deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
