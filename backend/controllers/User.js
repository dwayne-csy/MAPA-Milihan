const User = require('../models/User');
const crypto = require('crypto');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/Cloudinary');
const Mailer = require('../utils/Mailer');
const admin = require('../utils/firebaseAdmin');

// ========== REGISTER USER ==========
exports.registerUser = async (req, res) => {
  try {
    console.log('📝 Register user request received');
    const { name, email, password, avatar, authProvider = 'local', role = 'user' } = req.body;

    // Remove avatar from required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    console.log('✅ Basic validation passed');

    // Check if user already exists in our database
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    let user;
    
    // ========== FIREBASE OAUTH REGISTRATION (Google/Facebook only) ==========
    if (authProvider === 'google' || authProvider === 'facebook') {
      console.log(`🔥 Creating user with ${authProvider} OAuth...`);
      
      // Generate avatar URL from user's name
      const encodedName = encodeURIComponent(name);
      const avatarData = {
        public_id: `${authProvider}_avatar_${Date.now()}`,
        url: `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff&size=150`
      };

      // Create user in database - AUTO VERIFIED for OAuth users, role is always 'user'
      user = await User.create({
        name,
        email,
        password: crypto.randomBytes(20).toString('hex'),
        avatar: avatarData,
        isVerified: true,
        isActive: true,
        authProvider: authProvider,
        role: 'user' // Force role to 'user' for OAuth registrations
      });
      console.log(`✅ ${authProvider} user created in database (auto-verified):`, user.email);

      return res.status(201).json({
        success: true,
        message: `${authProvider} registration successful! Your account has been automatically verified and is ready to use.`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
          authProvider: user.authProvider,
          role: user.role
        }
      });

    } 
    // ========== LOCAL REGISTRATION ==========
    else if (authProvider === 'local') {
      console.log('👤 Creating LOCAL user in database...');
      
      // Validate role
      const validRoles = ['user', 'farmer'];
      const userRole = validRoles.includes(role) ? role : 'user';
      console.log(`📌 User role selected: ${userRole}`);
      
      // Generate avatar URL from user's name
      const encodedName = encodeURIComponent(name);
      const avatarData = {
        public_id: 'avatar_' + Date.now(),
        url: `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff&size=150`
      };

      // Create new user in our database - NOT VERIFIED
      user = await User.create({
        name,
        email,
        password,
        avatar: avatarData,
        isVerified: false,
        isActive: true,
        authProvider: 'local',
        role: userRole // User selected role
      });
      console.log(`✅ Local user created in database with role: ${user.role} (requires verification):`, user.email);

      // Generate email verification token for local users
      const verificationToken = user.getEmailVerificationToken();
      await user.save({ validateBeforeSave: false });

      // Generate verification URL for local users
      const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/users/verify-email/${verificationToken}`;

      const message = `
        <h2>Welcome to ${process.env.APP_NAME}</h2>
        <p>Click the link below to verify your email and activate your account:</p>
        <a href="${verificationUrl}" target="_blank" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Your Email</a>
        <br><br>
        <p>If you didn't request this, please ignore this email.</p>
        <p><small>Or copy this link: ${verificationUrl}</small></p>
      `;

      console.log('📨 Sending verification email to local user via Gmail:', user.email);
      await Mailer({
        email: user.email,
        subject: 'Verify your email - ' + process.env.APP_NAME,
        message
      });
      console.log('✅ Verification email sent to local user');

      return res.status(201).json({
        success: true,
        message: `Registration successful! Verification email sent to ${user.email}. Please verify your email before logging in.`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
          authProvider: user.authProvider,
          role: user.role
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid authentication provider. Use local, google, or facebook.'
      });
    }

  } catch (error) {
    console.error('❌ REGISTER ERROR DETAILS:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    
    // Check for specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join(', ') 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Registration failed. Please try again.' 
    });
  }
};

// ========== VERIFY EMAIL ==========
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Verification token is required' 
      });
    }

    // Find user by verification token
    const user = await User.findOne({
      emailVerificationToken: crypto.createHash('sha256').update(token).digest('hex'),
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email verification token is invalid or has expired' 
      });
    }

    // Verify the user
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    console.log('✅ Email verified for local user:', user.email);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now login to your account.'
    });

  } catch (error) {
    console.error('❌ VERIFY EMAIL ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Email verification failed' 
    });
  }
};

// ========== CHECK EMAIL VERIFICATION STATUS ==========
exports.checkEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      success: true,
      isVerified: user.isVerified,
      authProvider: user.authProvider,
      role: user.role,
      message: user.isVerified ? 'Email is verified' : 'Email is not verified'
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== LOGIN USER (Local Only) ==========
exports.loginUser = async (req, res) => {
  try {
    console.log('🔐 Login attempt for:', req.body.email);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter email and password' });
    }

    // Find user in database
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log(`👤 User found: ${email}, Role: ${user.role}, AuthProvider: ${user.authProvider}`);

    // 🚫 Check if user is deleted (in trash)
    if (user.isDeleted) {
      console.log('🗑️ Deleted user attempted login:', email);
      return res.status(403).json({ message: 'Your account has been deleted. Please contact support.' });
    }

    // 🚫 Check if user is inactive
    if (!user.isActive) {
      console.log('❌ Inactive user attempted login:', email);
      return res.status(403).json({ message: 'Your account is inactive. Please contact support.' });
    }

    // 🚫 Only allow local users to login via this endpoint
    if (user.authProvider !== 'local') {
      console.log('❌ Non-local user attempted login:', email);
      return res.status(400).json({ 
        message: `Please use ${user.authProvider} authentication to login.` 
      });
    }

    // 🚫 Check if user is verified (for local users)
    if (!user.isVerified) {
      console.log('❌ Local user not verified:', email);
      return res.status(403).json({ message: 'Please verify your email first.' });
    }

    // Check password for local users
    const userWithPassword = await User.findOne({ email }).select('+password');
    const isPasswordMatched = await userWithPassword.comparePassword(password);
    if (!isPasswordMatched) {
      console.log('❌ Password mismatch for:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // ✅ Successful login
    console.log(`✅ Login successful for: ${email}, Role: ${user.role}`);
    const token = user.getJwtToken();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ 
      success: true, 
      token, 
      user: userResponse 
    });

  } catch (error) {
    console.error('❌ LOGIN ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed. Please try again.',
      error: error.message 
    });
  }
};

// ========== FORGOT PASSWORD ==========
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return res.status(404).json({ message: 'User not found with this email' });

    // For OAuth users (Google/Facebook), they don't have passwords
    if (user.authProvider === 'google' || user.authProvider === 'facebook') {
      return res.status(400).json({ 
        message: `You signed up with ${user.authProvider}. Please login using ${user.authProvider} authentication.` 
      });
    }

    // For local users, send password reset email via Gmail
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Update this URL to match your frontend URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const message = `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" target="_blank" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Your Password</a>
      <br><br>
      <p>If you did not request this email, please ignore it.</p>
      <p><small>Or copy this link: ${resetUrl}</small></p>
      <br><br>
      <p>This link will expire in 30 minutes.</p>
    `;

    console.log('📨 Sending password reset email via Gmail to:', user.email);
    await Mailer({
      email: user.email,
      subject: 'Password Reset Request - ' + process.env.APP_NAME,
      message
    });

    res.status(200).json({ 
      success: true, 
      message: `Password reset email sent to: ${user.email}` 
    });
  } catch (error) {
    console.error('❌ FORGOT PASSWORD ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ========== FIREBASE GOOGLE OAUTH ==========
exports.firebaseGoogleAuth = async (req, res) => {
  try {
    console.log('🔥 Firebase Google OAuth attempt');
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Firebase ID token is required' });
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, uid, name, picture } = decodedToken;

    console.log('✅ Firebase Google token verified for:', email);

    // Find or create user in database
    let user = await User.findOne({ email });
    
    if (!user) {
      // Auto-create user for Google OAuth - role is always 'user'
      user = await User.create({
        name: name || email.split('@')[0],
        email: email,
        password: crypto.randomBytes(20).toString('hex'),
        avatar: {
          public_id: `google_${uid}`,
          url: picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email.split('@')[0])}&background=random&color=fff&size=150`
        },
        isVerified: true,
        isActive: true,
        firebaseUID: uid,
        authProvider: 'google',
        role: 'user' // Force role to 'user' for OAuth
      });
      console.log('✅ User auto-created for Google OAuth login with role: user');
    } else {
      // Update existing user with Google info if needed
      if (user.authProvider !== 'google') {
        user.authProvider = 'google';
        user.firebaseUID = uid;
        user.isVerified = true;
        // Keep existing role if it's admin or farmer, otherwise set to user
        if (!['admin', 'farmer'].includes(user.role)) {
          user.role = 'user';
        }
        await user.save({ validateBeforeSave: false });
      }
      console.log(`✅ Existing user logged in with Google, Role: ${user.role}`);
    }

    // Check if user is deleted or inactive
    if (user.isDeleted) {
      return res.status(403).json({ message: 'Your account has been deleted. Please contact support.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account is inactive. Please contact support.' });
    }

    // Generate JWT token
    const token = user.getJwtToken();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    console.log(`✅ Firebase Google OAuth successful for: ${email}, Role: ${user.role}`);
    
    res.status(200).json({
      success: true,
      token,
      user: userResponse,
      message: 'Google authentication successful'
    });

  } catch (error) {
    console.error('❌ FIREBASE GOOGLE OAUTH ERROR:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: 'Google token expired' });
    }
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    res.status(500).json({
      success: false,
      message: 'Google authentication failed',
      error: error.message
    });
  }
};

