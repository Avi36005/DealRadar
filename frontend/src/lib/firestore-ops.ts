/**
 * Firestore operations for DealRadar.
 * Uses flat top-level collections: "watchlist" and "price_history".
 */
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WatchlistItem {
  id: string;
  userEmail: string;
  productName: string;
  query: string;
  targetPrice: number;
  currentBestPrice: number;
  bestSource: string;
  createdAt: Timestamp;
}

export interface PriceHistoryEntry {
  id: string;
  productName: string;
  source: string;
  price: number;
  currency: string;
  stockStatus: string;
  fetchedAt: Timestamp;
}

export interface NormalizedResult {
  source: string;
  price: number;
  currency: string;
  stock: string;
  eta: string;
  rating: number;
  reviewCount: number;
  url: string;
  aiScore: number;
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

export async function getWatchlistForUser(userEmail: string): Promise<WatchlistItem[]> {
  const q = query(
    collection(db, 'watchlist'),
    where('userEmail', '==', userEmail)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as WatchlistItem));
}

export async function addToWatchlist(
  userEmail: string,
  productName: string,
  searchQuery: string,
  targetPrice: number,
  currentBestPrice: number,
  bestSource: string = ''
): Promise<string> {
  const ref = await addDoc(collection(db, 'watchlist'), {
    userEmail,
    productName,
    query: searchQuery,
    targetPrice,
    currentBestPrice,
    bestSource,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteFromWatchlist(id: string): Promise<void> {
  await deleteDoc(doc(db, 'watchlist', id));
}

export async function updateWatchlistBestPrice(
  id: string,
  newPrice: number,
  sourceName: string
): Promise<void> {
  await updateDoc(doc(db, 'watchlist', id), {
    currentBestPrice: newPrice,
    bestSource: sourceName,
  });
}

// ─── Price History ────────────────────────────────────────────────────────────

export async function savePriceHistoryBatch(
  productName: string,
  results: NormalizedResult[]
): Promise<void> {
  await Promise.all(
    results
      .filter((r) => r.price != null && r.price > 0)
      .map((r) =>
        addDoc(collection(db, 'price_history'), {
          productName,
          source: r.source,
          price: r.price,
          currency: r.currency || 'USD',
          stockStatus: r.stock || 'Unknown',
          fetchedAt: serverTimestamp(),
        })
      )
  );
}

export async function getPriceHistoryForProduct(
  productName: string
): Promise<PriceHistoryEntry[]> {
  const thirtyDaysAgo = Timestamp.fromDate(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  const q = query(
    collection(db, 'price_history'),
    where('productName', '==', productName),
    where('fetchedAt', '>=', thirtyDaysAgo),
    orderBy('fetchedAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PriceHistoryEntry));
}

// ─── Negotiation Email History (stored in aiInteractions) ────────────────────

export interface EmailRecord {
  id: string;
  userEmail: string;
  productName: string;
  supplierName: string;
  emailBody: string;
  status: 'Draft' | 'Sent';
  createdAt: Timestamp;
}

export async function saveEmailRecord(
  userEmail: string,
  productName: string,
  supplierName: string,
  emailBody: string
): Promise<string> {
  const ref = await addDoc(collection(db, 'email_history'), {
    userEmail,
    productName,
    supplierName,
    emailBody,
    status: 'Draft',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getEmailHistoryForUser(userEmail: string): Promise<EmailRecord[]> {
  const q = query(
    collection(db, 'email_history'),
    where('userEmail', '==', userEmail),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as EmailRecord));
}
