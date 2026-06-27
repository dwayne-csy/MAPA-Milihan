const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, isFarmer } = require('../middlewares/auth');
const {
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder,
    getOrderStats
} = require('../controllers/ManageOrder');


router.get('/stats', isAuthenticatedUser, isFarmer, getOrderStats);

router.get('/', isAuthenticatedUser, isFarmer, getAllOrders);

router.get('/:id', isAuthenticatedUser, isFarmer, getOrderById);
router.put('/:id/status', isAuthenticatedUser, isFarmer, updateOrderStatus);
router.delete('/:id', isAuthenticatedUser, isFarmer, deleteOrder);

module.exports = router;