const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        maxLength: [30, 'Your name cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true,
        validate: [validator.isEmail, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Please enter your password'],
        minlength: [6, 'Your password must be longer than 6 characters'],
        select: false
    },
    avatar: {
        public_id: {
            type: String,
            default: "",
        },
        url: {
            type: String,
            default: "https://res.cloudinary.com/demo/image/upload/v1690000000/default-avatar.png",
        }
    },
    contact: {
        type: String,
        default: "",
        validate: {
            validator: function (v) {
                return !v || /^(\+?\d{10,15})$/.test(v);
            },
            message: 'Please enter a valid contact number'
        }
    },
    address: {
        city: {
            type: String,
            default: ""
        },
        barangay: {
            type: String,
            default: ""
        },
        street: {
            type: String,
            default: ""
        },
        zipcode: {
            type: String,
            default: "",
            validate: {
                validator: function (v) {
                    return !v || /^[0-9]{4}$/.test(v);
                },
                message: 'Please enter a valid 4-digit zipcode'
            }
        }
    },
    walletBalance: {
        type: Number,
        default: 0,
        min: [0, 'Wallet balance cannot be negative']
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'farmer', 'rider'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    firebaseUID: {
        type: String,
        default: null
    },
    authProvider: {
        type: String,
        enum: ['local', 'firebase-email', 'google', 'facebook'],
        default: 'local'
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password before saving user (only for local auth)
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    // Only hash password for local authentication, not for Firebase users
    if (this.authProvider === 'local') {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Generate JWT token
userSchema.methods.getJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

// Compare entered password with hashed password (only for local auth)
userSchema.methods.comparePassword = async function (enteredPassword) {
    if (this.authProvider !== 'local') {
        return false;
    }
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    return resetToken;
};

// Generate email verification token
userSchema.methods.getEmailVerificationToken = function () {
    const verifyToken = crypto.randomBytes(20).toString('hex');
    this.emailVerificationToken = crypto.createHash('sha256').update(verifyToken).digest('hex');
    this.emailVerificationExpire = Date.now() + 30 * 60 * 1000;
    return verifyToken;
};

// ========== NEW METHODS FOR WALLET AND ROLE ==========

// Wallet management methods
userSchema.methods.addWalletBalance = async function(amount) {
    if (amount <= 0) {
        throw new Error('Amount must be positive');
    }
    this.walletBalance += amount;
    return this.save();
};

userSchema.methods.deductWalletBalance = async function(amount) {
    if (amount <= 0) {
        throw new Error('Amount must be positive');
    }
    if (this.walletBalance < amount) {
        throw new Error('Insufficient wallet balance');
    }
    this.walletBalance -= amount;
    return this.save();
};

userSchema.methods.hasSufficientBalance = function(amount) {
    return this.walletBalance >= amount;
};

// Role checking methods
userSchema.methods.isFarmer = function() {
    return this.role === 'farmer';
};

userSchema.methods.isRider = function() {
    return this.role === 'rider';
};

userSchema.methods.isAdmin = function() {
    return this.role === 'admin';
};

userSchema.methods.isUser = function() {
    return this.role === 'user';
};

userSchema.methods.changeRole = async function(newRole) {
    const allowedRoles = ['user', 'admin', 'farmer', 'rider'];
    if (!allowedRoles.includes(newRole)) {
        throw new Error('Invalid role');
    }
    this.role = newRole;
    return this.save();
};

module.exports = mongoose.model('User', userSchema);