import { logger } from '../config/logger.config';

/**
 * Get NFT collections
 */
export async function getNftCollections(chainId: number = 1, limit: number = 10) {
    try {
        // In a real app, you would call APIs for OpenSea, Rarible, etc.
        // For MVP, we'll simulate a response with fake data
        await new Promise(resolve => setTimeout(resolve, 400)); // Simulate API delay

        // Generate fake collections
        const collections = [];
        const collectionNames = [
            'Bored Ape Yacht Club',
            'CryptoPunks',
            'Azuki',
            'Doodles',
            'Cool Cats',
            'World of Women',
            'Moonbirds',
            'Clone X',
            'VeeFriends',
            'Pudgy Penguins',
            'Invisible Friends',
            'Art Blocks Curated',
            'Meebits',
            'Mutant Ape Yacht Club',
        ];

        for (let i = 0; i < Math.min(limit, collectionNames.length); i++) {
            const name = collectionNames[i];
            const symbol = name.split(' ').map(word => word[0]).join('');

            collections.push({
                id: name.toLowerCase().replace(/\s+/g, '-'),
                name,
                symbol,
                chainId,
                contractAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
                description: `A collection of ${5000 + Math.floor(Math.random() * 5000)} unique NFTs.`,
                floorPrice: 0.5 + Math.random() * 10,
                totalSupply: 5000 + Math.floor(Math.random() * 5000),
                owners: 2000 + Math.floor(Math.random() * 3000),
                volume24h: 10 + Math.random() * 100,
                volumeTotal: 1000 + Math.random() * 10000,
                marketplaces: ['OpenSea', 'Rarible', 'LooksRare'],
                createdAt: new Date(Date.now() - Math.random() * 31536000000), // Random date within last year
            });
        }

        return collections;
    } catch (error: any) {
        logger.error(`Error fetching NFT collections:`, error);
        throw new Error(`Failed to fetch NFT collections: ${error.message}`);
    }
}

/**
 * Get NFT collection details
 */
export async function getNftCollectionDetails(collectionId: string, chainId: number = 1) {
    try {
        // In a real app, you would call APIs for specific collection details
        // For MVP, we'll simulate a response with fake data
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay

        // Parse collection ID to get name
        const name = collectionId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        const symbol = name.split(' ').map(word => word[0]).join('');

        // Generate random collection details
        const totalSupply = 5000 + Math.floor(Math.random() * 5000);
        const owners = 2000 + Math.floor(Math.random() * 3000);
        const floorPrice = 0.5 + Math.random() * 10;

        // Generate floor price history
        const floorPriceHistory = [];
        const now = new Date();
        let currentFloorPrice = floorPrice;

        for (let i = 30; i >= 0; i--) {
            // Add some random walk to the floor price
            currentFloorPrice = Math.max(0.1, currentFloorPrice * (1 + (Math.random() * 0.06 - 0.03))); // ±3% daily change

            const date = new Date(now);
            date.setDate(date.getDate() - i);

            floorPriceHistory.push({
                date,
                floorPrice: currentFloorPrice,
            });
        }

        // Generate sales history
        const salesHistory = [];
        for (let i = 0; i < 10; i++) {
            const saleDate = new Date(now);
            saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 30));

            salesHistory.push({
                tokenId: Math.floor(Math.random() * totalSupply),
                price: floorPrice * (0.8 + Math.random() * 0.6), // 0.8-1.4x floor price
                seller: `0x${Math.random().toString(16).substr(2, 40)}`,
                buyer: `0x${Math.random().toString(16).substr(2, 40)}`,
                date: saleDate,
                marketplace: ['OpenSea', 'Rarible', 'LooksRare'][Math.floor(Math.random() * 3)],
            });
        }

        // Sort sales by date, most recent first
        salesHistory.sort((a, b) => b.date.getTime() - a.date.getTime());

        return {
            id: collectionId,
            name,
            symbol,
            chainId,
            contractAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
            description: `A collection of ${totalSupply} unique NFTs on the Ethereum blockchain. Each NFT is algorithmically generated with various traits and attributes.`,
            floorPrice,
            totalSupply,
            owners,
            uniqueOwners: (owners / totalSupply * 100).toFixed(2) + '%', // Percentage of unique owners
            volume24h: 10 + Math.random() * 100,
            volumeTotal: 1000 + Math.random() * 10000,
            marketplaces: ['OpenSea', 'Rarible', 'LooksRare'],
            createdAt: new Date(Date.now() - Math.random() * 31536000000), // Random date within last year
            creator: `0x${Math.random().toString(16).substr(2, 40)}`,
            royalties: (Math.random() * 0.1).toFixed(2), // 0-10% royalties
            floorPriceHistory,
            salesHistory,
            traits: [
                {
                    type: 'Background',
                    values: ['Blue', 'Green', 'Red', 'Yellow', 'Purple'],
                    distribution: [30, 25, 20, 15, 10],
                },
                {
                    type: 'Clothing',
                    values: ['Suit', 'T-Shirt', 'Hoodie', 'Jacket', 'Tank Top'],
                    distribution: [20, 30, 25, 15, 10],
                },
                {
                    type: 'Eyes',
                    values: ['Normal', 'Laser', 'Sunglasses', 'Eyepatch', 'Closed'],
                    distribution: [40, 15, 20, 10, 15],
                },
            ],
            socials: {
                website: `https://${collectionId}.io`,
                twitter: `https://twitter.com/${collectionId}`,
                discord: `https://discord.gg/${collectionId}`,
            },
        };
    } catch (error) {
        logger.error(`Error fetching NFT collection details for ${collectionId}:`, error);
        throw new Error(`Failed to fetch NFT collection details: ${error.message}`);
    }
}

