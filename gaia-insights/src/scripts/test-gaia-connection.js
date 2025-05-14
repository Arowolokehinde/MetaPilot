// scripts/test-gaia-connection.js
require('dotenv').config();
const axios = require('axios');

// Get environment variables
const LLAMA_API_URL = process.env.LLAMA_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const LLAMA_API_KEY = process.env.LLAMA_API_KEY;
const LLAMA_API_MODEL = process.env.LLAMA_API_MODEL || 'llama3-8b-8192';

async function testConnection() {
  console.log('Testing connection to Gaia AI Service...');
  console.log(`Endpoint: ${LLAMA_API_URL}`);
  console.log(`API Key Present: ${LLAMA_API_KEY ? 'Yes' : 'No'}`);
  console.log(`Model: ${LLAMA_API_MODEL}`);
  
  if (!LLAMA_API_KEY) {
    console.error('ERROR: No API key provided. Please set LLAMA_API_KEY in your .env file.');
    return;
  }
  
  try {
    const response = await axios.post(
        LLAMA_API_URL,
      {
        model: LLAMA_API_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: 'Hello, can you hear me? Please respond with a simple confirmation.'
          }
        ],
        temperature: 0.7,
        max_tokens: 4096
      },
      {
        headers: {
          'Authorization': `Bearer ${LLAMA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );
    
    console.log('SUCCESS: Received response from Gaia AI');
    console.log('Status Code:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('ERROR: Failed to connect to Gaia AI');
    
    if (error.response) {
      // The server responded with a status code outside of 2xx
      console.error('Response Status:', error.response.status);
      console.error('Response Headers:', error.response.headers);
      console.error('Response Data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. The endpoint might be incorrect or unreachable.');
    } else {
      // Something happened in setting up the request
      console.error('Error Message:', error.message);
    }
  }
}

// Run the test
testConnection().catch(err => {
  console.error('Unexpected error:', err);
});