// Main API service - uses GeckoTerminal as primary source
// GeckoTerminal: 30 calls/min, 6 months historical OHLCV
// DexPaprika: Free, no rate limits, up to 1 year historical OHLCV
// Fallback: DexScreener for real-time data only

import {
  fetchGeckoTerminalMarketCap,
  fetchAllTokensMarketCap as fetchAllGeckoTerminal,
  clearCache as clearGeckoTerminalCache,
  daysToApiParam
} from './geckoterminal';

import {
  fetchDexPaprikaMarketCap,
  clearCache as clearDexPaprikaCache
} from './dexpaprika';

import { fetchDexScreenerMarketCap } from './dexscreener';

// Re-export the GeckoTerminal functions as the main API
export { daysToApiParam };

// Simple cache for combined results
const resultCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key) {
  const cached = resultCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key, data) {
  resultCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Fetch market cap data for a token
 * Tries GeckoTerminal first, then DexPaprika, then DexScreener
 */
export async function fetchTokenMarketCap(token, days = 30) {
  const cacheKey = `token_${token.id}_${days}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // Try GeckoTerminal first (has historical data, up to 6 months)
  try {
    console.log(`Fetching ${token.symbol} from GeckoTerminal...`);
    const result = await fetchGeckoTerminalMarketCap(token, days);

    if (result && result.data && result.data.length > 0) {
      console.log(`✓ ${token.symbol}: ${result.data.length} data points from GeckoTerminal`);
      setCache(cacheKey, result);
      return result;
    }
  } catch (error) {
    console.warn(`GeckoTerminal failed for ${token.symbol}:`, error.message);
  }

  // Try DexPaprika next (free, no rate limits, up to 1 year historical)
  try {
    console.log(`Trying DexPaprika for ${token.symbol}...`);
    const paprikaResult = await fetchDexPaprikaMarketCap(token, days);

    if (paprikaResult && paprikaResult.data && paprikaResult.data.length > 0) {
      console.log(`✓ ${token.symbol}: ${paprikaResult.data.length} data points from DexPaprika`);
      setCache(cacheKey, paprikaResult);
      return paprikaResult;
    }
  } catch (error) {
    console.warn(`DexPaprika failed for ${token.symbol}:`, error.message);
  }

  // Fallback to DexScreener (only current data, no history)
  try {
    console.log(`Trying DexScreener for ${token.symbol}...`);
    const dexResult = await fetchDexScreenerMarketCap(token);

    if (dexResult && dexResult.data && dexResult.data.length > 0) {
      console.log(`✓ ${token.symbol}: current data from DexScreener`);
      setCache(cacheKey, dexResult);
      return dexResult;
    }
  } catch (error) {
    console.warn(`DexScreener also failed for ${token.symbol}:`, error.message);
  }

  console.warn(`✗ ${token.symbol}: No data from any source`);
  return null;
}

/**
 * Fetch market cap data for multiple tokens
 */
export async function fetchAllTokensMarketCap(tokens, days = 30, onProgress) {
  const results = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (onProgress) {
      onProgress({
        current: i + 1,
        total: tokens.length,
        token: token.symbol
      });
    }

    const result = await fetchTokenMarketCap(token, days);

    if (result) {
      results.push(result);
    } else {
      results.push({
        ...token,
        data: [],
        error: true,
        source: 'none'
      });
    }
  }

  return results;
}

/**
 * Clear all caches
 */
export function clearCache() {
  resultCache.clear();
  clearGeckoTerminalCache();
  clearDexPaprikaCache();
}

/**
 * Get token info (for AddToken component)
 */
export async function getTokenByContract(platform, contractAddress) {
  // Import dynamically to avoid circular deps
  const { getTokenInfo } = await import('./geckoterminal');
  return getTokenInfo(platform, contractAddress);
}
