// // src/services/graphService.js
// const axios = require('axios');
// require('dotenv').config();

// // The Graph API endpoint for Uniswap v3
// const UNISWAP_SUBGRAPH_URL = `https://gateway.thegraph.com/api/${process.env.THEGRAPH_KEY}/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV`;



// /**
//  * Fetches Uniswap data from TheGraph
//  * @param {Object} options - Configuration options
//  * @param {number} options.dayCount - Number of days of historical data to fetch
//  * @param {number} options.topPoolCount - Number of top pools to fetch
//  * @param {number} options.topTokenCount - Number of top tokens to fetch
//  * @param {number} options.recentSwapCount - Number of recent swaps to fetch
//  * @param {string} options.userAddress - Optional wallet address for position data
//  * @returns {Promise<Object>} Protocol data
//  */
// async function fetchUniswapData({
//   dayCount = 7,
//   topPoolCount = 10,
//   topTokenCount = 10,
//   recentSwapCount = 20,
//   userAddress = null
// } = {}) {
//   try {
//     // Execute queries in parallel based on what's needed
//     const queries = [];
//     const queryTypes = [];
    
//     // Always get protocol overview data
//     if (dayCount > 0) {
//       queries.push(executeQuery(buildUniswapDayDatasQuery(dayCount)));
//       queryTypes.push('uniswapDayDatas');
//     }
    
//     // Get top pools if requested
//     if (topPoolCount > 0) {
//       queries.push(executeQuery(buildTopPoolsQuery(topPoolCount)));
//       queryTypes.push('topPools');
      
//       // Also get pool day data
//       queries.push(executeQuery(buildPoolDayDatasQuery(topPoolCount, dayCount)));
//       queryTypes.push('poolDayDatas');
//     }
    
//     // Get top tokens if requested
//     if (topTokenCount > 0) {
//       queries.push(executeQuery(buildTopTokensQuery(topTokenCount)));
//       queryTypes.push('topTokens');
      
//       // Also get token day data
//       queries.push(executeQuery(buildTokenDayDatasQuery(topTokenCount, dayCount)));
//       queryTypes.push('tokenDayDatas');
//     }
    
//     // Get recent swaps if requested
//     if (recentSwapCount > 0) {
//       queries.push(executeQuery(buildRecentSwapsQuery(recentSwapCount)));
//       queryTypes.push('recentSwaps');
//     }
    
//     // If user address is provided, get position data
//     if (userAddress) {
//       queries.push(executeQuery(buildPositionSnapshotsQuery(userAddress)));
//       queryTypes.push('userPositions');
//     }
    
//     // Execute all queries in parallel
//     const results = await Promise.all(queries);
    
//     // Combine results
//     const data = {};
    
//     results.forEach((result, index) => {
//       const queryType = queryTypes[index];
      
//       switch (queryType) {
//         case 'uniswapDayDatas':
//           data.protocol = processProtocolData(result.data.uniswapDayDatas);
//           break;
//         case 'topPools':
//           data.topPools = processPoolData(result.data.pools);
//           break;
//         case 'poolDayDatas':
//           data.poolDayDatas = processPoolDayDatas(result.data.poolDayDatas);
//           break;
//         case 'topTokens':
//           data.topTokens = processTokenData(result.data.tokens);
//           break;
//         case 'tokenDayDatas':
//           data.tokenDayDatas = processTokenDayDatas(result.data.tokenDayDatas);
//           break;
//         case 'recentSwaps':
//           data.recentSwaps = processSwapData(result.data.swaps);
//           break;
//         case 'userPositions':
//           data.userPositions = processPositionData(result.data.positionSnapshots);
//           break;
//         default:
//           break;
//       }
//     });
    
//     // Calculate derived metrics and trends
//     data.trends = calculateTrends(data);
    
//     return data;
//   } catch (error) {
//     console.error('Error fetching Uniswap data:', error);
//     throw new Error(`Failed to fetch Uniswap data: ${error.message}`);
//   }
// }

// /**
//  * Execute a GraphQL query against The Graph API
//  */
// // async function executeQuery(query) {
// //   try {
// //     const response = await axios.post(UNISWAP_SUBGRAPH_URL, { query });
    
// //     if (response.data.errors) {
// //       throw new Error(response.data.errors[0].message);
// //     }
    
