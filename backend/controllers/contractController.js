const contractService = require('../services/contractService');

/**
 * Contract Controller: Thin HTTP layer forwarding to contractService
 */

async function listContracts(req, res, next) {
  try {
    const contracts = await contractService.getContracts(req.query);
    res.json(contracts);
  } catch (err) {
    next(err);
  }
}

async function createContract(req, res, next) {
  try {
    const contract = await contractService.createContract(req.body);
    res.status(201).json(contract);
  } catch (err) {
    if (err.name === 'ValidationError' || err.conflictingContractId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: err.message,
        conflictingContractId: err.conflictingContractId || null,
        conflictingDates: err.conflictingDates || null,
      });
    }
    next(err);
  }
}

async function getContract(req, res, next) {
  try {
    const contract = await contractService.getContractById(req.params.id);
    if (!contract) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: `Contract with id "${req.params.id}" not found`,
      });
    }
    res.json(contract);
  } catch (err) {
    next(err);
  }
}

async function updateContract(req, res, next) {
  try {
    const contract = await contractService.updateContract(req.params.id, req.body);
    if (!contract) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: `Contract with id "${req.params.id}" not found`,
      });
    }
    res.json(contract);
  } catch (err) {
    if (err.name === 'ValidationError' || err.conflictingContractId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: err.message,
        conflictingContractId: err.conflictingContractId || null,
        conflictingDates: err.conflictingDates || null,
      });
    }
    next(err);
  }
}

async function deleteContract(req, res, next) {
  try {
    const deleted = await contractService.deleteContract(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        error: 'NotFoundError',
        message: `Contract with id "${req.params.id}" not found`,
      });
    }
    res.json({ message: 'Contract deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listContracts,
  createContract,
  getContract,
  updateContract,
  deleteContract,
};
