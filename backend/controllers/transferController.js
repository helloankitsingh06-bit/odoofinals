const allocationService = require('../services/allocationService');

async function listTransfers(req, res, next) {
  try {
    const result = await allocationService.listTransferRequests(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function createTransfer(req, res, next) {
  try {
    const transfer = await allocationService.createTransferRequest(req.body, req.user);
    res.status(201).json(transfer);
  } catch (err) {
    next(err);
  }
}

async function approveTransfer(req, res, next) {
  try {
    const result = await allocationService.approveTransferRequest(req.params.id, req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function rejectTransfer(req, res, next) {
  try {
    const result = await allocationService.rejectTransferRequest(req.params.id, req.body, req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listTransfers,
  createTransfer,
  approveTransfer,
  rejectTransfer
};
