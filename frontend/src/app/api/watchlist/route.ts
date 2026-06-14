import { NextRequest, NextResponse } from 'next/server';

/**
 * Watchlist API routes.
 * Uses flat Firestore "watchlist" collection.
 * Auth: reads user_email from request body / query param (hackathon simplification).
 *
 * GET  /api/watchlist?user_email=...
 * POST /api/watchlist  { user_email, product_name, query, target_price }
 * DELETE /api/watchlist?id=...
 */

// Dynamic import of Firestore ops to avoid SSR issues
async function getOps() {
  const {
    getWatchlistForUser,
    addToWatchlist,
    deleteFromWatchlist,
  } = await import('@/lib/firestore-ops');
  return { getWatchlistForUser, addToWatchlist, deleteFromWatchlist };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('user_email');

    if (!userEmail) {
      return NextResponse.json({ error: 'user_email is required' }, { status: 400 });
    }

    const { getWatchlistForUser } = await getOps();
    const items = await getWatchlistForUser(userEmail);

    return NextResponse.json({ success: true, watchlist: items });
  } catch (error) {
    console.error('Watchlist GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get watchlist' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_email, product_name, query, target_price } = body;

    if (!user_email || !product_name || !query) {
      return NextResponse.json(
        { error: 'user_email, product_name, and query are required' },
        { status: 400 }
      );
    }

    const { addToWatchlist } = await getOps();
    const id = await addToWatchlist(
      user_email,
      product_name,
      query,
      parseFloat(target_price) || 0,
      0,
      ''
    );

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Watchlist POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add to watchlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { deleteFromWatchlist } = await getOps();
    await deleteFromWatchlist(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Watchlist DELETE error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete watchlist item' },
      { status: 500 }
    );
  }
}
