// DexPaprika API service
// Completely free, no API key, no rate limits
// Historical OHLCV up to 1 year, 1-minute resolution available
// Docs: https://docs.dexpaprika.com

const BASE_URL = 'https://api.dexpaprika.com';

// Map our platform names to DexPaprika network IDs
const NETWORK_MAP = {
  'ethereum': 'ethereum',
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

/**
 * Get pools for a token from DexPaprika
 */
export async function getTokenPools(platform, contractAddress) {
  const network = NETWORK_MAP[platform] || platform;
  const cacheKey = `dexpaprika_pools_${network}_${contractAddress}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `${BASE_URL}/networks/${network}/tokens/${contractAddress}/pools`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.warn(`DexPaprika: No pools for ${contractAddress}`);
      return null;
    }

    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`DexPaprika pools error:`, error);
    return null;
  }
}

/**
 * Get token info from DexPaprika
 */
export async function getTokenInfo(platform, contractAddress) {
  const network = NETWORK_MAP[platform] || platform;
  const cacheKey = `dexpaprika_token_${network}_${contractAddress}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `${BASE_URL}/networks/${network}/tokens/${contractAddress}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.warn(`DexPaprika: No token info for ${contractAddress}`);
      return null;
    }

    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`DexPaprika token info error:`, error);
    return null;
  }
}

/**
 * Get OHLCV historical data for a pool
 * @param {string} network - Network ID (ethereum, base, solana)
 * @param {string} poolAddress - Pool address
 * @param {number} days - Number of days of data to fetch
 */
export async function getPoolOHLCV(network, poolAddress, days = 30) {
  const cacheKey = `dexpaprika_ohlcv_${network}_${poolAddress}_${days}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    // Calculate start date
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Determine appropriate interval based on days requested
    let interval;
    let limit;
    if (days <= 1) {
      interval = '5m';
      limit = 288; // 24 hours at 5-min intervals
    } else if (days <= 7) {
      interval = '1h';
      limit = Math.min(days * 24, 366);
    } else if (days <= 30) {
      interval = '4h';
      limit = Math.min(days * 6, 366);
    } else {
      interval = '24h';
      limit = Math.min(days, 366);
    }

    const startStr = startDate.toISOString().split('T')[0];

    const url = `${BASE_URL}/networks/${network}/pools/${poolAddress}/ohlcv?start=${startStr}&limit=${limit}&interval=${interval}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.warn(`DexPaprika: No OHLCV for pool ${poolAddress}`);
      return null;
    }

    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`DexPaprika OHLCV error:`, error);
    return null;
  }
}

/**
 * Fetch complete market cap data for a token from DexPaprika
 */
export async function fetchDexPaprikaMarketCap(token, days = 30) {
  const network = NETWORK_MAP[token.platform] || token.platform;

  try {
    // Step 1: Get token info
    const tokenInfo = await getTokenInfo(token.platform, token.contract);

    // Step 2: Get pools for this token
    const poolsResponse = await getTokenPools(token.platform, token.contract);

    // DexPaprika returns { pools: [...] } structure
    const pools = poolsResponse?.pools || poolsResponse;

    if (!pools || !Array.isArray(pools) || pools.length === 0) {
      console.warn(`DexPaprika: No pools found for ${token.symbol}`);
      return null;
    }

    // Find the pool with highest volume (most reliable data)
    const bestPool = pools.reduce((best, pool) => {
      const volume = parseFloat(pool.volume_usd || 0);
      const bestVolume = parseFloat(best?.volume_usd || 0);
      return volume > bestVolume ? pool : best;
    }, pools[0]);

    if (!bestPool || !bestPool.id) {
      console.warn(`DexPaprika: No valid pool for ${token.symbol}`);
      return null;
    }

    const poolAddress = bestPool.id;

    // Step 3: Get OHLCV data
    const ohlcvData = await getPoolOHLCV(network, poolAddress, days);

    if (!ohlcvData || !Array.isArray(ohlcvData) || ohlcvData.length === 0) {
      console.warn(`DexPaprika: No OHLCV data for ${token.symbol}`);

      // Fall back to current price if available
      if (tokenInfo?.price_usd && tokenInfo?.market_cap) {
        return {
          ...token,
          data: [{ x: Date.now(), y: Math.round(tokenInfo.market_cap) }],
          currentMarketCap: tokenInfo.market_cap,
          currentPrice: tokenInfo.price_usd,
          source: 'dexpaprika',
          lastUpdated: Date.now()
        };
      }
      return null;
    }

    // Step 4: Calculate supply from current market cap and price
    // Try to get token info from the pool's tokens array
    const poolToken = bestPool.tokens?.find(t =>
      t.id?.toLowerCase() === token.contract.toLowerCase()
    );

    const currentPrice = parseFloat(bestPool.price_usd || tokenInfo?.price_usd || 0);
    const fdv = parseFloat(poolToken?.fdv || tokenInfo?.fdv_usd || tokenInfo?.market_cap || 0);
    const supply = currentPrice > 0 ? fdv / currentPrice : 0;

    // Step 5: Convert OHLCV to market cap time series
    // DexPaprika response format: { time_open, time_close, open, high, low, close, volume }
    const data = ohlcvData.map(candle => {
      const timestamp = new Date(candle.time_close || candle.time_open).getTime();
      const price = parseFloat(candle.close);
      const marketCap = supply > 0 ? price * supply : price * 1e9;

      return {
        x: timestamp,
        y: Math.round(marketCap)
      };
    }).filter(point => !isNaN(point.x) && !isNaN(point.y) && point.y > 0)
      .sort((a, b) => a.x - b.x);

    if (data.length === 0) {
      return null;
    }

    return {
      ...token,
      data,
      currentMarketCap: fdv || (currentPrice * supply),
      currentPrice,
      poolAddress,
      liquidity: parseFloat(bestPool.volume_usd || 0),
      source: 'dexpaprika',
      lastUpdated: Date.now()
    };
  } catch (error) {
    console.error(`DexPaprika error for ${token.symbol}:`, error);
    return null;
  }
}

/**
 * Clear cache
 */
export function clearCache() {
  cache.clear();
}
