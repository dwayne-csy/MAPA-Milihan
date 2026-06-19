const Groq = require('groq-sdk');

// Initialize Groq client
let groqClient = null;

try {
  if (process.env.GROQ_API_KEY) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    console.log('✅ Groq client initialized successfully');
  } else {
    console.warn('⚠️ GROQ_API_KEY not found in environment variables');
  }
} catch (error) {
  console.error('❌ Failed to initialize Groq client:', error.message);
}

// System prompt for the chatbot
const SYSTEM_PROMPT = `You are MAPA-Milihan AI, an agricultural intelligence assistant for farmers and agricultural enthusiasts in the Philippines.

Your expertise includes:
- Crop cultivation and management (rice, corn, vegetables, fruits, rubber trees, etc.)
- Soil science and fertilization
- Pest and disease management
- Irrigation and water management
- Agricultural best practices
- Sustainable farming techniques
- Post-harvest handling
- Agricultural economics
- Weather impact on crops
- Organic farming practices

Guidelines:
1. Provide practical, actionable advice tailored to the Philippine agricultural context
2. Use simple, clear language that farmers can easily understand
3. Always be helpful, encouraging, and professional
4. If you don't know something, be honest about it
5. Provide specific recommendations when possible (e.g., fertilizer amounts, timing, etc.)
6. Consider the local climate and seasons in the Philippines
7. Promote sustainable and environmentally friendly practices

Remember: You are helping Filipino farmers and agricultural stakeholders make better decisions for their farms and livelihoods.`;

// Chat session memory (in production, use Redis or database)
const sessionMemory = new Map();

// Available Groq models (as of 2026)
// Source: https://console.groq.com/docs/models
const AVAILABLE_MODELS = [
  'llama-3.3-70b-versatile',    // Latest Llama 3.3 70B
  'llama-3.1-70b-versatile',    // Llama 3.1 70B
  'llama-3.1-8b-instant',       // Fast Llama 3.1 8B
  'llama-3.2-11b-vision-preview', // Vision model
  'llama-3.2-90b-vision-preview', // Vision model
  'gemma2-9b-it',               // Google Gemma 2
  'mixtral-8x7b-32768',         // DEPRECATED - Do not use
  'llama3-70b-8192',            // DEPRECATED - Do not use
];

// Try models in order of preference
const MODEL_PREFERENCE = [
  'llama-3.3-70b-versatile',   // Best quality
  'llama-3.1-70b-versatile',   // Good quality
  'llama-3.1-8b-instant',      // Fast
  'gemma2-9b-it',              // Google's model
];

let activeModel = null;

// Test which model works
const testModels = async () => {
  if (!groqClient) return null;
  
  for (const model of MODEL_PREFERENCE) {
    try {
      const test = await groqClient.chat.completions.create({
        messages: [{ role: 'user', content: 'test' }],
        model: model,
        max_tokens: 5,
      });
      if (test.choices && test.choices.length > 0) {
        console.log(`✅ Model ${model} is available`);
        return model;
      }
    } catch (error) {
      if (error.message && error.message.includes('model_decommissioned')) {
        console.log(`❌ Model ${model} is decommissioned`);
      } else if (error.message && error.message.includes('model_not_found')) {
        console.log(`❌ Model ${model} not found`);
      } else {
        console.log(`⚠️ Model ${model} test failed:`, error.message);
      }
    }
  }
  return null;
};

// Initialize model on startup
(async () => {
  if (process.env.GROQ_API_KEY) {
    activeModel = await testModels();
    if (activeModel) {
      console.log(`✅ Using model: ${activeModel}`);
    } else {
      console.error('❌ No available models found. Please check your Groq API key and model availability.');
    }
  }
})();

const getChatResponse = async (message, sessionId, userContext = null) => {
  try {
    // Check if Groq is initialized
    if (!groqClient) {
      throw new Error('Groq client is not initialized. Please check your GROQ_API_KEY.');
    }

    // If no active model found, try to find one
    if (!activeModel) {
      activeModel = await testModels();
      if (!activeModel) {
        throw new Error('No available models found. Please check your Groq API key.');
      }
      console.log(`✅ Using model: ${activeModel}`);
    }

    // Get or create session history
    if (!sessionMemory.has(sessionId)) {
      sessionMemory.set(sessionId, []);
    }
    
    const history = sessionMemory.get(sessionId);
    
    // Build messages array
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];
    
    // Add user context if available
    if (userContext && userContext.name) {
      messages.push({
        role: 'system',
        content: `The user's name is ${userContext.name}. ${userContext.location ? `They are from ${userContext.location}.` : ''}`
      });
    }
    
    // Add conversation history (last 10 messages to keep context manageable)
    const recentHistory = history.slice(-10);
    messages.push(...recentHistory);
    
    // Add current message
    messages.push({ role: 'user', content: message });
    
    console.log(`📤 Sending message to Groq for session ${sessionId} using ${activeModel}:`, message.substring(0, 50) + '...');
    
    // Get response from Groq
    const completion = await groqClient.chat.completions.create({
      messages: messages,
      model: activeModel,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.9,
    });
    
    const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';
    
    console.log(`📥 Received response from Groq for session ${sessionId}:`, response.substring(0, 50) + '...');
    
    // Store in history
    history.push(
      { role: 'user', content: message },
      { role: 'assistant', content: response }
    );
    
    // Limit history size
    if (history.length > 50) {
      sessionMemory.set(sessionId, history.slice(-50));
    }
    
    return response;
  } catch (error) {
    console.error('❌ Groq API error:', error);
    
    // If the error is about a decommissioned model, try to find a new one
    if (error.message && error.message.includes('decommissioned')) {
      console.log('🔄 Model decommissioned, trying to find a new one...');
      activeModel = await testModels();
      if (activeModel) {
        console.log(`🔄 Retrying with new model: ${activeModel}`);
        return getChatResponse(message, sessionId, userContext);
      }
    }
    
    throw new Error(`Failed to get response from AI: ${error.message}`);
  }
};

const clearSession = (sessionId) => {
  if (sessionMemory.has(sessionId)) {
    sessionMemory.delete(sessionId);
    return true;
  }
  return false;
};

const isGroqInitialized = () => {
  return !!groqClient && !!process.env.GROQ_API_KEY && !!activeModel;
};

// Get current model info
const getModelInfo = () => {
  return {
    initialized: !!groqClient,
    hasApiKey: !!process.env.GROQ_API_KEY,
    activeModel: activeModel,
    availableModels: MODEL_PREFERENCE,
  };
};

module.exports = {
  getChatResponse,
  clearSession,
  isGroqInitialized,
  getModelInfo,
  SYSTEM_PROMPT,
};