// //     return response.data;
// //   } catch (error) {
// //     console.error('GraphQL query error:', error);
// //     throw error;
// //   }
// // }


// async function executeQuery(query) {
//     try {
//       const response = await axios.post(UNISWAP_SUBGRAPH_URL, { query }, {
//         headers: {
//           'Content-Type': 'application/json'
//           // No need for additional auth headers as the API key is part of the URL
//         }
//       });
      
//       if (response.data.errors) {
//         throw new Error(response.data.errors[0].message);
//       }
      
//       return response.data;
//     } catch (error) {
//       console.error('GraphQL query error:', error);
//       throw error;
//     }
// }



// /**
//  * Query builder functions
//  */
// function buildUniswapDayDatasQuery(dayCount) {
//   return `{
//     uniswapDayDatas(first: ${dayCount}, orderBy: date, orderDirection: desc) {
//       id
//       date
//       volumeUSD
//       tvlUSD
//       feesUSD
//       txCount
//     }
//   }`;
// }

// function buildTopPoolsQuery(count) {
//   return `{
//     pools(first: ${count}, orderBy: volumeUSD, orderDirection: desc) {
//       id
//       feeTier
//       liquidity
//       sqrtPrice
//       token0 {
//         id
//         symbol
//         name
//         decimals
//       }
//       token1 {
//         id
//         symbol
//         name
//         decimals
//       }
//       volumeUSD
//       feesUSD
//       txCount
//       totalValueLockedUSD
//       token0Price
//       token1Price
//     }
//   }`;
// }

// function buildPoolDayDatasQuery(poolCount, dayCount) {
//   return `{
//     poolDayDatas(
//       first: ${poolCount * dayCount},
//       orderBy: date,
//       orderDirection: desc
//     ) {
//       id
//       date
//       pool {
//         id
//         token0 {
//           symbol
//         }
//         token1 {
//           symbol
//         }
//       }
//       volumeUSD
//       feesUSD
//       tvlUSD
//       txCount
//     }
//   }`;
// }

// function buildTopTokensQuery(count) {
//   return `{
//     tokens(first: ${count}, orderBy: volumeUSD, orderDirection: desc) {
//       id
//       symbol
//       name
//       decimals
//       volume
//       volumeUSD
//       txCount
//       totalValueLocked
//       totalValueLockedUSD
//       derivedETH
//     }
//   }`;
// }

// function buildTokenDayDatasQuery(tokenCount, dayCount) {
//   return `{
//     tokenDayDatas(
//       first: ${tokenCount * dayCount},
//       orderBy: date,
//       orderDirection: desc
//     ) {
//       id
//       date
//       token {
//         id
//         symbol
//       }
//       volume
//       volumeUSD
//       txCount
//       totalValueLocked
//       priceUSD
//     }
//   }`;
// }

// function buildRecentSwapsQuery(count) {
//   return `{
//     swaps(first: ${count}, orderBy: timestamp, orderDirection: desc) {
//       timestamp
//       pool {
//         id
//         token0 {
//           symbol
//         }
//         token1 {
//           symbol
//         }
//       }
//       sender
//       recipient
//       amount0
//       amount1
//       amountUSD
//     }
//   }`;
// }

// function buildPositionSnapshotsQuery(userAddress) {
//   return `{
//     positionSnapshots(
//       where: { owner: "${userAddress.toLowerCase()}" },
//       orderBy: timestamp,
//       orderDirection: desc
//     ) {
//       timestamp
//       position {
//         id
//         owner
//         pool {
//           id
//           token0 {
//             symbol
//           }
//           token1 {
//             symbol
//           }
//         }
//       }
//       liquidity
//       depositedToken0
//       depositedToken1
//       withdrawnToken0
//       withdrawnToken1
//       collectedFeesToken0
//       collectedFeesToken1
//     }
//   }`;
// }

// /**
//  * Data processing functions
//  */
// function processProtocolData(uniswapDayDatas) {
//   return uniswapDayDatas.map(day => ({
//     date: new Date(day.date * 1000).toISOString().split('T')[0],
//     timestamp: parseInt(day.date),
//     volumeUSD: parseFloat(day.volumeUSD),
//     tvlUSD: parseFloat(day.tvlUSD),
//     feesUSD: parseFloat(day.feesUSD),
//     txCount: parseInt(day.txCount)
//   })).reverse(); // Reverse for chronological order
// }

