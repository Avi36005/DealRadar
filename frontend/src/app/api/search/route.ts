import { NextRequest, NextResponse } from 'next/server';
import { searchAllSources, WIRE_SOURCES, NormalizedResult } from '@/lib/wire';

/**
 * POST /api/search
 * Accepts: { query: string, region?: "IN" | "US" | "GLOBAL" }
 * Streams results back as Server-Sent Events (text/event-stream).
 * Each source resolves independently and is pushed as it arrives.
 * After all sources resolve, saves batch to Firestore price_history.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, region = 'GLOBAL' } = body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    const apiKey = process.env.ANAKIN_WIRE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANAKIN_WIRE_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // ── SSE stream ────────────────────────────────────────────────────────────
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        send('start', { query, region, totalSources: WIRE_SOURCES.length });

        // Fire all 7 Wire calls simultaneously; push each result as it settles
        const TIMEOUT_MS = 10_000;
        const allResults: NormalizedResult[] = [];

        const promises = WIRE_SOURCES.map(async (src) => {
          const controller2 = new AbortController();
          const timer = setTimeout(() => controller2.abort(), TIMEOUT_MS);

          try {
            const res = await fetch('https://api.anakin.ai/v1/wire', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                source: src.id,
                action: src.action,
                query: query.trim(),
              }),
              signal: controller2.signal,
            });
            clearTimeout(timer);

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            // Normalize
            const item = Array.isArray(data?.results) ? data.results[0] : data;
            const result: NormalizedResult = {
              source: src.displayName,
              price: parseFloat(item?.price ?? item?.unitPrice ?? item?.moqPrice ?? 0) || null,
              currency: item?.currency ?? 'USD',
              stock: item?.stock ?? item?.availability ?? item?.stockStatus ?? 'Unknown',
              eta: item?.eta ?? item?.deliveryDate ?? item?.shippingETA ?? '—',
              rating: parseFloat(item?.rating ?? item?.sellerRating ?? 0),
              reviewCount: parseInt(item?.reviewCount ?? item?.reviews ?? 0),
              url: item?.url ?? item?.productUrl ?? '',
              aiScore: 0,
            };

            allResults.push(result);
            send('source', { ...result, resolved: true });
          } catch (err: any) {
            clearTimeout(timer);
            const result: NormalizedResult = {
              source: src.displayName,
              price: null,
              currency: 'USD',
              stock: 'Data unavailable',
              eta: '—',
              rating: 0,
              reviewCount: 0,
              url: '',
              aiScore: 0,
              error: err.name === 'AbortError' ? 'timeout' : (err.message || 'error'),
            };
            allResults.push(result);
            send('source', { ...result, resolved: false });
          }
        });

        await Promise.allSettled(promises);

        // Calculate aiScores now that we have all prices
        const validPrices = allResults
          .map((r) => r.price)
          .filter((p): p is number => p !== null && p > 0)
          .sort((a, b) => a - b);

        const median = validPrices.length
          ? validPrices[Math.floor(validPrices.length / 2)]
          : 0;

        const scored = allResults.map((r) => {
          if (r.error || r.price === null) return r;
          let score = 100;
          if (median > 0) {
            const delta = ((r.price - median) / median) * 100;
            score -= Math.min(Math.max(delta, 0), 30);
          }
          const sl = r.stock.toLowerCase();
          if (sl.includes('out') || sl.includes('unavailable')) score -= 20;
          else if (sl.includes('low')) score -= 10;
          const el = r.eta.toLowerCase();
          if (el.includes('week') || el.includes('7')) score -= 10;
          else if (el.includes('5') || el.includes('6')) score -= 5;
          if (r.rating >= 4.5) score += 10;
          else if (r.rating >= 4.0) score += 5;
          return { ...r, aiScore: Math.round(Math.min(Math.max(score, 0), 100)) };
        });

        // Save to Firestore price_history (fire-and-forget, don't block stream)
        try {
          const { savePriceHistoryBatch } = await import('@/lib/firestore-ops');
          await savePriceHistoryBatch(query.trim(), scored);
        } catch (e) {
          console.error('Failed to save price history:', e);
        }

        send('complete', {
          results: scored,
          resolvedCount: scored.filter((r) => !r.error).length,
          failedCount: scored.filter((r) => !!r.error).length,
          timestamp: Date.now(),
        });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Search route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
