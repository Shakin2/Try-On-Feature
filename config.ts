
/**
 * Application Configuration
 * 
 * INSTRUCTIONS FOR CLOUD SHELL:
 * 1. Copy the values for your project into the empty strings below.
 * 2. If using the Python backend style, ensure your environment variables are set.
 */

export const CONFIG = {
  // ==========================================
  // 1. CLIENT DEFINITIONS (Enter values here)
  // ==========================================
  
  // Your Google Cloud Project ID (e.g., "my-genai-project-123")
  PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT || "projectID here", 

  // Your Cloud Region (e.g., "us-central1")
  LOCATION: process.env.GOOGLE_CLOUD_REGION || "us-central1",

  // Your API Key (Get from AI Studio: https://aistudio.google.com/app/apikey)
  API_KEY: process.env.API_KEY || "", 

  // ==========================================
  // 2. MODEL DEFINITIONS
  // ==========================================
  MODELS: {
    // Standard high-quality image generation
    FLASH: 'gemini-2.5-flash-image',
    
    // The specialized Virtual Try-On model
    // Note: This model may require whitelisting or specific Vertex AI access
    VIRTUAL_TRY_ON: 'virtual-try-on-preview-08-04',
    
    // Video generation model
    VEO: 'veo-3.1-generate-preview',
  }
};

// Helper to log configuration status
console.log("Config loaded. Project:", CONFIG.PROJECT_ID !== "projectID here" ? CONFIG.PROJECT_ID : "Not Set");
console.log("Config loaded. API Key:", CONFIG.API_KEY ? "Present" : "Missing");
