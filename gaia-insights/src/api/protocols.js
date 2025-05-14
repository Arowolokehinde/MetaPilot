// src/api/protocols.js
const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/protocols
 * @desc    Get list of supported protocols for insights
 * @access  Public
 */
router.get('/', (req, res) => {
  // List of protocols supported by the insights feature
  const protocols = [
    {
      id: 'uniswap',
      name: 'Uniswap',
      description: 'Leading decentralized exchange on Ethereum',
      icon: '/icons/uniswap.svg',
      enabled: true
    },
    {
      id: 'aave',
      name: 'Aave',
      description: 'Decentralized lending and borrowing protocol',
      icon: '/icons/aave.svg',
      enabled: false // Not yet implemented
    },
    {
      id: 'compound',
      name: 'Compound',
      description: 'Algorithmic money market protocol',
      icon: '/icons/compound.svg',
      enabled: false // Not yet implemented
    }
  ];
  
  res.json(protocols);
});

module.exports = router;