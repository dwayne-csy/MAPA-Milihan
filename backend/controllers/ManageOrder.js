// backend/controllers/ManageOrder.js
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

// ========== GET ALL ORDERS (Farmer) ==========
exports.getAllOrders = async (req, res) => {
  try {
    console.log('📋 Fetching orders for farmer');
    console.log('📋 Query params:', req.query);
    const { status, search } = req.query;
    const userId = req.user.id;

    // First, check if farmer has any products
    const farmerProducts = await Product.find({ 
      farmer: userId,
      isDeleted: false 
    }).select('_id');

    const productIds = farmerProducts.map(p => p._id);
    console.log(`📋 Found ${productIds.length} products for farmer`);

    // If farmer has no products, return empty array immediately
    if (productIds.length === 0) {
      console.log('⚠️ Farmer has no products, returning empty orders');
      return res.status(200).json({
        success: true,
        count: 0,
        orders: [],
        userRole: 'farmer'
      });
    }

    // Build query - find orders containing farmer's products
    let query = {
      'orderItems.product': { $in: productIds }
    };

    // Filter by status if provided and valid
    if (status && status !== 'All' && status !== 'undefined' && status !== 'null' && status.trim() !== '') {
      query.orderStatus = status;
    }

    // Search by order ID or customer name
    if (search && search.trim() !== '') {
      const trimmedSearch = search.trim();
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(trimmedSearch);
      
      if (isObjectId) {
        query._id = trimmedSearch;
      } else {
        // Search by customer name or email
        const users = await User.find({
          $or: [
            { name: { $regex: trimmedSearch, $options: 'i' } },
            { email: { $regex: trimmedSearch, $options: 'i' } }
          ]
        }).select('_id');

        const userIds = users.map(u => u._id);
        if (userIds.length > 0) {
          query.user = { $in: userIds };
        } else {
          // If no users found, return empty results
          return res.status(200).json({
            success: true,
            count: 0,
            orders: [],
            userRole: 'farmer'
          });
        }
      }
    }

    console.log('🔍 Final query:', JSON.stringify(query, null, 2));

    const orders = await Order.find(query)
      .populate('user', 'name email contact')
      .populate('orderItems.product', 'name price unit images')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${orders.length} orders`);

    // If no orders found, return empty array
    if (orders.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        orders: [],
        userRole: 'farmer'
      });
    }

    // Filter order items to only show farmer's products
    const filteredOrders = orders.map(order => {
      const farmerItems = order.orderItems.filter(item => 
        item.farmer && item.farmer.toString() === userId.toString()
      );

      if (farmerItems.length > 0) {
        return {
          ...order.toObject(),
          orderItems: farmerItems,
          itemsPrice: farmerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          taxPrice: farmerItems.reduce((sum, item) => sum + (item.price * item.quantity * 0.12), 0),
          totalPrice: farmerItems.reduce((sum, item) => sum + (item.price * item.quantity * 1.12), 0) + 50
        };
      }
      return null;
    }).filter(order => order !== null);

    res.status(200).json({
      success: true,
      count: filteredOrders.length,
      orders: filteredOrders,
      userRole: 'farmer'
    });
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders.',
      error: error.message
    });
  }
};

// ========== GET SINGLE ORDER BY ID ==========
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log('📋 Fetching order details for ID:', id);

    // Check if ID is valid ObjectId
    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const order = await Order.findById(id)
      .populate('user', 'name email contact address')
      .populate('orderItems.product', 'name price unit images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Verify farmer has products in this order
    const hasFarmerProduct = order.orderItems.some(
      item => item.farmer && item.farmer.toString() === userId.toString()
    );

    if (!hasFarmerProduct) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this order.'
      });
    }

    // Filter order items to only show farmer's products
    const farmerItems = order.orderItems.filter(
      item => item.farmer && item.farmer.toString() === userId.toString()
    );

    const filteredOrder = {
      ...order.toObject(),
      orderItems: farmerItems,
      itemsPrice: farmerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      taxPrice: farmerItems.reduce((sum, item) => sum + (item.price * item.quantity * 0.12), 0),
      totalPrice: farmerItems.reduce((sum, item) => sum + (item.price * item.quantity * 1.12), 0) + 50
    };

    res.status(200).json({
      success: true,
      order: filteredOrder
    });
  } catch (error) {
    console.error('❌ Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details.',
      error: error.message
    });
  }
};

// ========== UPDATE ORDER STATUS ==========
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    console.log('📋 Updating order status for ID:', id, 'to:', status);

    // Check if ID is valid ObjectId
    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const validStatuses = [
      'Processing',
      'Accepted',
      'Out for Delivery',
      'Delivered',
      'Cancelled'
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed: Processing, Accepted, Out for Delivery, Delivered, Cancelled.'
      });
    }

    // Find order
    const order = await Order.findById(id)
      .populate('user', 'name email contact')
      .populate('orderItems.product', 'name price unit');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Verify farmer has products in this order
    const hasFarmerProduct = order.orderItems.some(
      item => item.farmer && item.farmer.toString() === userId.toString()
    );

    if (!hasFarmerProduct) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this order.'
      });
    }

    const oldStatus = order.orderStatus;

    // If order is already delivered or cancelled, prevent further updates
    if (oldStatus === 'Delivered' || oldStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot update order with status: "${oldStatus}".`
      });
    }

    // If cancelling, restore product quantities
    if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          product.quantity = product.quantity + item.quantity;
          await product.save();
          console.log(`✅ Stock restored for "${product.name}": ${product.quantity} now available`);
        }
      }
      order.cancelledAt = Date.now();
    }

    // Update status
    order.orderStatus = status;

    if (status === 'Delivered') {
      order.deliveredAt = Date.now();
    }

    await order.save();

    console.log(`✅ Order ${id} status updated from "${oldStatus}" to "${status}"`);

    // Return updated order
    const updatedOrder = await Order.findById(id)
      .populate('user', 'name email contact')
      .populate('orderItems.product', 'name price unit images');

    res.status(200).json({
      success: true,
      message: `Order status updated to "${status}".`,
      order: updatedOrder
    });
  } catch (error) {
    console.error('❌ Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order.',
      error: error.message
    });
  }
};