// function processPoolData(pools) {
//   return pools.map(pool => ({
//     id: pool.id,
//     name: `${pool.token0.symbol}/${pool.token1.symbol}`,
//     feeTier: parseInt(pool.feeTier) / 10000, // Convert to percentage
//     tokens: [
//       {
//         id: pool.token0.id,
//         symbol: pool.token0.symbol,
//         name: pool.token0.name,
//         decimals: parseInt(pool.token0.decimals)
//       },
//       {
//         id: pool.token1.id,
//         symbol: pool.token1.symbol,
//         name: pool.token1.name,
//         decimals: parseInt(pool.token1.decimals)
//       }
//     ],
//     liquidity: BigInt(pool.liquidity).toString(),
//     volumeUSD: parseFloat(pool.volumeUSD),
//     feesUSD: parseFloat(pool.feesUSD),
//     txCount: parseInt(pool.txCount),
//     tvlUSD: parseFloat(pool.totalValueLockedUSD),
//     token0Price: parseFloat(pool.token0Price),
//     token1Price: parseFloat(pool.token1Price)
//   }));
// }

// function processPoolDayDatas(poolDayDatas) {
//   return poolDayDatas.map(day => ({
//     id: day.id,
//     date: new Date(day.date * 1000).toISOString().split('T')[0],
//     timestamp: parseInt(day.date),
//     poolId: day.pool.id,
//     pairName: `${day.pool.token0.symbol}/${day.pool.token1.symbol}`,
//     volumeUSD: parseFloat(day.volumeUSD),
//     feesUSD: parseFloat(day.feesUSD),
//     tvlUSD: parseFloat(day.tvlUSD),
//     txCount: parseInt(day.txCount)
//   }));
// }

// function processTokenData(tokens) {
//   return tokens.map(token => ({
//     id: token.id,
//     symbol: token.symbol,
//     name: token.name,
//     decimals: parseInt(token.decimals),
//     volume: parseFloat(token.volume),
//     volumeUSD: parseFloat(token.volumeUSD),
//     txCount: parseInt(token.txCount),
//     totalValueLocked: parseFloat(token.totalValueLocked),
//     tvlUSD: parseFloat(token.totalValueLockedUSD),
//     derivedETH: parseFloat(token.derivedETH)
//   }));
// }

// function processTokenDayDatas(tokenDayDatas) {
//   return tokenDayDatas.map(day => ({
//     id: day.id,
//     date: new Date(day.date * 1000).toISOString().split('T')[0],
//     timestamp: parseInt(day.date),
//     tokenId: day.token.id,
//     symbol: day.token.symbol,
//     volume: parseFloat(day.volume),
//     volumeUSD: parseFloat(day.volumeUSD),
//     txCount: parseInt(day.txCount),
//     totalValueLocked: parseFloat(day.totalValueLocked),
//     priceUSD: parseFloat(day.priceUSD)
//   }));
// }

// function processSwapData(swaps) {
//   return swaps.map(swap => ({
//     timestamp: parseInt(swap.timestamp),
//     time: new Date(swap.timestamp * 1000).toISOString(),
//     poolId: swap.pool.id,
//     pairName: `${swap.pool.token0.symbol}/${swap.pool.token1.symbol}`,
//     sender: swap.sender,
//     recipient: swap.recipient,
//     amount0: parseFloat(swap.amount0),
//     amount1: parseFloat(swap.amount1),
//     amountUSD: parseFloat(swap.amountUSD),
//     token0Symbol: swap.pool.token0.symbol,
//     token1Symbol: swap.pool.token1.symbol
//   }));
// }

// function processPositionData(positionSnapshots) {
//   return positionSnapshots.map(snapshot => ({
//     timestamp: parseInt(snapshot.timestamp),
//     time: new Date(snapshot.timestamp * 1000).toISOString(),
//     positionId: snapshot.position.id,
//     owner: snapshot.position.owner,
//     poolId: snapshot.position.pool.id,
//     pairName: `${snapshot.position.pool.token0.symbol}/${snapshot.position.pool.token1.symbol}`,
//     liquidity: BigInt(snapshot.liquidity).toString(),
//     depositedToken0: parseFloat(snapshot.depositedToken0),
//     depositedToken1: parseFloat(snapshot.depositedToken1),
//     withdrawnToken0: parseFloat(snapshot.withdrawnToken0),
//     withdrawnToken1: parseFloat(snapshot.withdrawnToken1),
//     collectedFeesToken0: parseFloat(snapshot.collectedFeesToken0),
//     collectedFeesToken1: parseFloat(snapshot.collectedFeesToken1)
//   }));
// }

