// backend/routes/Order.js
const express = require('express');
const router = express.Router();
const {
  checkout,
  soloCheckout,
  getUserOrders,
  getOrderDetails,
  cancelOrder
} = require('../controllers/Order');
const { isAuthenticatedUser } = require('../middlewares/auth');

// ── Order Routes ──
router.post('/checkout', isAuthenticatedUser, checkout);
router.post('/checkout/solo', isAuthenticatedUser, soloCheckout);
router.get('/orders', isAuthenticatedUser, getUserOrders);
router.get('/orders/:orderId', isAuthenticatedUser, getOrderDetails);
router.put('/orders/:orderId/cancel', isAuthenticatedUser, cancelOrder);

module.exports = router;