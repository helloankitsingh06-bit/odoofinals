const express = require('express');
const categoryController = require('../controllers/categoryController');

const router = express.Router();

router.get('/', categoryController.listCategories);
router.post('/', categoryController.createCategory);

module.exports = router;
