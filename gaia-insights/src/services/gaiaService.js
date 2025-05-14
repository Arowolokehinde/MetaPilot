// src/services/gaiaService.js
const axios = require('axios');
require('dotenv').config();

// Configure the Gaia AI endpoint
const LLAMA_API_URL = process.env.LLAMA_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const LLAMA_API_KEY = process.env.LLAMA_API_KEY;

/**
 * Analyze data using Gaia AI
 * @param {Object} data - The data to analyze
 * @param {boolean} includeActions - Whether to include suggested actions
 * @returns {Promise<Object>} AI-generated insights
 */
async function analyzeWithGaia(data, includeActions = true) {
  try {
    console.log('Analyzing data with Gaia, API endpoint:', LLAMA_API_URL);
    console.log('API key present:', !!LLAMA_API_KEY);
    
    // Check if we have valid input data
    if (!data) {
      console.error('Error: No data provided to analyzeWithGaia');
      return {
        market: 'Unable to generate market analysis: No data provided',
        actions: { 
          text: 'Unable to generate action recommendations: No data provided',
          structured: []
        },
        personal: null
      };
    }
    
    // Format data for the AI
    const formattedData = formatDataForGaia(data);
    console.log('Formatted data for Gaia:', JSON.stringify(formattedData, null, 2));
    
    // Generate market analysis
    const marketAnalysis = await generateMarketAnalysis(formattedData);
    
    // Generate action recommendations if requested
    let actionRecommendations = null;
    if (includeActions) {
      actionRecommendations = await generateActionRecommendations(formattedData);
    }
    
    // Generate personal insights if user positions available
    let personalInsights = null;
    if (data.userPositions && data.userPositions.length > 0) {
      personalInsights = await generatePersonalInsights(data.userPositions, formattedData);
    }
    
    return {
      market: marketAnalysis,
      actions: actionRecommendations,
      personal: personalInsights
    };
  } catch (error) {
    console.error('Error analyzing with Gaia:', error);
    
    // Return more detailed error information
    return {
      market: `Unable to generate market analysis: ${error.message}`,
      actions: { 
        text: `Unable to generate action recommendations: ${error.message}`,
        structured: []
      },
      personal: null
    };
  }
}

/**
 * Format data for Gaia AI analysis
 */
