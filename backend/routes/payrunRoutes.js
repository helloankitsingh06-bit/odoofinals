const express = require('express');
const router = express.Router();
const payrunService = require('../services/payrunService');

// GET /api/payruns/eligible-employees
router.get('/eligible-employees', async (req, res, next) => {
  try {
    const { salaryStructureId, startDate, endDate } = req.query;
    const eligible = await payrunService.getEligibleEmployeesForPayrun({
      salaryStructureId,
      period: { startDate, endDate },
    });
    res.json(eligible);
  } catch (err) {
    next(err);
  }
});

// GET /api/payruns
router.get('/', async (req, res, next) => {
  try {
    const payruns = await payrunService.getPayruns(req.query);
    res.json(payruns);
  } catch (err) {
    next(err);
  }
});

// GET /api/payruns/:id
router.get('/:id', async (req, res, next) => {
  try {
    const payrun = await payrunService.getPayrunById(req.params.id);
    if (!payrun) {
      return res.status(404).json({ message: 'Payrun not found' });
    }
    res.json(payrun);
  } catch (err) {
    next(err);
  }
});

// GET /api/payruns/:id/payslips
router.get('/:id/payslips', async (req, res, next) => {
  try {
    const payslips = await payrunService.getPayslipsByPayrunId(req.params.id);
    res.json(payslips);
  } catch (err) {
    next(err);
  }
});

// POST /api/payruns
router.post('/', async (req, res, next) => {
  try {
    const payrun = await payrunService.createPayrun(req.body);
    res.status(201).json(payrun);
  } catch (err) {
    next(err);
  }
});

// POST /api/payruns/:id/compute
router.post('/:id/compute', async (req, res, next) => {
  try {
    const computed = await payrunService.computePayrun(req.params.id);
    res.json(computed);
  } catch (err) {
    next(err);
  }
});

// POST /api/payruns/:id/validate
router.post('/:id/validate', async (req, res, next) => {
  try {
    const validated = await payrunService.validatePayrun(req.params.id);
    res.json(validated);
  } catch (err) {
    next(err);
  }
});

// POST /api/payruns/:id/mark-paid
router.post('/:id/mark-paid', async (req, res, next) => {
  try {
    const authUser = req.user || { userRole: req.headers['x-mock-role'] || 'HRPayrollManager' };
    const paid = await payrunService.markPayrunPaid(req.params.id, authUser);
    res.json(paid);
  } catch (err) {
    next(err);
  }
});

// POST /api/payruns/:id/reopen
router.post('/:id/reopen', async (req, res, next) => {
  try {
    const reopened = await payrunService.reopenPayrun(req.params.id);
    res.json(reopened);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/payruns/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await payrunService.deletePayrun(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Payrun not found' });
    }
    res.json({ message: 'Payrun deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