// /**
//  * Calculate trends and derived metrics
//  */
// function calculateTrends(data) {
//   const trends = {};
  
//   // Protocol-level trends
//   if (data.protocol && data.protocol.length >= 2) {
//     const latest = data.protocol[data.protocol.length - 1];
//     const previous = data.protocol[0];
    
//     trends.volumeChange = calculatePercentageChange(latest.volumeUSD, previous.volumeUSD);
//     trends.tvlChange = calculatePercentageChange(latest.tvlUSD, previous.tvlUSD);
//     trends.feesChange = calculatePercentageChange(latest.feesUSD, previous.feesUSD);
//     trends.txCountChange = calculatePercentageChange(latest.txCount, previous.txCount);
//   }
  
//   // Pool-level trends
//   if (data.poolDayDatas && data.poolDayDatas.length > 0) {
//     // Group by pool
//     const poolGroups = {};
//     data.poolDayDatas.forEach(day => {
//       if (!poolGroups[day.poolId]) {
//         poolGroups[day.poolId] = [];
//       }
//       poolGroups[day.poolId].push(day);
//     });
    
//     // Calculate growth for each pool
//     const poolGrowth = Object.entries(poolGroups)
//       .filter(([_, days]) => days.length >= 2)
//       .map(([poolId, days]) => {
//         // Sort by date ascending
//         days.sort((a, b) => a.timestamp - b.timestamp);
        
//         const oldestDay = days[0];
//         const newestDay = days[days.length - 1];
        
//         return {
//           poolId,
//           pairName: newestDay.pairName,
//           volumeChange: calculatePercentageChange(newestDay.volumeUSD, oldestDay.volumeUSD),
//           tvlChange: calculatePercentageChange(newestDay.tvlUSD, oldestDay.tvlUSD),
//           txCountChange: calculatePercentageChange(newestDay.txCount, oldestDay.txCount),
//           volumeUSD: newestDay.volumeUSD,
//           tvlUSD: newestDay.tvlUSD
//         };
//       });
    
//     // Sort by volume change (descending) and return top 5
//     trends.topGrowingPools = poolGrowth
//       .sort((a, b) => b.volumeChange - a.volumeChange)
//       .slice(0, 5);
//   }
  
//   // Token-level trends
//   if (data.tokenDayDatas && data.tokenDayDatas.length > 0) {
//     // Group by token
//     const tokenGroups = {};
//     data.tokenDayDatas.forEach(day => {
//       if (!tokenGroups[day.tokenId]) {
//         tokenGroups[day.tokenId] = [];
//       }
//       tokenGroups[day.tokenId].push(day);
//     });
    
//     // Calculate growth for each token
//     const tokenGrowth = Object.entries(tokenGroups)
//       .filter(([_, days]) => days.length >= 2)
//       .map(([tokenId, days]) => {
//         // Sort by date ascending
//         days.sort((a, b) => a.timestamp - b.timestamp);
        
//         const oldestDay = days[0];
//         const newestDay = days[days.length - 1];
        
//         return {
//           tokenId,
//           symbol: newestDay.symbol,
//           volumeChange: calculatePercentageChange(newestDay.volumeUSD, oldestDay.volumeUSD),
//           priceChange: calculatePercentageChange(newestDay.priceUSD, oldestDay.priceUSD),
//           txCountChange: calculatePercentageChange(newestDay.txCount, oldestDay.txCount),
//           volumeUSD: newestDay.volumeUSD,
//           priceUSD: newestDay.priceUSD
//         };
//       });
    
//     // Sort by volume change (descending) and return top 5
//     trends.topGrowingTokens = tokenGrowth
//       .sort((a, b) => b.volumeChange - a.volumeChange)
//       .slice(0, 5);
//   }
  
