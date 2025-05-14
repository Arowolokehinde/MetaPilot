// src/api/uniswap.js
const express = require('express');
const router = express.Router();
const { fetchUniswapData } = require('../services/graphService');
const { analyzeWithGaia } = require('../services/gaiaService');

/**
 * @route   GET /api/uniswap/insights
 * @desc    Fetch Uniswap data from TheGraph and analyze with Gaia
 * @access  Public
 */
router.get('/insights', async (req, res) => {
  try {
    // Get optional parameters
    const { address, includeActions = 'true' } = req.query;
    
    // Fetch data from TheGraph
    console.log('Fetching Uniswap data from TheGraph...');
    const data = await fetchUniswapData({
      userAddress: address,
      dayCount: 7,
      topPoolCount: 10,
      topTokenCount: 10,
      recentSwapCount: 20
    });
    
    // Use Gaia to analyze the data
    console.log('Analyzing data with Gaia...');
    const insights = await analyzeWithGaia(data, includeActions === 'true');
    
    // Return the insights
    res.json({
      timestamp: new Date().toISOString(),
      insights,
      rawData: {
        protocol: data.protocol,
        topPools: data.topPools.slice(0, 5),
        topTokens: data.topTokens.slice(0, 5),
        trends: data.trends
      }
    });
  } catch (error) {
    console.error('Error fetching Uniswap insights:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/uniswap/pools
 * @desc    Fetch top Uniswap pools
 * @access  Public
 */
router.get('/pools', async (req, res) => {
  try {
    const { count = 10 } = req.query;
    
    // Fetch only pool data from TheGraph
    const data = await fetchUniswapData({
      topPoolCount: parseInt(count),
      dayCount: 1,
      topTokenCount: 0,
      recentSwapCount: 0
    });
    
    res.json({
      timestamp: new Date().toISOString(),
      pools: data.topPools
    });
  } catch (error) {
    console.error('Error fetching Uniswap pools:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/uniswap/tokens
 * @desc    Fetch top Uniswap tokens
 * @access  Public
 */
router.get('/tokens', async (req, res) => {
  try {
    const { count = 10 } = req.query;
    
    // Fetch only token data from TheGraph
    const data = await fetchUniswapData({
      topTokenCount: parseInt(count),
      dayCount: 1,
      topPoolCount: 0,
      recentSwapCount: 0
    });
    
    res.json({
      timestamp: new Date().toISOString(),
      tokens: data.topTokens
    });
  } catch (error) {
    console.error('Error fetching Uniswap tokens:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;