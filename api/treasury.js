// Vercel serverless function to fetch treasury balance with caching
// This uses the QuickNode RPC endpoint from environment variables with @solana/web3.js

import { Connection, PublicKey } from '@solana/web3.js';

// Cache storage (in-memory, resets on serverless function restart)
let cache = {
    data: null,
    timestamp: null,
    ttl: 30000 // 30 seconds cache
};

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check cache
    const now = Date.now();
    if (cache.data && cache.timestamp && (now - cache.timestamp) < cache.ttl) {
        return res.status(200).json({
            ...cache.data,
            cached: true,
            cacheAge: Math.floor((now - cache.timestamp) / 1000)
        });
    }

    try {
        const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
        const TREASURY_ADDRESS = 'DU36b69V7KHiABHZuSQ5EPi3BRjwrJ8tqair1a95LPSY';
        const TOKEN_ADDRESS = 'H6KgtksNwiEe3bBpAcXFcC7za3d3V9Y4inayFyCPyy4j';

        // Initialize Solana connection
        const connection = new Connection(RPC_URL, 'confirmed');
        const treasuryPublicKey = new PublicKey(TREASURY_ADDRESS);
        const tokenMintPublicKey = new PublicKey(TOKEN_ADDRESS);

        // Fetch SOL price
        let solPrice = null;
        try {
            const solPriceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
            const solPriceData = await solPriceResponse.json();
            solPrice = solPriceData.solana?.usd || null;
        } catch (error) {
            console.error('Error fetching SOL price:', error);
            // Fallback to Binance
            try {
                const binanceResponse = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT');
                const binanceData = await binanceResponse.json();
                solPrice = parseFloat(binanceData.price);
            } catch (err) {
                console.error('Error fetching SOL price from fallback:', err);
            }
        }

        // Fetch SOL balance using web3.js
        let solBalance = 0;
        try {
            const balance = await connection.getBalance(treasuryPublicKey);
            solBalance = balance / 1000000000; // Convert lamports to SOL
        } catch (error) {
            console.error('Error fetching SOL balance:', error);
        }

        // Fetch token balance using web3.js
        let tokenBalance = 0;
        try {
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                treasuryPublicKey,
                {
                    mint: tokenMintPublicKey
                }
            );

            if (tokenAccounts.value && tokenAccounts.value.length > 0) {
                const tokenAccount = tokenAccounts.value[0];
                const tokenAmount = tokenAccount.account.data.parsed.info.tokenAmount;
                tokenBalance = tokenAmount.uiAmount || 0;
            }
        } catch (error) {
            console.error('Error fetching token balance:', error);
        }

        // Fetch token price
        let tokenPrice = 0;
        try {
            const tokenPriceResponse = await fetch(`https://price.jup.ag/v4/price?ids=${TOKEN_ADDRESS}`);
            const tokenPriceData = await tokenPriceResponse.json();
            if (tokenPriceData.data && tokenPriceData.data[TOKEN_ADDRESS]) {
                tokenPrice = tokenPriceData.data[TOKEN_ADDRESS].price || 0;
            }
        } catch (error) {
            console.error('Error fetching token price:', error);
        }

        // Calculate values
        const solValueUSD = solBalance * (solPrice || 0);
        const tokenValueUSD = tokenBalance * (tokenPrice || 0);
        const totalValue = solValueUSD + tokenValueUSD;

        // Prepare response data
        const responseData = {
            solBalance,
            solPrice,
            solValueUSD,
            tokenBalance,
            tokenPrice,
            tokenValueUSD,
            totalValue,
            timestamp: now
        };

        // Update cache
        cache.data = responseData;
        cache.timestamp = now;

        return res.status(200).json({
            ...responseData,
            cached: false
        });

    } catch (error) {
        console.error('Error in treasury API:', error);
        return res.status(500).json({
            error: 'Failed to fetch treasury balance',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

