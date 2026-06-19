const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter product name'],
        trim: true,
        maxLength: [100, 'Product name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please enter product description'],
        maxLength: [500, 'Description cannot exceed 500 characters']
    },
    price: {
        type: Number,
        required: [true, 'Please enter product price'],
        min: [0, 'Price cannot be negative']
    },
    quantity: {
        type: Number,
        required: [true, 'Please enter product quantity'],
        min: [0, 'Quantity cannot be negative']
    },
    category: {
        type: String,
        required: [true, 'Please select a category'],
        enum: ['Fruits', 'Vegetables', 'Grains', 'Livestock', 'Others']
    },
    unit: {
        type: String,
        required: [true, 'Please select a unit'],
        enum: ['kg', 'tray', 'sack', 'pc', 'L']
    },
    images: [{
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    }],
    
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    farmerName: {
        type: String,
        required: true
    },
    farmerEmail: {
        type: String,
        required: true
    },
    farmerContact: {
        type: String,
        default: ''
    },
    farmerAvatar: {
        type: String,
        default: null
    },
    farmerAddress: {
        street: { type: String, default: '' },
        barangay: { type: String, default: '' },
        city: { type: String, default: '' },
        zipcode: { type: String, default: '' }
    },
    
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0],
            index: '2dsphere'
        },
        address: {
            type: String,
            default: ''
        },
        fullAddress: {
            type: String,
            default: ''
        },
        city: {
            type: String,
            default: ''
        },
        barangay: {
            type: String,
            default: ''
        },
        street: {
            type: String,
            default: ''
        },
        zipcode: {
            type: String,
            default: ''
        }
    },
    
    isAvailable: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
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
productSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Update timestamp on findOneAndUpdate
productSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

// Index for location queries
productSchema.index({ location: '2dsphere' });

// Index for faster queries
productSchema.index({ farmer: 1, isDeleted: 1 });
productSchema.index({ category: 1, isAvailable: 1 });
productSchema.index({ isAvailable: 1, isDeleted: 1 });

module.exports = mongoose.model('Product', productSchema);