// ========== FIREBASE FACEBOOK OAUTH ==========
exports.firebaseFacebookAuth = async (req, res) => {
  try {
    console.log('🔥 Firebase Facebook OAuth attempt');
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Firebase ID token is required' });
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, uid, name, picture } = decodedToken;

    console.log('✅ Firebase Facebook token verified for:', email);

    // Find or create user in database
    let user = await User.findOne({ email });
    
    if (!user) {
      // Auto-create user for Facebook OAuth - role is always 'user'
      user = await User.create({
        name: name || email.split('@')[0],
        email: email,
        password: crypto.randomBytes(20).toString('hex'),
        avatar: {
          public_id: `facebook_${uid}`,
          url: picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email.split('@')[0])}&background=random&color=fff&size=150`
        },
        isVerified: true,
        isActive: true,
        firebaseUID: uid,
        authProvider: 'facebook',
        role: 'user' // Force role to 'user' for OAuth
      });
      console.log('✅ User auto-created for Facebook OAuth login with role: user');
    } else {
      // Update existing user with Facebook info if needed
      if (user.authProvider !== 'facebook') {
        user.authProvider = 'facebook';
        user.firebaseUID = uid;
        user.isVerified = true;
        // Keep existing role if it's admin or farmer, otherwise set to user
        if (!['admin', 'farmer'].includes(user.role)) {
          user.role = 'user';
        }
        await user.save({ validateBeforeSave: false });
      }
      console.log(`✅ Existing user logged in with Facebook, Role: ${user.role}`);
    }

    // Check if user is deleted or inactive
    if (user.isDeleted) {
      return res.status(403).json({ message: 'Your account has been deleted. Please contact support.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account is inactive. Please contact support.' });
    }

    // Generate JWT token
    const token = user.getJwtToken();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    console.log(`✅ Firebase Facebook OAuth successful for: ${email}, Role: ${user.role}`);
    
    res.status(200).json({
      success: true,
      token,
      user: userResponse,
      message: 'Facebook authentication successful'
    });

  } catch (error) {
    console.error('❌ FIREBASE FACEBOOK OAUTH ERROR:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: 'Facebook token expired' });
    }
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ message: 'Invalid Facebook token' });
    }

    res.status(500).json({
      success: false,
      message: 'Facebook authentication failed',
      error: error.message
    });
  }
};

// ========== RESEND VERIFICATION EMAIL ==========
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only local users need email verification
    if (user.authProvider !== 'local') {
      return res.status(400).json({ 
        message: `Your ${user.authProvider} account is already verified. Please login using ${user.authProvider} authentication.` 
      });
    }

    // Generate new verification token
    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/users/verify-email/${verificationToken}`;

    const message = `
      <h2>Email Verification</h2>
      <p>Click the link below to verify your email:</p>
      <a href="${verificationUrl}" target="_blank" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Your Email</a>
      <br><br>
      <p>If you didn't request this, please ignore this email.</p>
      <p><small>Or copy this link: ${verificationUrl}</small></p>
      <br><br>
      <p>This link will expire in 30 minutes.</p>
    `;

    console.log('📨 Resending verification email via Gmail to:', user.email);
    await Mailer({
      email: user.email,
      subject: 'Verify your email - ' + process.env.APP_NAME,
      message
    });

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('❌ RESEND VERIFICATION ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send verification email' 
    });
  }
};

