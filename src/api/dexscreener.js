// DexScreener API service
// Free, no rate limits, better coverage for DEX tokens
// Docs: https://docs.dexscreener.com/api/reference

const BASE_URL = 'https://api.dexscreener.com/latest';

// Map our platform names to DexScreener chain names
const CHAIN_MAP = {
  'ethereum': 'ethereum',
  'base': 'base',
  'solana': 'solana'
};

/**
 * Get token info by contract address from DexScreener
 * @param {string} platform - 'ethereum', 'base', or 'solana'
 * @param {string} contractAddress - The token contract address
 */
export async function getDexScreenerToken(platform, contractAddress) {
  try {
    const chain = CHAIN_MAP[platform] || platform;
    const url = `${BASE_URL}/dex/tokens/${contractAddress}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`DexScreener: Failed to fetch token ${contractAddress}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.pairs || data.pairs.length === 0) {
      console.warn(`DexScreener: No pairs found for ${contractAddress}`);
      return null;
    }

    // Filter pairs by chain and get the one with highest liquidity
    const chainPairs = data.pairs.filter(p => p.chainId === chain);
    if (chainPairs.length === 0) {
      // Try without chain filter
      return data.pairs[0];
    }

    // Sort by liquidity and return the best pair
    chainPairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
    return chainPairs[0];
  } catch (error) {
    console.error(`DexScreener error for ${contractAddress}:`, error);
    return null;
  }
}

/**
 * Get token pairs with price history from DexScreener
 * Note: DexScreener doesn't provide historical market cap directly,
 * but we can calculate it from price * circulating supply
 * @param {string} contractAddress - The token contract address
 */
export async function getDexScreenerPairs(contractAddress) {
  try {
    const url = `${BASE_URL}/dex/tokens/${contractAddress}`;
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.pairs || [];
  } catch (error) {
    console.error(`DexScreener pairs error for ${contractAddress}:`, error);
    return null;
  }
}

/**
 * Fetch current market cap and FDV from DexScreener
 * Returns current snapshot (not historical)
 */
export async function fetchDexScreenerMarketCap(token) {
  try {
    const pair = await getDexScreenerToken(token.platform, token.contract);

    if (!pair) {
      return null;
    }

    // DexScreener provides fdv (fully diluted valuation) and marketCap
    const marketCap = pair.marketCap || pair.fdv || 0;
    const priceUsd = parseFloat(pair.priceUsd) || 0;

    if (marketCap === 0 && priceUsd === 0) {
      return null;
    }

    // Create a single data point for current time
    // DexScreener doesn't provide historical data via free API
    const now = Date.now();

    return {
      ...token,
      currentMarketCap: marketCap,
      currentPrice: priceUsd,
      priceChange24h: pair.priceChange?.h24 || 0,
      liquidity: pair.liquidity?.usd || 0,
      volume24h: pair.volume?.h24 || 0,
      pairAddress: pair.pairAddress,
      dexId: pair.dexId,
      // Single point for now - we'll need chart endpoint for history
      data: [{ x: now, y: Math.round(marketCap) }],
      source: 'dexscreener',
      lastUpdated: now
    };
  } catch (error) {
    console.error(`Error fetching DexScreener data for ${token.symbol}:`, error);
    return null;
  }
}

/**
 * Fetch chart data from DexScreener (requires pair address)
 * This gives us historical price data
 */
export async function fetchDexScreenerChart(pairAddress) {
  try {
    // DexScreener chart endpoint - gives OHLCV data
    const url = `https://api.dexscreener.com/latest/dex/pairs/chart/${pairAddress}`;
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`DexScreener chart error:`, error);
    return null;
  }
}
