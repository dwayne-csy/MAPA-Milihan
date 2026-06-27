// backend/controllers/Order.js
const Order = require('../models/Order');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// ========== CHECKOUT FROM CART ==========
exports.checkout = async (req, res) => {
  try {
    console.log('🛒 Checkout request received');
    const userId = req.user.id;

    // Fetch user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has address
    if (!user.address || !user.address.city || !user.address.barangay) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile address before checking out.'
      });
    }

    // Fetch user's cart with populated products
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || !cart.items.length) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty'
      });
    }

    // Validate stock and prepare order items
    const orderItems = [];
    let itemsPrice = 0;

    for (const item of cart.items) {
      const product = item.product;
      
      // Check if product exists and is available
      if (!product || product.isDeleted || !product.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Product "${product?.name || 'Unknown'}" is no longer available`
        });
      }

      // Check stock
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for "${product.name}". Available: ${product.quantity} ${product.unit}`
        });
      }

      // Add to order items
      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        unit: product.unit,
        image: product.images?.[0]?.url || '',
        farmer: product.farmer,
        farmerName: product.farmerName
      });

      itemsPrice += product.price * item.quantity;
    }

    // Calculate totals
    const TAX_RATE = 0.12;
    const SHIPPING_PRICE = 50;

    const taxPrice = itemsPrice * TAX_RATE;
    const totalPrice = itemsPrice + taxPrice + SHIPPING_PRICE;

    // Create shipping info from user address
    const shippingInfo = {
      address: `${user.address.street || ''}, ${user.address.barangay || ''}, ${user.address.city || ''}`,
      city: user.address.city || '',
      barangay: user.address.barangay || '',
      street: user.address.street || '',
      zipcode: user.address.zipcode || '',
      phoneNo: user.contact || '',
      country: 'Philippines'
    };

    // Create order
    const order = await Order.create({
      user: userId,
      orderItems,
      shippingInfo,
      itemsPrice,
      taxPrice,
      shippingPrice: SHIPPING_PRICE,
      totalPrice,
      paymentStatus: 'Pending',
      orderStatus: 'Processing',
      paymentMethod: 'Cash on Delivery'
    });

    // Decrease stock for each product
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (product) {
        product.quantity = Math.max(product.quantity - item.quantity, 0);
        await product.save();
        console.log(`✅ Stock updated for "${product.name}": ${product.quantity} remaining`);
      }
    }

    // Clear user's cart
    cart.items = [];
    await cart.save();
    console.log('🗑️ Cart cleared after checkout');

    // Populate order with user and product details
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email contact')
      .populate('orderItems.product', 'name price unit images');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: populatedOrder
    });

  } catch (error) {
    console.error('❌ CHECKOUT ERROR:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process checkout'
    });
  }
};

// ========== SOLO CHECKOUT (Buy Now) ==========
exports.soloCheckout = async (req, res) => {
  try {
    console.log('🛒 Solo checkout request received');
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Fetch user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has address
    if (!user.address || !user.address.city || !user.address.barangay) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile address before checking out.'
      });
    }

    // Fetch product
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

    // Check stock
    if (product.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Not enough stock. Available: ${product.quantity} ${product.unit}`
      });
    }

    // Create order item
    const orderItems = [{
      product: product._id,
      name: product.name,
      quantity: quantity,
      price: product.price,
      unit: product.unit,
      image: product.images?.[0]?.url || '',
      farmer: product.farmer,
      farmerName: product.farmerName
    }];

    // Calculate totals
    const TAX_RATE = 0.12;
    const SHIPPING_PRICE = 50;

    const itemsPrice = product.price * quantity;
    const taxPrice = itemsPrice * TAX_RATE;
    const totalPrice = itemsPrice + taxPrice + SHIPPING_PRICE;

    // Create shipping info from user address
    const shippingInfo = {
      address: `${user.address.street || ''}, ${user.address.barangay || ''}, ${user.address.city || ''}`,
      city: user.address.city || '',
      barangay: user.address.barangay || '',
      street: user.address.street || '',
      zipcode: user.address.zipcode || '',
      phoneNo: user.contact || '',
      country: 'Philippines'
    };

    // Create order
    const order = await Order.create({
      user: userId,
      orderItems,
      shippingInfo,
      itemsPrice,
      taxPrice,
      shippingPrice: SHIPPING_PRICE,
      totalPrice,
      paymentStatus: 'Pending',
      orderStatus: 'Processing',
      paymentMethod: 'Cash on Delivery'
    });

    // Decrease stock
    product.quantity = Math.max(product.quantity - quantity, 0);
    await product.save();
    console.log(`✅ Stock updated for "${product.name}": ${product.quantity} remaining`);

    // Populate order with user and product details
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email contact')
      .populate('orderItems.product', 'name price unit images');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: populatedOrder
    });

  } catch (error) {
    console.error('❌ SOLO CHECKOUT ERROR:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process checkout'
    });
  }
};

// ========== GET USER ORDERS ==========
exports.getUserOrders = async (req, res) => {
  try {
    console.log('📋 Get user orders request received');
    const userId = req.user.id;

    const orders = await Order.find({ user: userId })
      .populate('orderItems.product', 'name price unit images')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (error) {
    console.error('❌ GET USER ORDERS ERROR:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch orders'
    });
  }
};

// ========== GET SINGLE ORDER ==========
exports.getOrderDetails = async (req, res) => {
  try {
    console.log('📋 Get order details request received');
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, user: userId })
      .populate('user', 'name email contact address')
      .populate('orderItems.product', 'name price unit images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      order
    });

  } catch (error) {
    console.error('❌ GET ORDER DETAILS ERROR:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch order details'
    });
  }
};

// ========== CANCEL ORDER ==========
exports.cancelOrder = async (req, res) => {
  try {
    console.log('❌ Cancel order request received');
    const userId = req.user.id;
    const { orderId } = req.params;

    // Find the order
    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // ✅ ONLY ALLOW CANCELLATION IF STATUS IS "Processing"
    if (order.orderStatus !== 'Processing') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: "${order.orderStatus}". Only "Processing" orders can be cancelled.`
      });
    }

    // Restore product quantities
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.quantity = product.quantity + item.quantity;
        await product.save();
        console.log(`✅ Stock restored for "${product.name}": ${product.quantity} now available`);
      }
    }

    // Update order status
    order.orderStatus = 'Cancelled';
    order.paymentStatus = 'Cancelled';
    order.cancelledAt = new Date();

    await order.save();

    // Populate order for response
    const cancelledOrder = await Order.findById(order._id)
      .populate('user', 'name email contact')
      .populate('orderItems.product', 'name price unit images');

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully!',
      order: cancelledOrder
    });

  } catch (error) {
    console.error('❌ CANCEL ORDER ERROR:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel order'
    });
  }
};