# DORITO Token Website

A beautiful website for the DORITO token, inspired by the incredible story of Dorito the cat who beat ocular FIP.

## Features

- 🎨 Modern, responsive design
- 💰 Live treasury balance display with USD conversion
- 🖼️ Beautiful image integration
- 🔗 Social media links and trading platforms
- ⚡ Fast loading with API caching

## Setup for Vercel Deployment

1. **Install Dependencies**
   - Vercel will automatically run `npm install` when you deploy
   - Or manually: `npm install`

2. **Environment Variables**
   - Go to your Vercel project settings
   - Add the following environment variables:
     - `SOLANA_RPC_URL`: Your QuickNode RPC endpoint
     - `SOLANA_WSS_URL`: Your QuickNode WebSocket endpoint (optional)

3. **Deploy**
   - Push to GitHub
   - Connect your repository to Vercel
   - Vercel will automatically detect and deploy

## Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file (not committed to git) with:

```
SOLANA_RPC_URL=https://restless-weathered-telescope.solana-mainnet.quiknode.pro/f69b75f517fdbfa8062bce9bd3d96310000e349a/
SOLANA_WSS_URL=wss://restless-weathered-telescope.solana-mainnet.quiknode.pro/f69b75f517fdbfa8062bce9bd3d96310000e349a/
```

## Dependencies

- `@solana/web3.js` - Official Solana JavaScript library for interacting with the Solana blockchain

## API Endpoints

- `/api/treasury` - Fetches treasury balance with 30-second caching using @solana/web3.js

## Token Information

- **Token Address**: `H6KgtksNwiEe3bBpAcXFcC7za3d3V9Y4inayFyCPyy4j`
- **Treasury Wallet**: `DU36b69V7KHiABHZuSQ5EPi3BRjwrJ8tqair1a95LPSY`

