import { logger } from '../config/logger.config';
import { getStakingPlatforms } from './staking.service';

/**
 * Get yield platforms for optimization
 */
export async function getYieldPlatforms(chainId: number = 1, assetSymbol?: string) {
    try {
        // In a real app, you would aggregate data from multiple yield sources
        // For MVP, we'll reuse staking platforms and add some additional ones
        const stakingPlatforms = await getStakingPlatforms(chainId);

        // Filter by asset if provided
        if (assetSymbol) {
            for (const platform of stakingPlatforms) {
                platform.assets = platform.assets.filter(asset => asset.symbol === assetSymbol);
            }
        }

        // Add some lending platforms
        const lendingPlatforms = [
            {
                id: 'aave-lending',
                name: 'Aave Lending',
                chainId,
                assets: [
                    {
                        symbol: 'USDC',
                        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                        apy: 2.8 + Math.random() * 1.5,
                        totalSupply: 135000000 + Math.random() * 25000000,
                    },
                    {
                        symbol: 'DAI',
                        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
                        apy: 3.4 + Math.random() * 1.3,
                        totalSupply: 103000000 + Math.random() * 15000000,
                    },
                    {
                        symbol: 'ETH',
                        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
                        apy: 2.1 + Math.random() * 0.8,
                        totalSupply: 185000 + Math.random() * 25000,
                    },
                ],
                contractAddress: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9', // Aave Lending Pool
                url: 'https://aave.com',
                type: 'lending',
            },
            {
                id: 'compound-lending',
                name: 'Compound Lending',
                chainId,
                assets: [
                    {
                        symbol: 'USDC',
                        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                        apy: 2.5 + Math.random() * 1.2,
                        totalSupply: 125000000 + Math.random() * 20000000,
                    },
                    {
                        symbol: 'DAI',
                        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
                        apy: 3.2 + Math.random() * 1.1,
                        totalSupply: 98000000 + Math.random() * 12000000,
                    },
                    {
                        symbol: 'ETH',
                        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
                        apy: 1.8 + Math.random() * 0.7,
                        totalSupply: 175000 + Math.random() * 20000,
                    },
                ],
                contractAddress: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B', // Compound Comptroller
                url: 'https://compound.finance',
                type: 'lending',
            },
        ];

        // Filter lending platforms by asset if provided
        if (assetSymbol) {
            for (const platform of lendingPlatforms) {
                platform.assets = platform.assets.filter(asset => asset.symbol === assetSymbol);
            }
        }

        // Combine platforms
        const allPlatforms = [...stakingPlatforms, ...lendingPlatforms];

        // Only return platforms that have assets after filtering
        return allPlatforms.filter(platform => platform.assets.length > 0);
    } catch (error: any) {
        logger.error(`Error fetching yield platforms:`, error);
        throw new Error(`Failed to fetch yield platforms: ${error.message}`);
    }
}

/**
 * Get optimized yield strategy for a specific asset
 */
export async function getOptimizedYieldStrategy(assetSymbol: string, chainId: number = 1) {
    try {
        // Get all yield platforms for the specific asset
        const platforms = await getYieldPlatforms(chainId, assetSymbol);

        // Flatten all assets from all platforms
        const allYieldOptions = platforms.flatMap(platform =>
            platform.assets.map(asset => ({
                platform: platform.name,
                platformId: platform.id,
                type: platform.type || 'staking',
                asset: asset.symbol,
                address: asset.address,
                apy: asset.apy,
            }))
        );

        // Sort by APY (highest first)
        allYieldOptions.sort((a, b) => b.apy - a.apy);

        // Calculate risks and benefits
        const strategies = [];

        // Conservative strategy (top 3 most reliable platforms, not necessarily highest APY)
        const conservativePlatforms = ['Aave', 'Compound', 'Lido']; // Most established platforms
        const conservativeOptions = allYieldOptions.filter(
            option => conservativePlatforms.some(platform => option.platform.includes(platform))
        ).slice(0, 3);

        strategies.push({
            name: 'Conservative',
            description: 'Lower returns but higher safety using established platforms',
            averageApy: conservativeOptions.reduce((sum, option) => sum + option.apy, 0) / conservativeOptions.length,
            risk: 'Low',
            options: conservativeOptions,
        });

        // Balanced strategy (mix of yield and safety)
        const balancedOptions = allYieldOptions.slice(0, 3); // Top 3 APY options

        strategies.push({
            name: 'Balanced',
            description: 'Balances yield and safety for consistent returns',
            averageApy: balancedOptions.reduce((sum, option) => sum + option.apy, 0) / balancedOptions.length,
            risk: 'Medium',
            options: balancedOptions,
        });

        // Aggressive strategy (highest APY)
        const aggressiveOptions = [...allYieldOptions].sort((a, b) => b.apy - a.apy).slice(0, 2);

        strategies.push({
            name: 'Aggressive',
            description: 'Maximizes yield but with higher risk',
            averageApy: aggressiveOptions.reduce((sum, option) => sum + option.apy, 0) / aggressiveOptions.length,
            risk: 'High',
            options: aggressiveOptions,
        });

        return {
            asset: assetSymbol,
            chainId,
            timestamp: new Date(),
            allOptions: allYieldOptions,
            strategies,
        };
    } catch (error: any) {
        logger.error(`Error calculating optimized yield strategy for ${assetSymbol}:`, error);
        throw new Error(`Failed to calculate optimized yield strategy: ${error.message}`);
    }
}

/**
 * Get historical APY data for a yield source
 */
export async function getYieldHistoricalApy(
    platformId: string,
    assetSymbol: string,
    days: number = 30,
    chainId: number = 1
) {
    try {
        // In a real app, you would fetch historical APY data from APIs
        // For MVP, we'll simulate a response with fake data
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay

        // Generate a baseline APY based on the platform and asset
        let baselineApy;

        switch (platformId) {
            case 'aave':
            case 'aave-lending':
                baselineApy = assetSymbol === 'DAI' ? 3.2 : assetSymbol === 'USDC' ? 2.5 : 1.8;
                break;
            case 'compound':
            case 'compound-lending':
                baselineApy = assetSymbol === 'DAI' ? 3.0 : assetSymbol === 'USDC' ? 2.3 : 1.5;
                break;
            case 'lido':
                baselineApy = 3.5;
                break;
            case 'yearn':
                baselineApy = assetSymbol === 'DAI' ? 4.5 : assetSymbol === 'USDC' ? 4.2 : 3.2;
                break;
            default:
                baselineApy = 2.0;
        }

        // Generate history data
        const history = [];
        const now = new Date();
        let currentApy = baselineApy;

        for (let i = days; i >= 0; i--) {
            // Add some random walk to the APY (with mean reversion)
            const drift = (baselineApy - currentApy) * 0.1; // Pull back toward baseline
            const randomWalk = (Math.random() - 0.5) * 0.3; // Random component
            currentApy = Math.max(0.1, currentApy + drift + randomWalk); // Ensure APY is always positive

            const date = new Date(now);
            date.setDate(date.getDate() - i);

            history.push({
                date,
                apy: currentApy,
            });
        }

        return {
            platformId,
            assetSymbol,
            chainId,
            currentApy: history[history.length - 1].apy,
            baselineApy,
            history,
        };
    } catch (error: any) {
        logger.error(`Error fetching yield historical APY for ${platformId}/${assetSymbol}:`, error);
        throw new Error(`Failed to fetch yield historical APY: ${error.message}`);
    }
}