function formatDataForGaia(data) {
  try {
    const formatted = {
      protocol: {},
      pools: [],
      tokens: [],
      trends: {},
      swaps: []
    };
    
    // Format protocol metrics
    if (data.protocol && data.protocol.length > 0) {
      const latest = data.protocol[data.protocol.length - 1];
      formatted.protocol = {
        date: latest.date,
        volumeUSD: formatCurrency(latest.volumeUSD),
        tvlUSD: formatCurrency(latest.tvlUSD),
        feesUSD: formatCurrency(latest.feesUSD),
        txCount: formatNumber(latest.txCount)
      };
    } else {
      console.warn('Warning: No protocol data available');
    }
    
    // Format top pools
    if (data.topPools && data.topPools.length > 0) {
      formatted.pools = data.topPools.slice(0, 5).map(pool => ({
        name: pool.name,
        feeTier: `${pool.feeTier}%`,
        volumeUSD: formatCurrency(pool.volumeUSD),
        tvlUSD: formatCurrency(pool.tvlUSD),
        feesUSD: formatCurrency(pool.feesUSD)
      }));
    } else {
      console.warn('Warning: No top pools data available');
    }
    
    // Format top tokens
    if (data.topTokens && data.topTokens.length > 0) {
      formatted.tokens = data.topTokens.slice(0, 5).map(token => ({
        symbol: token.symbol,
        name: token.name,
        volumeUSD: formatCurrency(token.volumeUSD),
        tvlUSD: formatCurrency(token.tvlUSD)
      }));
    } else {
      console.warn('Warning: No top tokens data available');
    }
    
    // Format trends - Handle empty arrays more gracefully
    if (data.trends) {
      formatted.trends = {
        volume: data.trends.volumeChange !== undefined ? `${formatNumber(data.trends.volumeChange)}%` : '0%',
        tvl: data.trends.tvlChange !== undefined ? `${formatNumber(data.trends.tvlChange)}%` : '0%',
        fees: data.trends.feesChange !== undefined ? `${formatNumber(data.trends.feesChange)}%` : '0%'
      };
      
      // Only add these if they exist and have items
      if (data.trends.topGrowingPools && data.trends.topGrowingPools.length > 0) {
        formatted.trends.topGrowingPools = data.trends.topGrowingPools.map(p => ({
          name: p.pairName,
          volumeChange: `${formatNumber(p.volumeChange)}%`
        }));
      } else {
        formatted.trends.topGrowingPools = [{ name: "No growing pools data available", volumeChange: "0%" }];
      }
      
      if (data.trends.topGrowingTokens && data.trends.topGrowingTokens.length > 0) {
        formatted.trends.topGrowingTokens = data.trends.topGrowingTokens.map(t => ({
          symbol: t.symbol,
          volumeChange: `${formatNumber(t.volumeChange)}%`,
          priceChange: t.priceChange ? `${formatNumber(t.priceChange)}%` : '0%'
        }));
      } else {
        formatted.trends.topGrowingTokens = [{ symbol: "No growing tokens data available", volumeChange: "0%", priceChange: "0%" }];
      }
    } else {
      console.warn('Warning: No trends data available');
      formatted.trends = {
        volume: '0%',
        tvl: '0%',
        fees: '0%',
        topGrowingPools: [{ name: "No data", volumeChange: "0%" }],
        topGrowingTokens: [{ symbol: "No data", volumeChange: "0%", priceChange: "0%" }]
      };
    }
    
    // Format recent swaps
    if (data.trends && data.trends.largeSwaps && data.trends.largeSwaps.length > 0) {
      formatted.swaps = data.trends.largeSwaps.slice(0, 5).map(swap => ({
        pair: swap.pairName,
        amountUSD: formatCurrency(swap.amountUSD),
        time: new Date(swap.timestamp * 1000).toLocaleString()
      }));
    } else if (data.recentSwaps && data.recentSwaps.length > 0) {
      formatted.swaps = data.recentSwaps.slice(0, 5).map(swap => ({
        pair: swap.pairName,
        amountUSD: formatCurrency(swap.amountUSD),
        time: new Date(swap.timestamp * 1000).toLocaleString()
      }));
    } else {
      console.warn('Warning: No swaps data available');
    }
    
    return formatted;
  } catch (error) {
    console.error('Error formatting data for Gaia:', error);
    throw new Error(`Failed to format data: ${error.message}`);
  }
}

/**
 * Generate market analysis using Gaia AI
 */
async function generateMarketAnalysis(formattedData) {
  // Create a prompt for the AI model
  const prompt = `
You are a DeFi protocol analyst specializing in Uniswap data. Analyze this data and provide insights on market trends, liquidity conditions, and noteworthy activity.

PROTOCOL METRICS:
Volume (24h): ${formattedData.protocol.volumeUSD || 'No data'}
TVL: ${formattedData.protocol.tvlUSD || 'No data'}
Fees (24h): ${formattedData.protocol.feesUSD || 'No data'}
Transactions (24h): ${formattedData.protocol.txCount || 'No data'}

TRENDS:
Volume change: ${formattedData.trends.volume || 'No data'}
TVL change: ${formattedData.trends.tvl || 'No data'}
Fees change: ${formattedData.trends.fees || 'No data'}

TOP POOLS BY VOLUME:
${formattedData.pools && formattedData.pools.length > 0 ? 
  formattedData.pools.map(pool => 
    `- ${pool.name} (${pool.feeTier}): Volume ${pool.volumeUSD}, TVL ${pool.tvlUSD}`
  ).join('\n') : 'No pool data available'}

FASTEST GROWING POOLS:
${formattedData.trends.topGrowingPools && formattedData.trends.topGrowingPools.length > 0 ? 
  formattedData.trends.topGrowingPools.map(pool => 
    `- ${pool.name}: Volume change ${pool.volumeChange}`
  ).join('\n') : 'No growing pool data available'}

TOP TOKENS BY VOLUME:
${formattedData.tokens && formattedData.tokens.length > 0 ? 
  formattedData.tokens.map(token => 
    `- ${token.symbol}: Volume ${token.volumeUSD}, TVL ${token.tvlUSD}`
  ).join('\n') : 'No token data available'}

FASTEST GROWING TOKENS:
${formattedData.trends.topGrowingTokens && formattedData.trends.topGrowingTokens.length > 0 ? 
  formattedData.trends.topGrowingTokens.map(token => 
    `- ${token.symbol}: Volume change ${token.volumeChange}, Price change ${token.priceChange || 'N/A'}`
  ).join('\n') : 'No growing token data available'}

Please provide your analysis with these sections:
1. MARKET SUMMARY: A brief overview of Uniswap's current state (2-3 sentences)
2. KEY OBSERVATIONS: 3-4 notable trends or patterns you observe
3. POOL ACTIVITY: Analysis of which pools are seeing significant activity and why
4. TOKEN MOMENTUM: Which tokens are gaining traction and potential reasons
5. MARKET SENTIMENT: Overall assessment of market sentiment based on this data
`;

  try {
    console.log('Generating market analysis with prompt:', prompt);
    // Call Gaia AI
    const response = await callGaiaAI(prompt, 'You are a professional DeFi analyst providing concise, data-driven insights.');
    return response;
  } catch (error) {
    console.error('Error generating market analysis:', error);
    return `Unable to generate market analysis at this time: ${error.message}`;
  }
}

