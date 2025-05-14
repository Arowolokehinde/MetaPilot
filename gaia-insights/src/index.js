// // src/index.js
// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();

// // Validate essential environment variables
// if (!process.env.THEGRAPH_KEY) {
//   console.error('ERROR: THEGRAPH_KEY is not set in the environment variables');
//   console.error('Please set this variable in your .env file');
//   process.exit(1); // Exit with error
// }

// if (!process.env.GAIA_API_KEY) {
//   console.error('WARNING: GAIA_API_KEY is not set in the environment variables');
//   console.error('AI analysis features will not work without this key');
// }

// // Import API routes
// const uniswapRoutes = require('./api/uniswap');
// const protocolsRoutes = require('./api/protocols');

// // Initialize express app
// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Request logging
// app.use((req, res, next) => {
//   console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
//   next();
// });

// // API routes
// app.use('/api/uniswap', uniswapRoutes);
// app.use('/api/protocols', protocolsRoutes);

// // Home route
// app.get('/', (req, res) => {
//   res.json({
//     message: 'MetaPilot Insights API',
//     endpoints: {
//       protocols: '/api/protocols',
//       uniswapInsights: '/api/uniswap/insights',
//       uniswapPools: '/api/uniswap/pools',
//       uniswapTokens: '/api/uniswap/tokens'
//     },
//     version: '1.0.0',
//     status: 'operational'
//   });
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error('Error:', err);
//   res.status(500).json({ error: err.message || 'Something went wrong' });
// });

// // Start server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log(`TheGraph API: ${process.env.THEGRAPH_KEY ? 'Configured ✓' : 'Missing ✗'}`);
//   console.log(`Gaia AI API: ${process.env.GAIA_API_KEY ? 'Configured ✓' : 'Missing ✗'}`);
//   console.log(`Visit http://localhost:${PORT} to see available endpoints`);
// });


// src/index.js
const express = require('express');
const dotenv = require('dotenv');
const uniswapRoutes = require('./api/uniswap');
const protocolsRoutes = require('./api/protocols');

// Load environment variables
dotenv.config();

// Create express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Validate required environment variables
function validateEnvVariables() {
  const requiredVars = [
    'LLAMA_API_KEY',
    'LLAMA_API_URL'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please check your .env file and ensure all required variables are set.');
    return false;
  }
  
  return true;
}

// Routes
app.use('/api/uniswap', uniswapRoutes);
app.use('/api/protocols', protocolsRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Gaia Insights API is running',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Start server
if (validateEnvVariables()) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`API available at http://localhost:${port}/api`);
    console.log(`Gaia API Endpoint: ${process.env.LLAMA_API_URL}`);
    console.log(`Gaia API Key is ${process.env.LLAMA_API_KEY ? 'set' : 'NOT SET'}`);
  });
} else {
  console.log('Server startup aborted due to missing environment variables');
}