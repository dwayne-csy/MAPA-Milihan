const express = require('express');
const router = express.Router();
const upload = require('../utils/Multer');
const { isAuthenticatedUser, isFarmer, isUser } = require('../middlewares/auth');
const {
    createProduct,
    getProducts,
    getProduct,
    getFarmerProducts,
    updateProduct,
    deleteProduct,
    getProductsByLocation
} = require('../controllers/Product');

// ========== PUBLIC / USER ROUTES ==========
router.get('/', getProducts);
router.get('/nearby', getProductsByLocation);
router.get('/:id', getProduct);

// ========== FARMER ROUTES ==========
router.post('/create', isAuthenticatedUser, isFarmer, upload.array('images', 5), createProduct);
router.get('/farmer/products', isAuthenticatedUser, isFarmer, getFarmerProducts);
router.put('/:id', isAuthenticatedUser, isFarmer, upload.array('images', 5), updateProduct);
router.delete('/:id', isAuthenticatedUser, isFarmer, deleteProduct);

module.exports = router;