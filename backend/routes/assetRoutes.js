const express = require('express');
const assetController = require('../controllers/assetController');

const router = express.Router();

router.get('/', assetController.listAssets);
router.post('/', assetController.createAsset);
router.get('/:id', assetController.getAssetDetail);
router.get('/:id/history', assetController.getAssetHistory);
router.patch('/:id/status', assetController.updateAssetStatus);
router.patch('/:id', assetController.updateAsset);
router.delete('/:id', assetController.deleteAsset);

module.exports = router;
