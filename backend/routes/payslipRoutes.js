const express = require('express');
const router = express.Router();
const { db } = require('../firebase');
const { serializeTimestamps } = require('../utils/serializeTimestamps');

// GET /api/payslips/:id
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await db.collection('payslips').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Payslip not found' });
    }

    const payslip = serializeTimestamps({ id: doc.id, ...doc.data() });

    // Populate employee details if available
    if (payslip.employeeId) {
      const empDoc = await db.collection('employees').doc(payslip.employeeId).get();
      if (empDoc.exists) {
        payslip.employee = serializeTimestamps({ id: empDoc.id, ...empDoc.data() });
      }
    }

    // Populate contract details if available
    if (payslip.contractId && payslip.contractId !== 'N/A') {
      const contractDoc = await db.collection('contracts').doc(payslip.contractId).get();
      if (contractDoc.exists) {
        payslip.contract = serializeTimestamps({ id: contractDoc.id, ...contractDoc.data() });
      }
    }

    res.json(payslip);
  } catch (err) {
    next(err);
  }
});

// POST /api/payslips/:id/send
router.post('/:id/send', async (req, res, next) => {
  try {
    const doc = await db.collection('payslips').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Payslip not found' });
    }
    // Simulate sending payslip email
    res.json({ message: 'Payslip sent successfully to employee email', sentAt: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
