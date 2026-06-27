const express = require('express');
const router = express.Router();
const {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  getCartCount
} = require('../controllers/Cart');
const { isAuthenticatedUser } = require('../middlewares/auth');

// All cart routes require authentication
router.use(isAuthenticatedUser);

// Cart routes
router.post('/cart/add', addToCart);                          // Add product to cart
router.get('/cart', getCart);                                 // Get user's cart
router.put('/cart/update', updateCartItem);                   // Update quantity
router.delete('/cart/remove/:productId', removeCartItem);    // Remove single item
router.delete('/cart/clear', clearCart);                      // Clear all items
router.get('/cart/count', getCartCount);                      // Get cart item count

module.exports = router;