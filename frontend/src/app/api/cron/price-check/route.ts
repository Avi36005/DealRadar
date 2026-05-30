import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'nodejs';

/**
 * GET /api/cron/price-check
 * Called by Vercel Cron daily at 8AM (see vercel.json).
 * 1. Fetches all watchlist items from Firestore.
 * 2. Re-runs Wire search for each product.
 * 3. If new best price <= targetPrice: sends Resend email + updates Firestore.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { getDocs, collection } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');
    const { searchAllSources } = await import('@/lib/wire');
    const { updateWatchlistBestPrice } = await import('@/lib/firestore-ops');

    const apiKey = process.env.ANAKIN_WIRE_API_KEY || '';
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Fetch all watchlist items
    const snap = await getDocs(collection(db, 'watchlist'));
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

    const results = [];

    for (const item of items) {
      try {
        const { results: wireResults } = await searchAllSources(item.query || item.productName, apiKey);

        const validPrices = wireResults.filter((r) => r.price != null && r.price > 0);
        if (validPrices.length === 0) continue;

        const best = validPrices.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0];
        const newBestPrice = best.price!;
        const bestSource = best.source;

        // Update Firestore regardless
        await updateWatchlistBestPrice(item.id, newBestPrice, bestSource);

        // Send alert if target reached
        if (item.targetPrice && newBestPrice <= item.targetPrice && item.userEmail) {
          await resend.emails.send({
            from: 'DealRadar <alerts@dealradar.app>',
            to: item.userEmail,
            subject: `🎯 DealRadar: Price target hit for ${item.productName}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #16A34A;">🎯 Price Target Reached!</h2>
                <p>Great news! The price for <strong>${item.productName}</strong> has dropped to your target.</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <tr>
                    <td style="padding: 8px; border: 1px solid #e4e4e7; color: #71717a;">Current Best Price</td>
                    <td style="padding: 8px; border: 1px solid #e4e4e7; font-family: monospace; font-weight: bold; color: #16A34A;">$${newBestPrice.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border: 1px solid #e4e4e7; color: #71717a;">Your Target Price</td>
                    <td style="padding: 8px; border: 1px solid #e4e4e7; font-family: monospace; font-weight: bold;">$${item.targetPrice.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border: 1px solid #e4e4e7; color: #71717a;">Best Source</td>
                    <td style="padding: 8px; border: 1px solid #e4e4e7;">${bestSource}</td>
                  </tr>
                </table>
                ${best.url ? `<a href="${best.url}" style="display: inline-block; background: #16A34A; color: white; padding: 12px 24px; border-radius: 24px; text-decoration: none; font-weight: bold;">View Deal →</a>` : ''}
                <p style="color: #a1a1aa; font-size: 12px; margin-top: 32px;">Powered by Anakin Intelligence · DealRadar</p>
              </div>
            `,
          });
        }

        results.push({
          product: item.productName,
          newBestPrice,
          bestSource,
          targetReached: item.targetPrice ? newBestPrice <= item.targetPrice : false,
        });
      } catch (err) {
        console.error(`Cron error for ${item.productName}:`, err);
        results.push({ product: item.productName, error: String(err) });
      }
    }

    return NextResponse.json({
      success: true,
      productsChecked: items.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cron job failed' },
      { status: 500 }
    );
  }
}

// Allow manual POST trigger
export async function POST(request: NextRequest) {
  return GET(request);
}
