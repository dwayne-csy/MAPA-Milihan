const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 120000,
  secure: true,
  cdn_subdomain: true
});

// Upload to Cloudinary - supports both images and videos
const uploadToCloudinary = async (input, folder = 'mapa-milihan', resourceType = 'auto') => {
  try {
    console.log('☁️ Cloudinary upload started');
    console.log('Resource type specified:', resourceType);
    
    // Determine resource type if auto
    let detectedType = resourceType;
    let isVideo = false;
    
    if (resourceType === 'auto' && typeof input === 'string') {
      // Check if it's a video from base64
      if (input.startsWith('data:video') || 
          input.includes('video/mp4') || 
          input.includes('video/webm') ||
          input.includes('video/quicktime') ||
          input.includes('video/x-msvideo') ||
          input.includes('video/mpeg') ||
          input.includes('video/ogg')) {
        detectedType = 'video';
        isVideo = true;
        console.log('🎥 Video detected from base64');
      } else if (input.startsWith('data:image') || 
                 input.includes('image/jpeg') || 
                 input.includes('image/png') || 
                 input.includes('image/webp')) {
        detectedType = 'image';
        console.log('🖼️ Image detected from base64');
      }
    } else if (resourceType === 'video') {
      isVideo = true;
      console.log('🎥 Video explicitly specified');
    }

    const uploadOptions = {
      folder: folder,
      resource_type: detectedType,
      use_filename: false,
      unique_filename: true,
      overwrite: false,
      timeout: 180000 // 3 minutes for videos
    };

    // If it's a video, add video-specific options
    if (isVideo || detectedType === 'video') {
      uploadOptions.eager = [
        { width: 1280, height: 720, crop: 'limit', format: 'mp4' },
        { width: 640, height: 480, crop: 'limit', format: 'mp4' }
      ];
      uploadOptions.eager_async = true;
      uploadOptions.format = 'mp4';
      console.log('🎥 Applying video-specific upload options');
    }

    let toUpload;
    if (typeof input === 'string' && input.startsWith('data:')) {
      toUpload = input;
      console.log('📤 Uploading as base64 data URL');
    } else if (typeof input === 'string') {
      toUpload = input;
      console.log('📤 Uploading as file path:', input);
      
      if (!fs.existsSync(input)) {
        throw new Error(`File not found: ${input}`);
      }
      
      const stats = fs.statSync(input);
      console.log('File size:', stats.size, 'bytes');
      
      if (stats.size === 0) {
        throw new Error('File is empty');
      }
    } else {
      toUpload = input;
      console.log('📤 Uploading as buffer');
    }

    const result = await cloudinary.uploader.upload(toUpload, uploadOptions);
    console.log('✅ Cloudinary upload successful');
    console.log('Public ID:', result.public_id);
    console.log('URL:', result.secure_url);
    console.log('Resource Type:', result.resource_type);

    return {
      public_id: result.public_id,
      url: result.secure_url,
      resource_type: result.resource_type || (isVideo ? 'video' : 'image')
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw new Error('Upload failed: ' + (error.message || error));
  }
};

// Delete from Cloudinary - supports both images and videos
const deleteFromCloudinary = async (public_id, resourceType = 'auto') => {
  try {
    const result = await cloudinary.uploader.destroy(public_id, { 
      resource_type: resourceType,
      invalidate: true
    });
    return result;
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error);
    throw new Error('Deletion failed: ' + error.message);
  }
};

// Helper functions
const isVideoBase64 = (base64String) => {
  if (!base64String || typeof base64String !== 'string') return false;
  const videoSignatures = [
    'data:video',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-msvideo',
    'video/mpeg',
    'video/ogg',
    'video/3gpp',
    'video/x-flv',
    'video/avi'
  ];
  return videoSignatures.some(signature => 
    base64String.toLowerCase().includes(signature)
  );
};

const isImageBase64 = (base64String) => {
  if (!base64String || typeof base64String !== 'string') return false;
  const imageSignatures = [
    'data:image',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml'
  ];
  return imageSignatures.some(signature => 
    base64String.toLowerCase().includes(signature)
  );
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  isVideoBase64,
  isImageBase64
};