//   // Large swaps detection
//   if (data.recentSwaps && data.recentSwaps.length > 0) {
//     // Calculate average swap size
//     const totalUSD = data.recentSwaps.reduce((sum, swap) => sum + swap.amountUSD, 0);
//     const avgUSD = totalUSD / data.recentSwaps.length;
    
//     // Find swaps that are significantly larger than average (e.g., 5x)
//     const significantMultiplier = 5;
//     trends.largeSwaps = data.recentSwaps
//       .filter(swap => swap.amountUSD > avgUSD * significantMultiplier)
//       .map(swap => ({
//         ...swap,
//         percentAboveAverage: ((swap.amountUSD / avgUSD) - 1) * 100
//       }))
//       .slice(0, 5);
//   }
  
//   return trends;
// }

// function calculatePercentageChange(current, previous) {
//   if (previous === 0) return 0;
//   return ((current - previous) / previous) * 100;
// }

// module.exports = {
//   fetchUniswapData
// };

// src/services/graphService.js
const axios = require('axios');
require('dotenv').config();

// The Graph API endpoint for Uniswap v3
const UNISWAP_SUBGRAPH_URL = `https://gateway.thegraph.com/api/${process.env.THEGRAPH_KEY}/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV`;

/**
 * Fetches Uniswap data from TheGraph
 * @param {Object} options - Configuration options
 * @param {number} options.dayCount - Number of days of historical data to fetch
 * @param {number} options.topPoolCount - Number of top pools to fetch
 * @param {number} options.topTokenCount - Number of top tokens to fetch
 * @param {number} options.recentSwapCount - Number of recent swaps to fetch
 * @param {string} options.userAddress - Optional wallet address for position data
 * @returns {Promise<Object>} Protocol data
 */
async function fetchUniswapData({
  dayCount = 7,
  topPoolCount = 10,
  topTokenCount = 10,
  recentSwapCount = 20,
  userAddress = null
} = {}) {
  try {
    // Execute queries in parallel based on what's needed
    const queries = [];
    const queryTypes = [];
    
    // Always get protocol overview data
    if (dayCount > 0) {
      queries.push(executeQuery(buildUniswapDayDatasQuery(dayCount)));
      queryTypes.push('uniswapDayDatas');
    }
    
    // Get top pools if requested
    if (topPoolCount > 0) {
      queries.push(executeQuery(buildTopPoolsQuery(topPoolCount)));
      queryTypes.push('topPools');
      
      // Also get pool day data
      queries.push(executeQuery(buildPoolDayDatasQuery(topPoolCount, dayCount)));
      queryTypes.push('poolDayDatas');
    }
    
    // Get top tokens if requested
    if (topTokenCount > 0) {
      queries.push(executeQuery(buildTopTokensQuery(topTokenCount)));
      queryTypes.push('topTokens');
      
      // Also get token day data
      queries.push(executeQuery(buildTokenDayDatasQuery(topTokenCount, dayCount)));
      queryTypes.push('tokenDayDatas');
    }
    
    // Get recent swaps if requested
    if (recentSwapCount > 0) {
      queries.push(executeQuery(buildRecentSwapsQuery(recentSwapCount)));
      queryTypes.push('recentSwaps');
    }
    
    // If user address is provided, get position data
    if (userAddress) {
      queries.push(executeQuery(buildPositionSnapshotsQuery(userAddress)));
      queryTypes.push('userPositions');
    }
    
    // Execute all queries in parallel
    const results = await Promise.all(queries);
    
    // Combine results
    const data = {};
    
    results.forEach((result, index) => {
      const queryType = queryTypes[index];
      
      switch (queryType) {
        case 'uniswapDayDatas':
          data.protocol = processProtocolData(result.data.uniswapDayDatas);
          break;
        case 'topPools':
          data.topPools = processPoolData(result.data.pools);
          break;
        case 'poolDayDatas':
          data.poolDayDatas = processPoolDayDatas(result.data.poolDayDatas);
          break;
        case 'topTokens':
          data.topTokens = processTokenData(result.data.tokens);
          break;
        case 'tokenDayDatas':
          data.tokenDayDatas = processTokenDayDatas(result.data.tokenDayDatas);
          break;
        case 'recentSwaps':
          data.recentSwaps = processSwapData(result.data.swaps);
          break;
        case 'userPositions':
          data.userPositions = processPositionData(result.data.positionSnapshots);
          break;
        default:
          break;
      }
    });
    
    // Calculate derived metrics and trends
    data.trends = calculateTrends(data);
    
    return data;
  } catch (error) {
    console.error('Error fetching Uniswap data:', error);
    throw new Error(`Failed to fetch Uniswap data: ${error.message}`);
  }
}

