const Product = require('../models/Product');
const User = require('../models/User');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/Cloudinary');

// ========== CREATE PRODUCT ==========
exports.createProduct = async (req, res) => {
    try {
        console.log('📝 Create product request received');
        const farmerId = req.user.id;
        
        // Check if farmer exists
        const farmer = await User.findById(farmerId);
        if (!farmer) {
            return res.status(404).json({ success: false, message: 'Farmer not found' });
        }

        // Check if farmer has completed profile (has address)
        if (!farmer.address || !farmer.address.city || !farmer.address.barangay) {
            return res.status(400).json({
                success: false,
                message: 'Please complete your profile first. Add your location details before creating products.'
            });
        }

        const {
            name,
            description,
            price,
            quantity,
            category,
            unit,
            location,
            isAvailable = true
        } = req.body;

        // Validate required fields
        if (!name || !description || !price || !quantity || !category || !unit) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all required fields'
            });
        }

        // Handle image uploads
        let images = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const result = await uploadToCloudinary(file.path, 'Mapa-Milihan/products');
                    images.push({
                        public_id: result.public_id,
                        url: result.url
                    });
                    // Remove temp file
                    const fs = require('fs');
                    if (fs.existsSync(file.path)) {
                        fs.unlink(file.path, (err) => {
                            if (err) console.warn('⚠️ Failed to delete temp file:', err.message);
                        });
                    }
                } catch (error) {
                    console.error('❌ Image upload error:', error);
                }
            }
        }

        // Get farmer's avatar URL
        const farmerAvatar = farmer.avatar?.url || farmer.profilePicture?.url || null;

        // Parse location if provided, otherwise use farmer's address
        let locationData = {
            type: 'Point',
            coordinates: [0, 0],
            address: '',
            city: farmer.address.city || '',
            barangay: farmer.address.barangay || '',
            street: farmer.address.street || '',
            zipcode: farmer.address.zipcode || '',
            fullAddress: `${farmer.address.street || ''}, ${farmer.address.barangay || ''}, ${farmer.address.city || ''}`.trim()
        };

        if (location) {
            try {
                const parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;
                if (parsedLocation.coordinates) {
                    locationData.coordinates = parsedLocation.coordinates;
                }
                if (parsedLocation.address) {
                    locationData.address = parsedLocation.address;
                    locationData.fullAddress = parsedLocation.address;
                }
                if (parsedLocation.city) {
                    locationData.city = parsedLocation.city;
                }
                if (parsedLocation.barangay) {
                    locationData.barangay = parsedLocation.barangay;
                }
                if (parsedLocation.street) {
                    locationData.street = parsedLocation.street;
                }
                if (parsedLocation.zipcode) {
                    locationData.zipcode = parsedLocation.zipcode;
                }
                if (parsedLocation.fullAddress) {
                    locationData.fullAddress = parsedLocation.fullAddress;
                }
            } catch (error) {
                console.warn('⚠️ Could not parse location:', error);
            }
        }

        // Create product with farmer details embedded
        const product = await Product.create({
            name,
            description,
            price: Number(price),
            quantity: Number(quantity),
            category,
            unit,
            images,
            farmer: farmerId,
            farmerName: farmer.name,
            farmerEmail: farmer.email,
            farmerContact: farmer.contact || '',
            farmerAvatar: farmerAvatar,
            farmerAddress: {
                street: farmer.address.street || '',
                barangay: farmer.address.barangay || '',
                city: farmer.address.city || '',
                zipcode: farmer.address.zipcode || ''
            },
            location: locationData,
            isAvailable: isAvailable === 'true' || isAvailable === true
        });

        console.log('✅ Product created successfully');
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product
        });

    } catch (error) {
        console.error('❌ CREATE PRODUCT ERROR:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create product'
        });
    }
};

// ========== GET ALL PRODUCTS (for users) ==========
exports.getProducts = async (req, res) => {
    try {
        const { category, search, minPrice, maxPrice } = req.query;
        
        let query = { isDeleted: false, isAvailable: true };
        
        if (category && category !== 'All') {
            query.category = category;
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { farmerName: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        const products = await Product.find(query)
            .populate('farmer', 'name email contact avatar profilePicture address')
            .sort({ createdAt: -1 });

        // Transform products to include farmer avatar and address
        const transformedProducts = products.map(product => {
            const productObj = product.toObject();
            // Ensure farmer avatar is available
            if (productObj.farmer) {
                productObj.farmerAvatar = productObj.farmer.avatar?.url || 
                                         productObj.farmer.profilePicture?.url || 
                                         null;
                productObj.farmerAddress = productObj.farmer.address || null;
            }
            return productObj;
        });

        res.status(200).json({
            success: true,
            count: transformedProducts.length,
            products: transformedProducts
        });

    } catch (error) {
        console.error('❌ GET PRODUCTS ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products'
        });
    }
};

// ========== GET SINGLE PRODUCT ==========
exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('farmer', 'name email contact avatar profilePicture address bio');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Transform product to include farmer avatar and address
        const productObj = product.toObject();
        if (productObj.farmer) {
            productObj.farmerAvatar = productObj.farmer.avatar?.url || 
                                     productObj.farmer.profilePicture?.url || 
                                     null;
            productObj.farmerAddress = productObj.farmer.address || null;
        }

        res.status(200).json({
            success: true,
            product: productObj
        });

    } catch (error) {
        console.error('❌ GET PRODUCT ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product'
        });
    }
};

