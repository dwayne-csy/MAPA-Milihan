const Cart = require('../models/Cart');
const Product = require('../models/Product');

// ========== ADD TO CART ==========
exports.addToCart = async (req, res) => {
  try {
    console.log('🛒 Add to cart request received');
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Check if product exists and is available
    const product = await Product.findOne({ 
      _id: productId, 
      isDeleted: false,
      isAvailable: true
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unavailable'
      });
    }

    // Check if product has enough stock
    if (product.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.quantity} ${product.unit} available`
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // Create new cart
      cart = await Cart.create({
        user: userId,
        items: [{ product: productId, quantity }]
      });
      console.log('✅ New cart created for user:', userId);
    } else {
      // Check if product already in cart
      const existingItemIndex = cart.items.findIndex(
        item => item.product.toString() === productId
      );

      if (existingItemIndex > -1) {
        // Update quantity if product exists
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        
        // Check if new quantity exceeds available stock
        if (newQuantity > product.quantity) {
          return res.status(400).json({
            success: false,
            message: `Only ${product.quantity} ${product.unit} available. You already have ${cart.items[existingItemIndex].quantity} in cart.`
          });
        }
        
        cart.items[existingItemIndex].quantity = newQuantity;
      } else {
        // Add new item
        cart.items.push({ product: productId, quantity });
      }

      await cart.save();
      console.log('✅ Cart updated for user:', userId);
    }

    // Populate product details for response
    const populatedCart = await cart.populate({
      path: 'items.product',
      select: 'name price images unit quantity isAvailable farmer farmerName farmerAvatar farmerAddress category description'
    });

    // Calculate total items and price
    const totalItems = populatedCart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = populatedCart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    res.status(200).json({
      success: true,
      message: 'Product added to cart successfully',
      cart: {
        items: populatedCart.items,
        totalItems,
        totalPrice
      }
    });

  } catch (error) {
    console.error('❌ ADD TO CART ERROR:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add product to cart'
    });
  }
};

// ========== GET CART ==========
exports.getCart = async (req, res) => {
  try {
    console.log('🛒 Get cart request received');
    const userId = req.user.id;

    let cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      select: 'name price images unit quantity isAvailable farmer farmerName farmerAvatar farmerAddress category description'
    });

    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: {
          items: [],
          totalItems: 0,
          totalPrice: 0
        }
      });
    }

    // Filter out unavailable products
    const validItems = cart.items.filter(item => 
      item.product && item.product.isAvailable !== false
    );

    // If some items were filtered out, update the cart
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    // Calculate totals
    const totalItems = validItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = validItems.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    // Format response with all product data
    const formattedItems = validItems.map(item => ({
      ...item.toObject(),
      product: {
        ...item.product.toObject(),
        unit: item.product.unit || 'pc',
        farmerName: item.product.farmerName || 'Unknown Farmer',
        images: item.product.images || []
      }
    }));

    res.status(200).json({
      success: true,
      cart: {
        items: formattedItems,
        totalItems,
        totalPrice
      }
    });

  } catch (error) {
    console.error('❌ GET CART ERROR:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch cart'
    });
  }
};

// ========== UPDATE CART ITEM QUANTITY ==========
exports.updateCartItem = async (req, res) => {
  try {
    console.log('🔄 Update cart item request received');
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    if (quantity === undefined || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const product = await Product.findOne({ 
      _id: productId, 
      isDeleted: false,
      isAvailable: true
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unavailable'
      });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.quantity} ${product.unit} available`
      });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in cart'
      });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    const populatedCart = await cart.populate({
      path: 'items.product',
      select: 'name price images unit quantity isAvailable farmer farmerName farmerAvatar farmerAddress category description'
    });

    const totalItems = populatedCart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = populatedCart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    res.status(200).json({
      success: true,
      message: 'Cart updated successfully',
      cart: {
        items: populatedCart.items,
        totalItems,
        totalPrice
      }
    });

  } catch (error) {
    console.error('❌ UPDATE CART ITEM ERROR:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update cart item'
    });
  }
};

// ========== REMOVE FROM CART ==========
exports.removeCartItem = async (req, res) => {
  try {
    console.log('🗑️ Remove from cart request received');
    const userId = req.user.id;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );

    await cart.save();

    const populatedCart = await cart.populate({
      path: 'items.product',
      select: 'name price images unit quantity isAvailable farmer farmerName farmerAvatar farmerAddress category description'
    });

    const totalItems = populatedCart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = populatedCart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    res.status(200).json({
      success: true,
      message: 'Product removed from cart',
      cart: {
        items: populatedCart.items,
        totalItems,
        totalPrice
      }
    });

  } catch (error) {
    console.error('❌ REMOVE FROM CART ERROR:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove product from cart'
    });
  }
};

// ========== CLEAR CART ==========
exports.clearCart = async (req, res) => {
  try {
    console.log('🧹 Clear cart request received');
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: 'Cart is already empty',
        cart: {
          items: [],
          totalItems: 0,
          totalPrice: 0
        }
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      cart: {
        items: [],
        totalItems: 0,
        totalPrice: 0
      }
    });

  } catch (error) {
    console.error('❌ CLEAR CART ERROR:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to clear cart'
    });
  }
};

// ========== GET CART COUNT ==========
exports.getCartCount = async (req, res) => {
  try {
    console.log('📊 Get cart count request received');
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(200).json({
        success: true,
        count: 0
      });
    }

    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    res.status(200).json({
      success: true,
      count: totalItems
    });

  } catch (error) {
    console.error('❌ GET CART COUNT ERROR:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get cart count'
    });
  }
};