/**
 * Execute a GraphQL query against The Graph API
 */
async function executeQuery(query) {
    try {
      const response = await axios.post(UNISWAP_SUBGRAPH_URL, { query }, {
        headers: {
          'Content-Type': 'application/json'
          // No need for additional auth headers as the API key is part of the URL
        }
      });
      
      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }
      
      return response.data;
    } catch (error) {
      console.error('GraphQL query error:', error);
      throw error;
    }
}

/**
 * Query builder functions
 */
function buildUniswapDayDatasQuery(dayCount) {
  return `{
    uniswapDayDatas(first: ${dayCount}, orderBy: date, orderDirection: desc) {
      id
      date
      volumeUSD
      tvlUSD
      feesUSD
      txCount
    }
  }`;
}

function buildTopPoolsQuery(count) {
  return `{
    pools(first: ${count}, orderBy: volumeUSD, orderDirection: desc) {
      id
      feeTier
      liquidity
      sqrtPrice
      token0 {
        id
        symbol
        name
        decimals
      }
      token1 {
        id
        symbol
        name
        decimals
      }
      volumeUSD
      feesUSD
      txCount
      totalValueLockedUSD
      token0Price
      token1Price
    }
  }`;
}

function buildPoolDayDatasQuery(poolCount, dayCount) {
  return `{
    poolDayDatas(
      first: ${poolCount * dayCount},
      orderBy: date,
      orderDirection: desc
    ) {
      id
      date
      pool {
        id
        token0 {
          symbol
        }
        token1 {
          symbol
        }
      }
      volumeUSD
      feesUSD
      tvlUSD
      txCount
    }
  }`;
}

function buildTopTokensQuery(count) {
  return `{
    tokens(first: ${count}, orderBy: volumeUSD, orderDirection: desc) {
      id
      symbol
      name
      decimals
      volume
      volumeUSD
      txCount
      totalValueLocked
      totalValueLockedUSD
      derivedETH
    }
  }`;
}

function buildTokenDayDatasQuery(tokenCount, dayCount) {
  return `{
    tokenDayDatas(
      first: ${tokenCount * dayCount},
      orderBy: date,
      orderDirection: desc
    ) {
      id
      date
      token {
        id
        symbol
      }
      volume
      volumeUSD
      totalValueLocked
      priceUSD
    }
  }`;
}

function buildRecentSwapsQuery(count) {
  return `{
    swaps(first: ${count}, orderBy: timestamp, orderDirection: desc) {
      timestamp
      pool {
        id
        token0 {
          symbol
        }
        token1 {
          symbol
        }
      }
      sender
      recipient
      amount0
      amount1
      amountUSD
    }
  }`;
}

function buildPositionSnapshotsQuery(userAddress) {
  return `{
    positionSnapshots(
      where: { owner: "${userAddress.toLowerCase()}" },
      orderBy: timestamp,
      orderDirection: desc
    ) {
      timestamp
      position {
        id
        owner
        pool {
          id
          token0 {
            symbol
          }
          token1 {
            symbol
          }
        }
      }
      liquidity
      depositedToken0
      depositedToken1
      withdrawnToken0
      withdrawnToken1
      collectedFeesToken0
      collectedFeesToken1
    }
  }`;
}

/**
 * Data processing functions
 */
function processProtocolData(uniswapDayDatas) {
  return uniswapDayDatas.map(day => ({
    date: new Date(day.date * 1000).toISOString().split('T')[0],
    timestamp: parseInt(day.date),
    volumeUSD: parseFloat(day.volumeUSD),
    tvlUSD: parseFloat(day.tvlUSD),
    feesUSD: parseFloat(day.feesUSD),
    txCount: parseInt(day.txCount)
  })).reverse(); // Reverse for chronological order
}

