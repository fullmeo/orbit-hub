// ORBIT 2.0 - Payment Conversion Service
// Handles EUR → USDC conversion with caching

const rateCache = new Map();
const CACHE_TTL_MS = 3600000; // 1 hour

async function convertEURtoUSDC(amount) {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  const rate = await getEURUSDRate();
  return Math.round(amount * rate * 100) / 100;
}

async function getEURUSDRate() {
  const cacheKey = 'EUR_USD';
  const cached = rateCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.rate;
  }

  try {
    const response = await fetch('https://api.sandbox.circle.com/v1/configuration/payment/fiat-currency-pairs', {
      headers: {
        'Authorization': `Bearer ${process.env.CIRCLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Circle API error: ${response.status}`);
    }

    const data = await response.json();
    const eurUsdPair = (data.pairs && data.pairs.find(p => p.from === 'EUR' && p.to === 'USDC')) ||
                       (data.pairs && data.pairs.find(p => p.from === 'EUR' && p.to === 'USD'));

    if (!eurUsdPair) {
      throw new Error('EUR/USD rate not found');
    }

    rateCache.set(cacheKey, {
      rate: eurUsdPair.rate,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return eurUsdPair.rate;
  } catch (error) {
    if (cached) {
      console.warn('[Conversion] Using expired cached rate due to API failure');
      return cached.rate;
    }
    console.error('[Conversion] No cached rate available, using hardcoded fallback');
    return 1.1;
  }
}

module.exports = {
  convertEURtoUSDC,
  clearCache: () => rateCache.clear(),
  getCacheHitRate: () => rateCache.size > 0 ? 1 : 0,
};