// ========== GET FARMER'S PRODUCTS ==========
exports.getFarmerProducts = async (req, res) => {
    try {
        const farmerId = req.user.id;
        
        const products = await Product.find({ 
            farmer: farmerId,
            isDeleted: false
        })
        .populate('farmer', 'name email contact avatar profilePicture address')
        .sort({ createdAt: -1 });

        // Transform products
        const transformedProducts = products.map(product => {
            const productObj = product.toObject();
            if (productObj.farmer) {
                productObj.farmerAvatar = productObj.farmer.avatar?.url || 
                                         productObj.farmer.profilePicture?.url || 
                                         null;
                productObj.farmerAddress = productObj.farmer.address || null;
            }
            return productObj;
        });

        res.status(200).json({
            success: true,
            count: transformedProducts.length,
            products: transformedProducts
        });

    } catch (error) {
        console.error('❌ GET FARMER PRODUCTS ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products'
        });
    }
};

// ========== UPDATE PRODUCT ==========
exports.updateProduct = async (req, res) => {
    try {
        console.log('📝 Update product request received');
        const productId = req.params.id;
        const farmerId = req.user.id;

        // Find product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if product belongs to farmer
        if (product.farmer.toString() !== farmerId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this product'
            });
        }

        const {
            name,
            description,
            price,
            quantity,
            category,
            unit,
            isAvailable
        } = req.body;

        // Build update data
        const updateData = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (price) updateData.price = Number(price);
        if (quantity) updateData.quantity = Number(quantity);
        if (category) updateData.category = category;
        if (unit) updateData.unit = unit;
        if (isAvailable !== undefined) updateData.isAvailable = isAvailable === 'true' || isAvailable === true;
        updateData.updatedAt = Date.now();

        // Handle new image uploads
        if (req.files && req.files.length > 0) {
            // Delete old images
            for (const img of product.images) {
                try {
                    await deleteFromCloudinary(img.public_id);
                } catch (error) {
                    console.warn('⚠️ Could not delete old image:', error);
                }
            }

            // Upload new images
            const newImages = [];
            for (const file of req.files) {
                try {
                    const result = await uploadToCloudinary(file.path, 'Mapa-Milihan/products');
                    newImages.push({
                        public_id: result.public_id,
                        url: result.url
                    });
                    const fs = require('fs');
                    if (fs.existsSync(file.path)) {
                        fs.unlink(file.path, (err) => {
                            if (err) console.warn('⚠️ Failed to delete temp file:', err.message);
                        });
                    }
                } catch (error) {
                    console.error('❌ Image upload error:', error);
                }
            }
            updateData.images = newImages;
        }

        // Update product
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            updateData,
            { new: true, runValidators: true }
        ).populate('farmer', 'name email contact avatar profilePicture address');

        // Transform product
        const productObj = updatedProduct.toObject();
        if (productObj.farmer) {
            productObj.farmerAvatar = productObj.farmer.avatar?.url || 
                                     productObj.farmer.profilePicture?.url || 
                                     null;
            productObj.farmerAddress = productObj.farmer.address || null;
        }

        console.log('✅ Product updated successfully');
        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            product: productObj
        });

    } catch (error) {
        console.error('❌ UPDATE PRODUCT ERROR:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update product'
        });
    }
};

// ========== DELETE PRODUCT (Soft Delete) ==========
exports.deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const farmerId = req.user.id;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if product belongs to farmer
        if (product.farmer.toString() !== farmerId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this product'
            });
        }

        // Soft delete
        product.isDeleted = true;
        product.isAvailable = false;
        await product.save();

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });

    } catch (error) {
        console.error('❌ DELETE PRODUCT ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product'
        });
    }
};

// ========== GET PRODUCTS BY LOCATION ==========
exports.getProductsByLocation = async (req, res) => {
    try {
        const { lat, lng, radius = 10000 } = req.query; // radius in meters

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        const products = await Product.find({
            isDeleted: false,
            isAvailable: true,
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [Number(lng), Number(lat)]
                    },
                    $maxDistance: Number(radius)
                }
            }
        }).populate('farmer', 'name email contact avatar profilePicture address');

        // Transform products
        const transformedProducts = products.map(product => {
            const productObj = product.toObject();
            if (productObj.farmer) {
                productObj.farmerAvatar = productObj.farmer.avatar?.url || 
                                         productObj.farmer.profilePicture?.url || 
                                         null;
                productObj.farmerAddress = productObj.farmer.address || null;
            }
            return productObj;
        });

        res.status(200).json({
            success: true,
            count: transformedProducts.length,
            products: transformedProducts
        });

    } catch (error) {
        console.error('❌ GET PRODUCTS BY LOCATION ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products by location'
        });
    }
};