// ========== RESET PASSWORD ==========
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user)
      return res.status(400).json({ message: 'Password reset token is invalid or expired' });

    // Check if passwords are provided and match
    if (!req.body.password || !req.body.confirmPassword) {
      return res.status(400).json({ message: 'Password and confirm password are required' });
    }

    if (req.body.password !== req.body.confirmPassword)
      return res.status(400).json({ message: 'Passwords do not match' });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Send confirmation email
    const confirmationMessage = `
      <h2>Password Changed Successfully</h2>
      <p>Your password has been changed successfully.</p>
      <p>If you did not make this change, please contact support immediately.</p>
      <br>
      <p>Best regards,<br>${process.env.APP_NAME} Team</p>
    `;

    await Mailer({
      email: user.email,
      subject: 'Password Changed - ' + process.env.APP_NAME,
      message: confirmationMessage
    }).catch(err => console.warn('Could not send password change confirmation:', err.message));

    const token = user.getJwtToken();
    res.status(200).json({ success: true, token, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== GET USER PROFILE ==========
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user)
      return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ 
      success: true, 
      user: {
        name: user.name,
        email: user.email,
        contact: user.contact,
        address: user.address,
        avatar: user.avatar,
        role: user.role,
        isVerified: user.isVerified,
        authProvider: user.authProvider,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== UPDATE PROFILE ==========
exports.updateProfile = async (req, res) => {
  try {
    console.log('📝 Update profile request received');
    console.log('User ID:', req.user?._id || req.user?.id);
    console.log('Request body:', req.body);
    console.log('Has file:', !!req.file);

    // Get user ID safely
    const userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    // Build update data object
    const updateData = {};
    
    // Update name if provided
    if (req.body.name !== undefined) {
      updateData.name = req.body.name;
    }
    
    // Update contact if provided
    if (req.body.contact !== undefined) {
      updateData.contact = req.body.contact;
    }
    
    // Build address object (only include fields that are provided)
    const addressFields = ['city', 'barangay', 'street', 'zipcode'];
    let hasAddressField = false;
    const addressUpdate = {};
    
    addressFields.forEach(field => {
      if (req.body[field] !== undefined) {
        addressUpdate[field] = req.body[field];
        hasAddressField = true;
      }
    });
    
    if (hasAddressField) {
      updateData.address = addressUpdate;
    }

    // Handle avatar upload
    if (req.file) {
      console.log('🖼️ Avatar file detected:', req.file.path);
      
      try {
        const currentUser = await User.findById(userId);
        
        // Delete old avatar if it exists and is not a default avatar
        if (currentUser?.avatar?.public_id && 
            !currentUser.avatar.url?.includes('ui-avatars.com') &&
            !currentUser.avatar.url?.includes('default-avatar')) {
          try {
            await deleteFromCloudinary(currentUser.avatar.public_id);
            console.log('✅ Old avatar deleted from Cloudinary');
          } catch (err) {
            console.warn('⚠️ Could not delete old avatar:', err.message);
          }
        }

        // Upload new avatar
        const avatarResult = await uploadToCloudinary(req.file.path, 'Mapa-Milihan/avatars');
        updateData.avatar = {
          public_id: avatarResult.public_id,
          url: avatarResult.url
        };

        // Remove temp file
        const fs = require('fs');
        if (fs.existsSync(req.file.path)) {
          fs.unlink(req.file.path, (err) => {
            if (err) console.warn('⚠️ Failed to delete temp file:', err.message);
          });
        }

        console.log('✅ Avatar uploaded to Cloudinary');
      } catch (avatarError) {
        console.error('❌ Avatar upload error:', avatarError.message);
        // Continue without avatar update
      }
    }

    // If no data to update, return error
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data to update'
      });
    }

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      updateData, 
      { 
        new: true,
        runValidators: false
      }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ Profile updated successfully');
    res.status(200).json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('❌ UPDATE PROFILE ERROR:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Profile update failed. Please try again.'
    });
  }
};

// ========== UPDATE PASSWORD ==========
exports.updatePassword = async (req, res) => {
  try {
    console.log("🔐 Password update request received for user:", req.user.id);

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      console.log("❌ User not found");
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.authProvider !== 'local') {
      return res.status(400).json({ 
        success: false, 
        message: `You signed up with ${user.authProvider}. Password changes are managed through ${user.authProvider}.` 
      });
    }

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);
    if (!isPasswordMatched) {
      console.log("❌ Old password incorrect");
      return res.status(400).json({ success: false, message: "Old password is incorrect" });
    }

    if (req.body.newPassword !== req.body.confirmPassword) {
      console.log("❌ New passwords do not match");
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    user.password = req.body.newPassword;
    await user.save({ validateBeforeSave: false });

    console.log("✅ Password updated successfully");
    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("❌ UPDATE PASSWORD ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update password",
    });
  }
};