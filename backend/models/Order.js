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
    }
  },
  
  paymentMethod: {
    type: String,
    enum: ['Cash on Delivery'],
    default: 'Cash on Delivery'
  },
  
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Accepted', 'Cancelled', 'Completed'],
    default: 'Pending'
  },
  
  paymentDetails: {
    paymentId: String,
    payerId: String,
    paymentMethod: String,
    paymentDate: Date
  },
  
  // ✅ Updated orderStatus with new statuses
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
  
  // Set deliveredAt when status changes to Delivered
  if (this.orderStatus === 'Delivered' && !this.deliveredAt) {
    this.deliveredAt = Date.now();
  }
  
  // Set cancelledAt when status changes to Cancelled
  if (this.orderStatus === 'Cancelled' && !this.cancelledAt) {
    this.cancelledAt = Date.now();
  }
  
  next();
});

// Indexes for faster queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);