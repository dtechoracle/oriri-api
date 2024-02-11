const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const authController = require('../controllers/auth.controller')

// Middleware to protect routes
router.use(authController.protect)

router.get('/all', menuController.getAllMenuItems);
router.post('/create', menuController.createMenuItem);
router.put('/edit/:id', menuController.editMenuItem);

module.exports = router;