/**
 * Get NFT tokens for a collection
 */
export async function getNftTokens(
    collectionId: string,
    chainId: number = 1,
    page: number = 1,
    limit: number = 20
) {
    try {
        // In a real app, you would call APIs for specific collection NFTs
        // For MVP, we'll simulate a response with fake data
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

        // Parse collection ID to get name
        const collectionName = collectionId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

        // Get collection details to use consistent data
        const collectionDetails = await getNftCollectionDetails(collectionId, chainId);

        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // Generate tokens
        const tokens = [];
        for (let i = 0; i < limit; i++) {
            const tokenId = offset + i;

            // Generate random traits
            const traits = [];
            collectionDetails.traits.forEach(traitType => {
                const valueIndex = Math.floor(Math.random() * traitType.values.length);
                traits.push({
                    type: traitType.type,
                    value: traitType.values[valueIndex],
                    rarity: traitType.distribution[valueIndex] / 100, // Convert to decimal
                });
            });

            tokens.push({
                collectionId,
                tokenId,
                name: `${collectionName} #${tokenId}`,
                description: `A unique NFT from the ${collectionName} collection.`,
                image: `https://example.com/nft/${collectionId}/${tokenId}.png`, // Fake image URL
                owner: `0x${Math.random().toString(16).substr(2, 40)}`,
                traits,
                metadata: {
                    created: new Date(Date.now() - Math.random() * 31536000000), // Random date within last year
                    lastTransferred: new Date(Date.now() - Math.random() * 15768000000), // Random date within last 6 months
                },
                forSale: Math.random() > 0.7, // 30% chance it's for sale
                price: Math.random() > 0.7 ? collectionDetails.floorPrice * (1 + Math.random()) : null, // Random price above floor
                rarity: {
                    rank: tokenId % 100 + 1,
                    score: Math.random() * 100,
                },
            });
        }

        return {
            tokens,
            pagination: {
                page,
                limit,
                total: collectionDetails.totalSupply,
                totalPages: Math.ceil(collectionDetails.totalSupply / limit),
            },
        };
    } catch (error: any) {
        logger.error(`Error fetching NFT tokens for collection ${collectionId}:`, error);
        throw new Error(`Failed to fetch NFT tokens: ${error.message}`);
    }
}