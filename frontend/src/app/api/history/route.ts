import { NextRequest, NextResponse } from 'next/server';

/**
 * GET  /api/history?product=...   — fetch last 30 days of price_history
 * POST /api/history               — save a batch of results (called after each search)
 */

async function getOps() {
  const { getPriceHistoryForProduct, savePriceHistoryBatch } = await import(
    '@/lib/firestore-ops'
  );
  return { getPriceHistoryForProduct, savePriceHistoryBatch };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const product = searchParams.get('product');

    if (!product) {
      return NextResponse.json({ error: 'product is required' }, { status: 400 });
    }

    const { getPriceHistoryForProduct } = await getOps();
    const history = await getPriceHistoryForProduct(product);

    return NextResponse.json({ success: true, product, history });
  } catch (error) {
    console.error('History GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get price history' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productName, results } = body;

    if (!productName || !Array.isArray(results)) {
      return NextResponse.json(
        { error: 'productName and results array are required' },
        { status: 400 }
      );
    }

    const { savePriceHistoryBatch } = await getOps();
    await savePriceHistoryBatch(productName, results);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('History POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save price history' },
      { status: 500 }
    );
  }
}