/**
 * Generate action recommendations using Gaia AI
 */
async function generateActionRecommendations(formattedData) {
  // Create a prompt for the AI model
  const prompt = `
You are a DeFi automation advisor for MetaPilot, a tool that can execute actions on behalf of users. Based on the current Uniswap market data, suggest specific actionable tasks that would be beneficial.

MARKET DATA:
Volume trend: ${formattedData.trends.volume || 'No data'}
TVL trend: ${formattedData.trends.tvl || 'No data'}
Fees trend: ${formattedData.trends.fees || 'No data'}

TOP GROWING POOLS:
${formattedData.trends.topGrowingPools && formattedData.trends.topGrowingPools.length > 0 ? 
  formattedData.trends.topGrowingPools.map(pool => 
    `- ${pool.name}: Volume change ${pool.volumeChange}`
  ).join('\n') : 'No growing pool data available'}

TOP GROWING TOKENS:
${formattedData.trends.topGrowingTokens && formattedData.trends.topGrowingTokens.length > 0 ? 
  formattedData.trends.topGrowingTokens.map(token => 
    `- ${token.symbol}: Volume change ${token.volumeChange}, Price change ${token.priceChange || 'N/A'}`
  ).join('\n') : 'No growing token data available'}

Suggest 3-5 specific actions the user could automate with MetaPilot, such as:
1. Providing liquidity to specific pools
2. Setting up token swap rules based on price conditions
3. Creating arbitrage opportunities between related pairs
4. Implementing dollar-cost averaging strategies for trending tokens
5. Setting up automatic fee harvesting for pools with high volume

For each action, include:
- A clear title describing the action
- Specific parameters (tokens, pools, thresholds)
- Rationale based on the current market data
- Expected benefit or outcome
`;

  try {
    console.log('Generating action recommendations with prompt:', prompt);
    // Call Gaia AI
    const response = await callGaiaAI(prompt, 'You are a DeFi automation advisor suggesting specific actionable tasks for MetaPilot.');
    
    // Extract structured actions from text
    const structuredActions = parseActionRecommendations(response);
    
    return {
      text: response,
      structured: structuredActions
    };
  } catch (error) {
    console.error('Error generating action recommendations:', error);
    return {
      text: `Unable to generate action recommendations at this time: ${error.message}`,
      structured: []
    };
  }
}

/**
 * Generate personal insights for a user's positions
 */
async function generatePersonalInsights(userPositions, formattedData) {
  if (!userPositions || userPositions.length === 0) {
    return null;
  }
  
  // Format user position data
  const positionsFormatted = userPositions.map(position => ({
    pairName: position.pairName,
    liquidity: position.liquidity,
    depositedToken0: position.depositedToken0,
    depositedToken1: position.depositedToken1,
    collectedFeesToken0: position.collectedFeesToken0,
    collectedFeesToken1: position.collectedFeesToken1
  }));
  
  // Create a prompt for the AI model
  const prompt = `
You are a personal DeFi advisor. The user has the following liquidity positions on Uniswap:

USER POSITIONS:
${positionsFormatted.map(position => 
  `- ${position.pairName}: Deposited ${position.depositedToken0} and ${position.depositedToken1}, Collected ${position.collectedFeesToken0} and ${position.collectedFeesToken1} in fees`
).join('\n')}

Based on the current market data:

TRENDING POOLS:
${formattedData.trends.topGrowingPools && formattedData.trends.topGrowingPools.length > 0 ? 
  formattedData.trends.topGrowingPools.map(pool => 
    `- ${pool.name}: Volume change ${pool.volumeChange}`
  ).join('\n') : 'No growing pool data available'}

TRENDING TOKENS:
${formattedData.trends.topGrowingTokens && formattedData.trends.topGrowingTokens.length > 0 ? 
  formattedData.trends.topGrowingTokens.map(token => 
    `- ${token.symbol}: Volume change ${token.volumeChange}, Price change ${token.priceChange || 'N/A'}`
  ).join('\n') : 'No growing token data available'}

Please provide personalized insights for this user:
1. POSITION ASSESSMENT: How are their current positions performing relative to market trends?
2. OPPORTUNITY ALERT: Based on their current exposure, what opportunities might they consider?
3. RISK ANALYSIS: Are any of their positions exposed to negative trends or increased volatility?
4. OPTIMIZATION SUGGESTIONS: How might they optimize their positions for better returns?
`;

  try {
    // Call Gaia AI
    const response = await callGaiaAI(prompt, 'You are a personalized DeFi advisor helping the user understand their Uniswap positions.');
    return response;
  } catch (error) {
    console.error('Error generating personal insights:', error);
    return `Unable to generate personal insights at this time: ${error.message}`;
  }
}