function processPoolData(pools) {
  return pools.map(pool => ({
    id: pool.id,
    name: `${pool.token0.symbol}/${pool.token1.symbol}`,
    feeTier: parseInt(pool.feeTier) / 10000, // Convert to percentage
    tokens: [
      {
        id: pool.token0.id,
        symbol: pool.token0.symbol,
        name: pool.token0.name,
        decimals: parseInt(pool.token0.decimals)
      },
      {
        id: pool.token1.id,
        symbol: pool.token1.symbol,
        name: pool.token1.name,
        decimals: parseInt(pool.token1.decimals)
      }
    ],
    liquidity: BigInt(pool.liquidity).toString(),
    volumeUSD: parseFloat(pool.volumeUSD),
    feesUSD: parseFloat(pool.feesUSD),
    txCount: parseInt(pool.txCount),
    tvlUSD: parseFloat(pool.totalValueLockedUSD),
    token0Price: parseFloat(pool.token0Price),
    token1Price: parseFloat(pool.token1Price)
  }));
}

function processPoolDayDatas(poolDayDatas) {
  return poolDayDatas.map(day => ({
    id: day.id,
    date: new Date(day.date * 1000).toISOString().split('T')[0],
    timestamp: parseInt(day.date),
    poolId: day.pool.id,
    pairName: `${day.pool.token0.symbol}/${day.pool.token1.symbol}`,
    volumeUSD: parseFloat(day.volumeUSD),
    feesUSD: parseFloat(day.feesUSD),
    tvlUSD: parseFloat(day.tvlUSD),
    txCount: parseInt(day.txCount)
  }));
}

function processTokenData(tokens) {
  return tokens.map(token => ({
    id: token.id,
    symbol: token.symbol,
    name: token.name,
    decimals: parseInt(token.decimals),
    volume: parseFloat(token.volume),
    volumeUSD: parseFloat(token.volumeUSD),
    txCount: parseInt(token.txCount),
    totalValueLocked: parseFloat(token.totalValueLocked),
    tvlUSD: parseFloat(token.totalValueLockedUSD),
    derivedETH: parseFloat(token.derivedETH)
  }));
}

function processTokenDayDatas(tokenDayDatas) {
  return tokenDayDatas.map(day => ({
    id: day.id,
    date: new Date(day.date * 1000).toISOString().split('T')[0],
    timestamp: parseInt(day.date),
    tokenId: day.token.id,
    symbol: day.token.symbol,
    volume: parseFloat(day.volume),
    volumeUSD: parseFloat(day.volumeUSD),
    totalValueLocked: parseFloat(day.totalValueLocked),
    priceUSD: parseFloat(day.priceUSD)
  }));
}

function processSwapData(swaps) {
  return swaps.map(swap => ({
    timestamp: parseInt(swap.timestamp),
    time: new Date(swap.timestamp * 1000).toISOString(),
    poolId: swap.pool.id,
    pairName: `${swap.pool.token0.symbol}/${swap.pool.token1.symbol}`,
    sender: swap.sender,
    recipient: swap.recipient,
    amount0: parseFloat(swap.amount0),
    amount1: parseFloat(swap.amount1),
    amountUSD: parseFloat(swap.amountUSD),
    token0Symbol: swap.pool.token0.symbol,
    token1Symbol: swap.pool.token1.symbol
  }));
}

function processPositionData(positionSnapshots) {
  return positionSnapshots.map(snapshot => ({
    timestamp: parseInt(snapshot.timestamp),
    time: new Date(snapshot.timestamp * 1000).toISOString(),
    positionId: snapshot.position.id,
    owner: snapshot.position.owner,
    poolId: snapshot.position.pool.id,
    pairName: `${snapshot.position.pool.token0.symbol}/${snapshot.position.pool.token1.symbol}`,
    liquidity: BigInt(snapshot.liquidity).toString(),
    depositedToken0: parseFloat(snapshot.depositedToken0),
    depositedToken1: parseFloat(snapshot.depositedToken1),
    withdrawnToken0: parseFloat(snapshot.withdrawnToken0),
    withdrawnToken1: parseFloat(snapshot.withdrawnToken1),
    collectedFeesToken0: parseFloat(snapshot.collectedFeesToken0),
    collectedFeesToken1: parseFloat(snapshot.collectedFeesToken1)
  }));
}

