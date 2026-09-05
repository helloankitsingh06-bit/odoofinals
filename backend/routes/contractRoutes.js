const express = require('express');
const contractController = require('../controllers/contractController');
const { verifyToken, requireHRPayrollUser } = require('../src/middleware/auth');

const router = express.Router();

// All contract routes require an authenticated user
router.use(verifyToken);

// Contract read endpoints
router.get('/', contractController.listContracts);
router.get('/:id', contractController.getContract);

// Contract mutation endpoints restricted to HRPayrollUser (or HRPayrollManager / Admin)
router.post('/', requireHRPayrollUser, contractController.createContract);
router.put('/:id', requireHRPayrollUser, contractController.updateContract);
router.patch('/:id', requireHRPayrollUser, contractController.updateContract);
router.delete('/:id', requireHRPayrollUser, contractController.deleteContract);

module.exports = router;
