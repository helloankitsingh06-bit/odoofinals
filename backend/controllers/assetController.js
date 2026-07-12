const assetService = require('../services/assetService');

async function listAssets(req, res, next) {
  try {
    const result = await assetService.getAssets(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function createAsset(req, res, next) {
  try {
    const asset = await assetService.createAsset(req.body);
    res.status(201).json(asset);
  } catch (err) {
    next(err);
  }
}

async function getAssetDetail(req, res, next) {
  try {
    const asset = await assetService.getAssetById(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    return res.json(asset);
  } catch (err) {
    return next(err);
  }
}

async function getAssetHistory(req, res, next) {
  try {
    const history = await assetService.getAssetHistory(req.params.id);
    res.json(history);
  } catch (err) {
    next(err);
  }
}

async function updateAsset(req, res, next) {
  try {
    const asset = await assetService.updateAsset(req.params.id, req.body);
    res.json(asset);
  } catch (err) {
    next(err);
  }
}

async function updateAssetStatus(req, res, next) {
  try {
    const result = await assetService.transitionAssetStatus(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function deleteAsset(req, res, next) {
  try {
    const asset = await assetService.softDeleteAsset(req.params.id);
    res.json(asset);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAssets,
  createAsset,
  getAssetDetail,
  getAssetHistory,
  updateAsset,
  updateAssetStatus,
  deleteAsset
};
