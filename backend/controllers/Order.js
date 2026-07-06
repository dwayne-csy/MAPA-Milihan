// backend/controllers/Order.js
const Order = require('../models/Order');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// ========== CHECKOUT FROM CART ==========
exports.checkout = async (req, res) => {
  try {
    console.log('🛒 Checkout request received');
    console.log('📦 Request body:', req.body);
    const userId = req.user.id;
    const { 
      paymentMethod = 'Cash on Delivery', 
      address: providedAddress,
      shippingDistance = 5,
      shippingCost = 150
    } = req.body;

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
      
      if (!product || product.isDeleted || !product.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Product "${product?.name || 'Unknown'}" is no longer available`
        });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for "${product.name}". Available: ${product.quantity} ${product.unit}`
        });
      }

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

    // Calculate totals - Use shipping cost from frontend
    const shippingPrice = shippingCost || 50;
    const totalPrice = itemsPrice + shippingPrice;

    // Handle wallet payment
    let paymentStatus = 'Pending';
    let paymentDetails = {};

    if (paymentMethod === 'Wallet') {
      // Check if user has sufficient balance
      if (user.walletBalance < totalPrice) {
        return res.status(400).json({
          success: false,
          message: `Insufficient wallet balance. Available: ₱${user.walletBalance.toFixed(2)}, Required: ₱${totalPrice.toFixed(2)}`
        });
      }

      // Deduct from wallet
      const previousBalance = user.walletBalance;
      await user.deductWalletBalance(totalPrice);
      
      paymentStatus = 'Paid';
      paymentDetails = {
        paymentMethod: 'Wallet',
        walletTransactionId: `WALLET-${Date.now()}`,
        walletAmountUsed: totalPrice,
        previousBalance: previousBalance,
        newBalance: user.walletBalance,
        paymentDate: new Date()
      };
    }

    // Create shipping info from user address or provided address
    let shippingInfo;
    if (providedAddress && providedAddress.city && providedAddress.barangay) {
      shippingInfo = {
        address: `${providedAddress.street || ''}, ${providedAddress.barangay || ''}, ${providedAddress.city || ''}`,
        city: providedAddress.city || '',
        barangay: providedAddress.barangay || '',
        street: providedAddress.street || '',
        zipcode: providedAddress.zipcode || '',
        phoneNo: user.contact || '',
        country: 'Philippines',
        shippingDistance: shippingDistance || 0,
        shippingCost: shippingPrice
      };
    } else {
      shippingInfo = {
        address: `${user.address.street || ''}, ${user.address.barangay || ''}, ${user.address.city || ''}`,
        city: user.address.city || '',
        barangay: user.address.barangay || '',
        street: user.address.street || '',
        zipcode: user.address.zipcode || '',
        phoneNo: user.contact || '',
        country: 'Philippines',
        shippingDistance: shippingDistance || 0,
        shippingCost: shippingPrice
      };
    }

    // Create order
    const order = await Order.create({
      user: userId,
      orderItems,
      shippingInfo,
      itemsPrice,
      taxPrice: 0,
      shippingPrice: shippingPrice,
      totalPrice,
      paymentStatus,
      paymentDetails,
      orderStatus: 'Processing',
      paymentMethod: paymentMethod === 'Wallet' ? 'Wallet' : 'Cash on Delivery',
      shippingDistance: shippingDistance || 0
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
      .populate('user', 'name email contact walletBalance')
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
    console.log('📦 Request body:', req.body);
    const userId = req.user.id;
    const { 
      productId, 
      quantity = 1, 
      paymentMethod = 'Cash on Delivery', 
      address: providedAddress,
      shippingDistance = 5,
      shippingCost = 150
    } = req.body;

    // Validate required fields
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

    // Calculate totals - Use shipping cost from frontend
    const shippingPrice = shippingCost || 50;
    const itemsPrice = product.price * quantity;
    const totalPrice = itemsPrice + shippingPrice;

    // Handle wallet payment
    let paymentStatus = 'Pending';
    let paymentDetails = {};

    if (paymentMethod === 'Wallet') {
      // Check if user has sufficient balance
      if (user.walletBalance < totalPrice) {
        return res.status(400).json({
          success: false,
          message: `Insufficient wallet balance. Available: ₱${user.walletBalance.toFixed(2)}, Required: ₱${totalPrice.toFixed(2)}`
        });
      }

      // Deduct from wallet
      const previousBalance = user.walletBalance;
      await user.deductWalletBalance(totalPrice);
      
      paymentStatus = 'Paid';
      paymentDetails = {
        paymentMethod: 'Wallet',
        walletTransactionId: `WALLET-${Date.now()}`,
        walletAmountUsed: totalPrice,
        previousBalance: previousBalance,
        newBalance: user.walletBalance,
        paymentDate: new Date()
      };
    }

    // Create shipping info from user address or provided address
    let shippingInfo;
    if (providedAddress && providedAddress.city && providedAddress.barangay) {
      console.log('📦 Using provided address:', providedAddress);
      shippingInfo = {
        address: `${providedAddress.street || ''}, ${providedAddress.barangay || ''}, ${providedAddress.city || ''}`,
        city: providedAddress.city || '',
        barangay: providedAddress.barangay || '',
        street: providedAddress.street || '',
        zipcode: providedAddress.zipcode || '',
        phoneNo: user.contact || '',
        country: 'Philippines',
        shippingDistance: shippingDistance || 0,
        shippingCost: shippingPrice
      };
    } else {
      console.log('📦 Using user profile address:', user.address);
      shippingInfo = {
        address: `${user.address.street || ''}, ${user.address.barangay || ''}, ${user.address.city || ''}`,
        city: user.address.city || '',
        barangay: user.address.barangay || '',
        street: user.address.street || '',
        zipcode: user.address.zipcode || '',
        phoneNo: user.contact || '',
        country: 'Philippines',
        shippingDistance: shippingDistance || 0,
        shippingCost: shippingPrice
      };
    }

    // Create order
    const order = await Order.create({
      user: userId,
      orderItems,
      shippingInfo,
      itemsPrice,
      taxPrice: 0,
      shippingPrice: shippingPrice,
      totalPrice,
      paymentStatus,
      paymentDetails,
      orderStatus: 'Processing',
      paymentMethod: paymentMethod === 'Wallet' ? 'Wallet' : 'Cash on Delivery',
      shippingDistance: shippingDistance || 0
    });

    // Decrease stock
    product.quantity = Math.max(product.quantity - quantity, 0);
    await product.save();
    console.log(`✅ Stock updated for "${product.name}": ${product.quantity} remaining`);

    // Populate order with user and product details
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email contact walletBalance')
      .populate('orderItems.product', 'name price unit images');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: populatedOrder
    });

  } catch (error) {
    console.error('❌ SOLO CHECKOUT ERROR:', error);
    console.error('❌ Error details:', error.stack);
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
      .populate('user', 'name email contact address walletBalance')
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

    // ONLY ALLOW CANCELLATION IF STATUS IS "Processing"
    if (order.orderStatus !== 'Processing') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: "${order.orderStatus}". Only "Processing" orders can be cancelled.`
      });
    }

    // If payment was made via wallet, refund the amount
    if (order.paymentMethod === 'Wallet' && order.paymentStatus === 'Paid') {
      const user = await User.findById(userId);
      if (user) {
        await user.addWalletBalance(order.totalPrice);
        console.log(`💰 Refunded ₱${order.totalPrice.toFixed(2)} to user's wallet`);
      }
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
      .populate('user', 'name email contact walletBalance')
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