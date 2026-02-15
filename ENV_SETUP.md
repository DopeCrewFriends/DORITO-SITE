# Environment Variables Setup

## For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```
SOLANA_RPC_URL = https://restless-weathered-telescope.solana-mainnet.quiknode.pro/f69b75f517fdbfa8062bce9bd3d96310000e349a/
SOLANA_WSS_URL = wss://restless-weathered-telescope.solana-mainnet.quiknode.pro/f69b75f517fdbfa8062bce9bd3d96310000e349a/
```

4. Make sure to add them for **Production**, **Preview**, and **Development** environments
5. Redeploy your application after adding the variables

## For Local Development

Create a `.env.local` file in the root directory with:

```
SOLANA_RPC_URL=https://restless-weathered-telescope.solana-mainnet.quiknode.pro/f69b75f517fdbfa8062bce9bd3d96310000e349a/
SOLANA_WSS_URL=wss://restless-weathered-telescope.solana-mainnet.quiknode.pro/f69b75f517fdbfa8062bce9bd3d96310000e349a/
```

**Note**: `.env.local` is already in `.gitignore` and won't be committed to GitHub.


