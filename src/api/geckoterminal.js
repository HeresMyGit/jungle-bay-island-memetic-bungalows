// GeckoTerminal API service
// Free tier: 30 calls/min, no API key needed
// Historical OHLCV up to 6 months

const BASE_URL = 'https://api.geckoterminal.com/api/v2';

// Map our platform names to GeckoTerminal network IDs
const NETWORK_MAP = {
  'ethereum': 'eth',
  'base': 'base',
  'solana': 'solana'
};

// Simple cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2100; // ~28 requests/min to stay safe

async function rateLimitedFetch(url) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.status === 429) {
      console.warn('GeckoTerminal rate limited, waiting 60s...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      return fetch(url);
    }

    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}

/**
 * Get token info including pools
 */
export async function getTokenInfo(platform, contractAddress) {
  const network = NETWORK_MAP[platform] || platform;
  const cacheKey = `token_info_${network}_${contractAddress}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `${BASE_URL}/networks/${network}/tokens/${contractAddress}`;
    const response = await rateLimitedFetch(url);

    if (!response || !response.ok) {
      console.warn(`GeckoTerminal: No token info for ${contractAddress}`);
      return null;
    }

    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`GeckoTerminal token info error:`, error);
    return null;
  }
}

/**
 * Get pools for a token - returns list of pools trading this token
 */
export async function getTokenPools(platform, contractAddress) {
  const network = NETWORK_MAP[platform] || platform;
  const cacheKey = `token_pools_${network}_${contractAddress}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `${BASE_URL}/networks/${network}/tokens/${contractAddress}/pools?page=1`;
    const response = await rateLimitedFetch(url);

    if (!response || !response.ok) {
      console.warn(`GeckoTerminal: No pools for ${contractAddress}`);
      return null;
    }

    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`GeckoTerminal pools error:`, error);
    return null;
  }
}

/**
 * Get OHLCV data for a pool
 * @param {string} network - Network ID (eth, base, solana)
 * @param {string} poolAddress - Pool/pair address
 * @param {string} timeframe - 'day', 'hour', or 'minute'
 * @param {number} aggregate - Aggregation period (e.g., 1 for 1-day candles)
 * @param {number} limit - Number of candles (max 1000)
 */
export async function getPoolOHLCV(network, poolAddress, timeframe = 'day', aggregate = 1, limit = 180) {
  const cacheKey = `ohlcv_${network}_${poolAddress}_${timeframe}_${aggregate}_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `${BASE_URL}/networks/${network}/pools/${poolAddress}/ohlcv/${timeframe}?aggregate=${aggregate}&limit=${limit}&currency=usd`;
    const response = await rateLimitedFetch(url);

    if (!response || !response.ok) {
      console.warn(`GeckoTerminal: No OHLCV for pool ${poolAddress}`);
      return null;
    }

    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`GeckoTerminal OHLCV error:`, error);
    return null;
  }
}

/**
 * Fetch complete market cap data for a token
 * 1. Find the best pool for the token
 * 2. Get OHLCV data
 * 3. Calculate market cap from price * supply (or use FDV)
 */
export async function fetchGeckoTerminalMarketCap(token, days = 30) {
  const network = NETWORK_MAP[token.platform] || token.platform;

  try {
    // Step 1: Get token info (includes FDV, market cap)
    const tokenInfo = await getTokenInfo(token.platform, token.contract);
    const tokenData = tokenInfo?.data?.attributes;

    // Step 2: Get pools for this token
    const poolsData = await getTokenPools(token.platform, token.contract);

    if (!poolsData?.data || poolsData.data.length === 0) {
      console.warn(`No pools found for ${token.symbol}`);
      return null;
    }

    // Find the pool with highest liquidity (most reliable data)
    const pools = poolsData.data;
    const bestPool = pools.reduce((best, pool) => {
      const liquidity = parseFloat(pool.attributes?.reserve_in_usd || 0);
      const bestLiquidity = parseFloat(best?.attributes?.reserve_in_usd || 0);
      return liquidity > bestLiquidity ? pool : best;
    }, pools[0]);

    if (!bestPool) {
      console.warn(`No valid pool for ${token.symbol}`);
      return null;
    }

    const poolAddress = bestPool.attributes?.address;

    // Step 3: Determine timeframe based on days requested
    let timeframe, aggregate, limit;
    if (days <= 1) {
      timeframe = 'minute';
      aggregate = 15; // 15-min candles
      limit = 96; // 24 hours
    } else if (days <= 7) {
      timeframe = 'hour';
      aggregate = 1;
      limit = Math.min(days * 24, 168);
    } else if (days <= 30) {
      timeframe = 'hour';
      aggregate = 4; // 4-hour candles
      limit = Math.min(days * 6, 180);
    } else {
      timeframe = 'day';
      aggregate = 1;
      limit = Math.min(days, 180); // Max 6 months
    }

    // Step 4: Get OHLCV data
    const ohlcvData = await getPoolOHLCV(network, poolAddress, timeframe, aggregate, limit);

    if (!ohlcvData?.data?.attributes?.ohlcv_list) {
      console.warn(`No OHLCV data for ${token.symbol}`);
      // Fall back to current market cap only
      if (tokenData?.fdv_usd || tokenData?.market_cap_usd) {
        const mcap = parseFloat(tokenData.market_cap_usd || tokenData.fdv_usd);
        return {
          ...token,
          data: [{ x: Date.now(), y: Math.round(mcap) }],
          currentMarketCap: mcap,
          source: 'geckoterminal',
          lastUpdated: Date.now()
        };
      }
      return null;
    }

    // Step 5: Convert OHLCV to market cap data
    // OHLCV format: [timestamp, open, high, low, close, volume]
    const fdv = parseFloat(tokenData?.fdv_usd || 0);
    const currentPrice = parseFloat(tokenData?.price_usd || bestPool.attributes?.base_token_price_usd || 0);

    // Calculate supply from FDV and current price
    const supply = currentPrice > 0 ? fdv / currentPrice : 0;

    const ohlcvList = ohlcvData.data.attributes.ohlcv_list;

    // Convert to market cap time series
    const data = ohlcvList.map(candle => {
      const [timestamp, open, high, low, close, volume] = candle;
      // Use close price to calculate market cap
      const price = parseFloat(close);
      const marketCap = supply > 0 ? price * supply : price * 1e9; // Fallback estimate

      return {
        x: timestamp * 1000, // Convert to milliseconds
        y: Math.round(marketCap)
      };
    }).sort((a, b) => a.x - b.x); // Sort chronologically

    return {
      ...token,
      data,
      currentMarketCap: fdv || (currentPrice * supply),
      currentPrice,
      poolAddress,
      liquidity: parseFloat(bestPool.attributes?.reserve_in_usd || 0),
      source: 'geckoterminal',
      lastUpdated: Date.now()
    };
  } catch (error) {
    console.error(`GeckoTerminal error for ${token.symbol}:`, error);
    return null;
  }
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

    const result = await fetchGeckoTerminalMarketCap(token, days);

    if (result && result.data && result.data.length > 0) {
      results.push(result);
    } else {
      // Token failed - add without data
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
 * Clear cache
 */
export function clearCache() {
  cache.clear();
}

/**
 * Convert days to appropriate API params
 */
export function daysToApiParam(days) {
  if (days === null || days === 'max') return 180; // Max 6 months
  return Math.min(days, 180);
}
