// backend/models/Order.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity cannot be less than 1']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  unit: {
    type: String,
    default: 'pc'
  },
  image: {
    type: String,
    default: ''
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  farmerName: {
    type: String,
    default: ''
  }
});

// Add farmerPayments schema
const farmerPaymentSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  farmerName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    productName: String,
    quantity: Number,
    price: Number,
    unit: String
  }]
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderItems: [orderItemSchema],
  
  shippingInfo: {
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    barangay: {
      type: String,
      required: true
    },
    street: {
      type: String,
      default: ''
    },
    zipcode: {
      type: String,
      required: true
    },
    phoneNo: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'Philippines'
    },
    shippingDistance: {
      type: Number,
      default: 0
    },
    shippingCost: {
      type: Number,
      default: 0
    }
  },
  
  shippingDistance: {
    type: Number,
    default: 0
  },
  
  paymentMethod: {
    type: String,
    enum: ['Cash on Delivery', 'Wallet'],
    default: 'Cash on Delivery'
  },
  
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Accepted', 'Cancelled', 'Completed'],
    default: 'Pending'
  },
  
  paymentDetails: {
    paymentId: String,
    payerId: String,
    paymentMethod: String,
    paymentDate: Date,
    walletTransactionId: String,
    walletAmountUsed: Number,
    previousBalance: Number,
    newBalance: Number,
    farmerDistribution: [farmerPaymentSchema]
  },
  
  // Track farmer payments separately for easier querying
  farmerPayments: [farmerPaymentSchema],
  
  // Flag to identify if order is from a farmer
  isFarmerOrder: {
    type: Boolean,
    default: false
  },
  
  orderStatus: {
    type: String,
    enum: ['Processing', 'Accepted', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Processing'
  },
  
  itemsPrice: {
    type: Number,
    required: true,
    default: 0
  },
  
  taxPrice: {
    type: Number,
    required: true,
    default: 0
  },
  
  shippingPrice: {
    type: Number,
    required: true,
    default: 0
  },
  
  totalPrice: {
    type: Number,
    required: true,
    default: 0
  },
  
  deliveredAt: {
    type: Date
  },
  
  cancelledAt: {
    type: Date
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  if (this.orderStatus === 'Delivered' && !this.deliveredAt) {
    this.deliveredAt = Date.now();
  }
  
  if (this.orderStatus === 'Cancelled' && !this.cancelledAt) {
    this.cancelledAt = Date.now();
  }
  
  next();
});

// Indexes for faster queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'farmerPayments.farmerId': 1 });
orderSchema.index({ isFarmerOrder: 1 });

module.exports = mongoose.model('Order', orderSchema);