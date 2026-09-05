const express = require('express');
const itemController = require('../controllers/itemController');
const { verifyToken } = require('../src/middleware/auth');

const router = express.Router();

// Every route below requires a valid Bearer token (real Firebase ID token,
// or a mock-<Role> token when mock auth is allowed — see src/middleware/auth.js).
router.use(verifyToken);

router.get('/', itemController.listItems);
router.post('/', itemController.createItem);
router.get('/:id', itemController.getItem);
router.patch('/:id', itemController.updateItem);
router.delete('/:id', itemController.deleteItem);

module.exports = router;
