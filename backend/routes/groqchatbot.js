const express = require('express');
const router = express.Router();
const { getChatResponse, clearSession, isGroqInitialized, getModelInfo } = require('../config/groq');

// Health check endpoint
router.get('/health', (req, res) => {
  try {
    const initialized = isGroqInitialized();
    const modelInfo = getModelInfo();
    
    res.json({
      status: initialized ? 'ok' : 'error',
      groqInitialized: initialized,
      message: initialized ? 'Groq API is ready' : 'Groq API key is not configured or no models available',
      modelInfo: modelInfo
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      groqInitialized: false,
      message: error.message
    });
  }
});

// Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    console.log('📨 Chat request received:', {
      hasMessage: !!req.body.message,
      hasSessionId: !!req.body.sessionId,
      hasUserContext: !!req.body.userContext
    });

    const { message, sessionId, userContext } = req.body;
    
    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      console.warn('⚠️ Invalid message received');
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string'
      });
    }
    
    if (!sessionId || typeof sessionId !== 'string') {
      console.warn('⚠️ Invalid session ID received');
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }
    
    // Check if Groq is initialized
    if (!isGroqInitialized()) {
      console.error('❌ Groq is not initialized');
      return res.status(503).json({
        success: false,
        error: 'Chatbot service is not configured. Please check your GROQ_API_KEY and model availability.'
      });
    }
    
    // Get response
    console.log(`🤖 Processing chat for session ${sessionId}`);
    const response = await getChatResponse(message.trim(), sessionId, userContext);
    
    console.log(`✅ Chat response sent for session ${sessionId}`);
    res.json({
      success: true,
      response,
      sessionId
    });
  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Clear session endpoint
router.post('/chat/clear', (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }
    
    const cleared = clearSession(sessionId);
    res.json({
      success: true,
      cleared,
      message: cleared ? 'Session cleared successfully' : 'Session not found'
    });
  } catch (error) {
    console.error('❌ Clear session error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

module.exports = router;