// ========== DELETE ORDER ==========
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    console.log('📋 Deleting order ID:', id);

    // Check if ID is valid ObjectId
    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    // Only admin can delete orders
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete orders.'
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    await order.deleteOne();

    console.log(`✅ Order ${id} deleted successfully`);

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully.'
    });
  } catch (error) {
    console.error('❌ Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete order.',
      error: error.message
    });
  }
};

// ========== GET ORDER STATISTICS ==========
exports.getOrderStats = async (req, res) => {
  try {
    console.log('📋 Fetching order statistics');
    const userId = req.user.id;

    // Find products belonging to this farmer
    const farmerProducts = await Product.find({
      farmer: userId,
      isDeleted: false
    }).select('_id');

    const productIds = farmerProducts.map(p => p._id);

    // If farmer has no products, return empty stats
    if (productIds.length === 0) {
      return res.status(200).json({
        success: true,
        stats: {
          totalOrders: 0,
          statusStats: {
            Processing: 0,
            Accepted: 0,
            'Out for Delivery': 0,
            Delivered: 0,
            Cancelled: 0
          },
          totalRevenue: 0
        }
      });
    }

    const query = {
      'orderItems.product': { $in: productIds }
    };

    const totalOrders = await Order.countDocuments(query);

    const statusCounts = await Order.aggregate([
      { $match: query },
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);

    const statusStats = {
      Processing: 0,
      Accepted: 0,
      'Out for Delivery': 0,
      Delivered: 0,
      Cancelled: 0
    };

    statusCounts.forEach(item => {
      if (statusStats.hasOwnProperty(item._id)) {
        statusStats[item._id] = item.count;
      }
    });

    // Calculate revenue from farmer's products only
    let totalRevenue = 0;
    const farmerOrders = await Order.find(query).populate('orderItems.product');
    for (const order of farmerOrders) {
      for (const item of order.orderItems) {
        if (item.farmer && item.farmer.toString() === userId.toString()) {
          totalRevenue += item.price * item.quantity;
        }
      }
    }

    res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        statusStats,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('❌ Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics.',
      error: error.message
    });
  }
};