/**
 * Call Gaia AI with a prompt
 */
async function callGaiaAI(prompt, systemPrompt) {
  try {
    console.log(`Calling Gaia AI at ${LLAMA_API_URL}`);
    
    // Verify API key is available
    if (!LLAMA_API_KEY) {
      throw new Error('LLAMA_API_KEY is missing');
    }
    
    const payload = {
      model: process.env.LLAMA_API_MODEL || 'llama8b',
      messages: [
        {
          role: 'system',
          content: systemPrompt || 'You are a professional DeFi analyst providing insights on Uniswap data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    };
    
    console.log('Request payload to Gaia:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(LLAMA_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${LLAMA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
    
    console.log('Gaia API response status:', response.status);
    
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else {
      console.error('Invalid response structure from Gaia AI:', JSON.stringify(response.data, null, 2));
      throw new Error('Invalid response from Gaia AI: No choices found in response');
    }
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response from Gaia AI:', error.response.status, error.response.data);
      throw new Error(`Gaia API returned ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from Gaia AI:', error.request);
      throw new Error('No response received from Gaia AI - check endpoint and network');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up Gaia AI request:', error.message);
      throw error;
    }
  }
}

/**
 * Parse AI response to extract structured action recommendations
 */
function parseActionRecommendations(text) {
  try {
    // This is a simple parser - in production, use more robust techniques
    const actionRegex = /(?:^|\n)(\d+\.\s+)([^\n:]+):(.*?)(?=(?:\n\d+\.\s+)|$)/gs;
    const actions = [];
    
    let match;
    while ((match = actionRegex.exec(text)) !== null) {
      const title = match[2].trim();
      const details = match[3].trim();
      
      // Extract tokens from the action title and details
      const tokenRegex = /\b([A-Z]{2,10})\b/g;
      const tokens = new Set();
      let tokenMatch;
      
      while ((tokenMatch = tokenRegex.exec(title)) !== null) {
        tokens.add(tokenMatch[1]);
      }
      
      while ((tokenMatch = tokenRegex.exec(details)) !== null) {
        tokens.add(tokenMatch[1]);
      }
      
      // Determine action type based on keywords
      let actionType = 'generic';
      if (/liquidity|pool|provide/i.test(title)) {
        actionType = 'provideLiquidity';
      } else if (/swap|exchange|trade/i.test(title)) {
        actionType = 'swap';
      } else if (/arbitrage/i.test(title)) {
        actionType = 'arbitrage';
      } else if (/stake|staking/i.test(title)) {
        actionType = 'stake';
      } else if (/harvest|claim|collect|fee/i.test(title)) {
        actionType = 'harvestFees';
      }
      
      actions.push({
        title,
        details,
        actionType,
        tokens: Array.from(tokens),
        confidence: 0.85 // Default confidence score
      });
    }
    
    return actions;
  } catch (error) {
    console.error('Error parsing action recommendations:', error);
    return [];
  }
}

/**
 * Formatting helper functions
 */
function formatCurrency(value) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  } catch (error) {
    console.error('Error formatting currency value:', value, error);
    return '$0';
  }
}

function formatNumber(value) {
  try {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2
    }).format(value);
  } catch (error) {
    console.error('Error formatting number value:', value, error);
    return '0';
  }
}

// Export the function
module.exports = {
  analyzeWithGaia
};