/**
 * Calculate trends and derived metrics
 */
function calculateTrends(data) {
  const trends = {};
  
  // Protocol-level trends
  if (data.protocol && data.protocol.length >= 2) {
    const latest = data.protocol[data.protocol.length - 1];
    const previous = data.protocol[0];
    
    trends.volumeChange = calculatePercentageChange(latest.volumeUSD, previous.volumeUSD);
    trends.tvlChange = calculatePercentageChange(latest.tvlUSD, previous.tvlUSD);
    trends.feesChange = calculatePercentageChange(latest.feesUSD, previous.feesUSD);
    trends.txCountChange = calculatePercentageChange(latest.txCount, previous.txCount);
  }
  
  // Pool-level trends
  if (data.poolDayDatas && data.poolDayDatas.length > 0) {
    // Group by pool
    const poolGroups = {};
    data.poolDayDatas.forEach(day => {
      if (!poolGroups[day.poolId]) {
        poolGroups[day.poolId] = [];
      }
      poolGroups[day.poolId].push(day);
    });
    
    // Calculate growth for each pool
    const poolGrowth = Object.entries(poolGroups)
      .filter(([_, days]) => days.length >= 2)
      .map(([poolId, days]) => {
        // Sort by date ascending
        days.sort((a, b) => a.timestamp - b.timestamp);
        
        const oldestDay = days[0];
        const newestDay = days[days.length - 1];
        
        return {
          poolId,
          pairName: newestDay.pairName,
          volumeChange: calculatePercentageChange(newestDay.volumeUSD, oldestDay.volumeUSD),
          tvlChange: calculatePercentageChange(newestDay.tvlUSD, oldestDay.tvlUSD),
          txCountChange: calculatePercentageChange(newestDay.txCount, oldestDay.txCount),
          volumeUSD: newestDay.volumeUSD,
          tvlUSD: newestDay.tvlUSD
        };
      });
    
    // Sort by volume change (descending) and return top 5
    trends.topGrowingPools = poolGrowth
      .sort((a, b) => b.volumeChange - a.volumeChange)
      .slice(0, 5);
  }
  
  // Token-level trends
  if (data.tokenDayDatas && data.tokenDayDatas.length > 0) {
    // Group by token
    const tokenGroups = {};
    data.tokenDayDatas.forEach(day => {
      if (!tokenGroups[day.tokenId]) {
        tokenGroups[day.tokenId] = [];
      }
      tokenGroups[day.tokenId].push(day);
    });
    
    // Calculate growth for each token
    const tokenGrowth = Object.entries(tokenGroups)
      .filter(([_, days]) => days.length >= 2)
      .map(([tokenId, days]) => {
        // Sort by date ascending
        days.sort((a, b) => a.timestamp - b.timestamp);
        
        const oldestDay = days[0];
        const newestDay = days[days.length - 1];
        
        return {
          tokenId,
          symbol: newestDay.symbol,
          volumeChange: calculatePercentageChange(newestDay.volumeUSD, oldestDay.volumeUSD),
          priceChange: calculatePercentageChange(newestDay.priceUSD, oldestDay.priceUSD),
          volumeUSD: newestDay.volumeUSD,
          priceUSD: newestDay.priceUSD
        };
      });
    
    // Sort by volume change (descending) and return top 5
    trends.topGrowingTokens = tokenGrowth
      .sort((a, b) => b.volumeChange - a.volumeChange)
      .slice(0, 5);
  }
  
  // Large swaps detection
  if (data.recentSwaps && data.recentSwaps.length > 0) {
    // Calculate average swap size
    const totalUSD = data.recentSwaps.reduce((sum, swap) => sum + swap.amountUSD, 0);
    const avgUSD = totalUSD / data.recentSwaps.length;
    
    // Find swaps that are significantly larger than average (e.g., 5x)
    const significantMultiplier = 5;
    trends.largeSwaps = data.recentSwaps
      .filter(swap => swap.amountUSD > avgUSD * significantMultiplier)
      .map(swap => ({
        ...swap,
        percentAboveAverage: ((swap.amountUSD / avgUSD) - 1) * 100
      }))
      .slice(0, 5);
  }
  
  return trends;
}

function calculatePercentageChange(current, previous) {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

module.exports = {
  fetchUniswapData
};