/**
 * Anakin Wire API Integration
 * Fans out across 7 supplier sources simultaneously using Promise.allSettled.
 * Each call has a 10-second timeout. Failures return { source, error, price: null }.
 */

export interface NormalizedResult {
  source: string;
  price: number | null;
  currency: string;
  stock: string;
  eta: string;
  rating: number;
  reviewCount: number;
  url: string;
  aiScore: number;
  error?: string;
}

interface WireSourceConfig {
  id: string;
  displayName: string;
  action: string;
}

const WIRE_SOURCES: WireSourceConfig[] = [
  { id: 'amazon',    displayName: 'Amazon',    action: 'search products' },
  { id: 'flipkart',  displayName: 'Flipkart',  action: 'search products' },
  { id: 'walmart',   displayName: 'Walmart',   action: 'search products' },
  { id: 'costco',    displayName: 'Costco',    action: 'search products' },
  { id: 'indiamart', displayName: 'IndiaMART', action: 'search products' },
  { id: 'ebay',      displayName: 'eBay',      action: 'search listings' },
  { id: 'bigbasket', displayName: 'BigBasket', action: 'search products' },
];

const WIRE_BASE_URL = 'https://api.anakin.ai/v1/wire';
const TIMEOUT_MS = 10_000;

// ─── Single source fetch with timeout ────────────────────────────────────────

async function fetchOneSource(
  source: WireSourceConfig,
  query: string,
  apiKey: string
): Promise<NormalizedResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(WIRE_BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: source.id,
        action: source.action,
        query,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    // Normalize the Wire response to our standard shape
    return normalizeWireResponse(source.displayName, data);
  } catch (err: any) {
    clearTimeout(timer);
    const isTimeout = err.name === 'AbortError';
    return {
      source: source.displayName,
      price: null,
      currency: 'USD',
      stock: 'Data unavailable',
      eta: '—',
      rating: 0,
      reviewCount: 0,
      url: '',
      aiScore: 0,
      error: isTimeout ? 'timeout' : (err.message || 'error'),
    };
  }
}

// ─── Normalize Wire response to our standard shape ───────────────────────────

function normalizeWireResponse(sourceName: string, data: any): NormalizedResult {
  // Wire returns an array of products; take the first (best) match
  const item = Array.isArray(data?.results) ? data.results[0] : data;

  const price = parseFloat(item?.price ?? item?.unitPrice ?? item?.moqPrice ?? 0) || null;
  const rating = parseFloat(item?.rating ?? item?.sellerRating ?? item?.supplierRating ?? 0);
  const reviewCount = parseInt(item?.reviewCount ?? item?.reviews ?? item?.feedbackScore ?? 0);
  const stock = item?.stock ?? item?.availability ?? item?.stockStatus ?? 'Unknown';
  const eta = item?.eta ?? item?.deliveryDate ?? item?.shippingETA ?? '—';
  const url = item?.url ?? item?.productUrl ?? item?.listingUrl ?? '';
  const currency = item?.currency ?? 'USD';

  return {
    source: sourceName,
    price,
    currency,
    stock,
    eta,
    rating,
    reviewCount,
    url,
    aiScore: 0, // calculated below after all results are in
    error: undefined,
  };
}

// ─── Calculate aiScore after all results are collected ───────────────────────

function calculateAiScores(results: NormalizedResult[]): NormalizedResult[] {
  const validPrices = results
    .map((r) => r.price)
    .filter((p): p is number => p !== null && p > 0);

  if (validPrices.length === 0) return results;

  const median = validPrices.sort((a, b) => a - b)[Math.floor(validPrices.length / 2)];

  return results.map((r) => {
    if (r.error || r.price === null) return { ...r, aiScore: 0 };

    let score = 100;

    // Price penalty: each 1% above median costs 1 point (max -30)
    const priceDelta = ((r.price - median) / median) * 100;
    score -= Math.min(Math.max(priceDelta, 0), 30);

    // Stock penalty
    const stockLower = r.stock.toLowerCase();
    if (stockLower.includes('out') || stockLower.includes('unavailable')) score -= 20;
    else if (stockLower.includes('low')) score -= 10;

    // ETA penalty
    const etaLower = r.eta.toLowerCase();
    if (etaLower.includes('week') || etaLower.includes('7')) score -= 10;
    else if (etaLower.includes('5') || etaLower.includes('6')) score -= 5;

    // Rating bonus (max +10)
    if (r.rating >= 4.5) score += 10;
    else if (r.rating >= 4.0) score += 5;

    return { ...r, aiScore: Math.round(Math.min(Math.max(score, 0), 100)) };
  });
}

// ─── Main export: search all 7 sources in parallel ───────────────────────────

export interface WireSearchResult {
  results: NormalizedResult[];
  resolvedCount: number;
  failedCount: number;
  timestamp: number;
}

export async function searchAllSources(
  query: string,
  apiKey: string
): Promise<WireSearchResult> {
  if (!apiKey) throw new Error('ANAKIN_WIRE_API_KEY is not configured');

  const settled = await Promise.allSettled(
    WIRE_SOURCES.map((src) => fetchOneSource(src, query, apiKey))
  );

  const results: NormalizedResult[] = settled.map((outcome, i) => {
    if (outcome.status === 'fulfilled') return outcome.value;
    return {
      source: WIRE_SOURCES[i].displayName,
      price: null,
      currency: 'USD',
      stock: 'Data unavailable',
      eta: '—',
      rating: 0,
      reviewCount: 0,
      url: '',
      aiScore: 0,
      error: 'error',
    };
  });

  const scored = calculateAiScores(results);
  const resolvedCount = scored.filter((r) => !r.error).length;

  return {
    results: scored,
    resolvedCount,
    failedCount: scored.length - resolvedCount,
    timestamp: Date.now(),
  };
}

export { WIRE_SOURCES };
