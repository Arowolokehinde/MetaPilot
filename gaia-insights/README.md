# MetaPilot  GAIA Insights API

A standalone service that provides AI-powered insights for Web3 protocols using TheGraph data and Gaia AI analysis.

## Overview

MetaPilot Insights API is a hybrid assistant/analytics dashboard that fetches real-time data about DeFi protocols (starting with Uniswap) from TheGraph, analyzes it using Gaia AI, and delivers actionable insights through a RESTful API. This service enables users to:

- Get market analysis and trend detection for protocols
- Receive AI-generated action recommendations tailored to current market conditions
- View personal portfolio insights when providing a wallet address
- Access raw protocol data for custom analysis

## Features

- **Protocol Metrics**: Fetch key metrics like volume, TVL, fees, and more
- **AI Market Analysis**: Get intelligent analysis of current market trends and conditions
- **Action Recommendations**: Receive suggested automated actions based on market data
- **Personal Portfolio Insights**: Analyze your own positions and get tailored advice
- **Multi-Protocol Support**: Designed to support multiple protocols (currently Uniswap v3)

## API Endpoints

### Get Protocol List
```
GET /api/protocols
```
Returns a list of all supported protocols with metadata.

### Get Uniswap Insights
```
GET /api/uniswap/insights
```
Parameters:
- `address` (optional): User wallet address for personalized insights
- `includeActions` (optional): 'true' or 'false' to include action recommendations

### Get Top Uniswap Pools
```
GET /api/uniswap/pools
```
Parameters:
- `count` (optional): Number of pools to return (default: 10)

### Get Top Uniswap Tokens
```
GET /api/uniswap/tokens
```
Parameters:
- `count` (optional): Number of tokens to return (default: 10)

## Data Sources

- **TheGraph**: For fetching on-chain data from Uniswap v3
  - Protocol-wide metrics (volume, TVL, fees)
  - Pool-specific data (liquidity, volume by pool)
  - Token data (prices, volume by token)
  - User positions (when address is provided)

- **Gaia AI**: For generating insights and recommendations
  - Market analysis
  - Trend detection
  - Action recommendations
  - Personal portfolio advice

## Setup Requirements

### Environment Variables

Create a `.env` file with the following variables:

```
# API Configuration
PORT=3000

# Gaia AI Configuration
GAIA_API_ENDPOINT=https://llama8b.gaia.domains/v1/chat/completions
GAIA_API_KEY=your_gaia_api_key
GAIA_MODEL_NAME=llama8b

# TheGraph API Configuration
THEGRAPH_API_KEY=your_thegraph_api_key
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/metapilot-insights.git
cd metapilot-insights

# Install dependencies
npm install

# Start the server
npm start
```

## Example Response

```json
{
  "timestamp": "2025-05-14T02:32:29.869Z",
  "insights": {
    "market": "Market analysis text from Gaia AI...",
    "actions": {
      "text": "Action recommendations text...",
      "structured": [
        {
          "title": "Provide Liquidity to ETH/USDC Pool",
          "details": "Details about this recommendation...",
          "actionType": "provideLiquidity",
          "tokens": ["ETH", "USDC"],
          "confidence": 0.85
        }
      ]
    },
    "personal": "Personal insights when wallet address provided..."
  },
  "rawData": {
    "protocol": [
      {
        "date": "2025-05-14",
        "volumeUSD": 146446361.7935155,
        "tvlUSD": 2213513307509.605,
        "feesUSD": 189794.94912440772,
        "txCount": 91818720
      }
    ],
    "topPools": [
      {
        "id": "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
        "name": "USDC/WETH",
        "feeTier": 0.05,
        "volumeUSD": 555830832867.0854,
        "tvlUSD": 425509900.6733357
      }
    ],
    "topTokens": [
      {
        "id": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "symbol": "WETH",
        "name": "Wrapped Ether",
        "volumeUSD": 1326513749721.4287,
        "tvlUSD": 1621683163.1773071
      }
    ],
    "trends": {
      "volumeChange": -89.12142525989992,
      "tvlChange": 19.920591456947168,
      "feesChange": -86.65528322908965
    }
  }
}
```

## Integration with MetaPilot

This insights API is designed to integrate with MetaPilot's automation features. Action recommendations can be directly used to create automated tasks that execute when specific market conditions are met.

```javascript
// Example: Creating a task from an insight
async function createTaskFromInsight(action) {
  const taskToCreate = {
    type: action.actionType,
    parameters: {
      tokens: action.tokens,
      // Other parameters based on action type
    }
  };
  
  const task = await metapilot.createTask(taskToCreate);
  return task;
}
```

## Architecture

- **Express.js API**: Handles HTTP requests and responses
- **Services Layer**: 
  - `graphService.js`: Fetches data from TheGraph
  - `gaiaService.js`: Processes data with Gaia AI
- **API Routes**: 
  - `insightsRoutes.js`: Exposes insights endpoints

## Future Enhancements

- Support for additional protocols (Aave, Compound, etc.)
- Historical trend analysis and comparison
- Advanced filtering and query parameters
- WebSocket support for real-time updates
- Caching layer for improved performance

## License
