// Vercel serverless function: treasury transaction history (SOL transfers + DORITO activity)
import { Connection, PublicKey } from '@solana/web3.js';

const TREASURY_ADDRESS = 'DU36b69V7KHiABHZuSQ5EPi3BRjwrJ8tqair1a95LPSY';
const TOKEN_MINT = 'H6KgtksNwiEe3bBpAcXFcC7za3d3V9Y4inayFyCPyy4j';
const LIMIT = 20;
const CACHE_TTL = 60000; // 1 minute

let cache = { data: null, timestamp: null };

function getAccountKeys(parsedTx) {
    const msg = parsedTx?.transaction?.message;
    if (!msg) return [];
    const keys = msg.accountKeys;
    if (!keys || !Array.isArray(keys)) return [];
    return keys.map((k) => (typeof k === 'string' ? k : k.pubkey?.toString?.() || k.toString?.()));
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const now = Date.now();
    if (cache.data && cache.timestamp && now - cache.timestamp < CACHE_TTL) {
        return res.status(200).json({ transactions: cache.data, cached: true });
    }

    try {
        const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
        const connection = new Connection(RPC_URL, 'confirmed');
        const treasuryPk = new PublicKey(TREASURY_ADDRESS);

        const signatures = await connection.getSignaturesForAddress(treasuryPk, { limit: LIMIT });
        const transactions = [];

        for (const { signature } of signatures) {
            try {
                const tx = await connection.getParsedTransaction(signature, {
                    maxSupportedTransactionVersion: 0,
                });
                if (!tx?.meta) continue;

                const accountKeys = getAccountKeys(tx);
                const treasuryIndex = accountKeys.findIndex((k) => k === TREASURY_ADDRESS);
                const preBalances = tx.meta.preBalances || [];
                const postBalances = tx.meta.postBalances || [];
                const blockTime = tx.blockTime || 0;

                // SOL change (lamports -> SOL)
                let solDelta = 0;
                if (treasuryIndex >= 0 && preBalances[treasuryIndex] !== undefined && postBalances[treasuryIndex] !== undefined) {
                    solDelta = (postBalances[treasuryIndex] - preBalances[treasuryIndex]) / 1e9;
                }

                // DORITO token change
                const preToken = (tx.meta.preTokenBalances || []).find(
                    (t) => t.owner === TREASURY_ADDRESS && t.mint === TOKEN_MINT
                );
                const postToken = (tx.meta.postTokenBalances || []).find(
                    (t) => t.owner === TREASURY_ADDRESS && t.mint === TOKEN_MINT
                );
                const preAmount = preToken?.uiTokenAmount?.uiAmount ?? 0;
                const postAmount = postToken?.uiTokenAmount?.uiAmount ?? 0;
                const tokenDelta = postAmount - preAmount;

                const solIn = solDelta > 0;
                const tokenIn = tokenDelta > 0;

                if (Math.abs(solDelta) >= 0.00001) {
                    transactions.push({
                        signature,
                        blockTime,
                        type: 'sol_transfer',
                        direction: solIn ? 'in' : 'out',
                        amount: Math.abs(solDelta),
                        amountFormatted: `${solIn ? '+' : '-'}${Math.abs(solDelta).toFixed(4)} SOL`,
                        url: `https://solscan.io/tx/${signature}`,
                    });
                }
                if (Math.abs(tokenDelta) >= 0.00001) {
                    transactions.push({
                        signature,
                        blockTime,
                        type: 'dorito',
                        direction: tokenIn ? 'in' : 'out',
                        amount: Math.abs(tokenDelta),
                        amountFormatted: `${tokenIn ? '+' : '-'}${formatTokenAmount(Math.abs(tokenDelta))} DORITO`,
                        url: `https://solscan.io/tx/${signature}`,
                    });
                }
            } catch (e) {
                // skip single tx parse errors
            }
        }

        // Sort by blockTime desc (newest first), then dedupe by signature for display (show one row per tx with primary type)
        const seen = new Set();
        const merged = [];
        for (const t of transactions) {
            const key = `${t.signature}-${t.type}`;
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push(t);
        }
        merged.sort((a, b) => (b.blockTime || 0) - (a.blockTime || 0));
        const result = merged.slice(0, 25);

        cache.data = result;
        cache.timestamp = now;
        return res.status(200).json({ transactions: result, cached: false });
    } catch (error) {
        console.error('Treasury history error:', error);
        return res.status(500).json({
            error: 'Failed to fetch transaction history',
            message: error.message,
        });
    }
}

function formatTokenAmount(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
    return n.toFixed(2);
}
