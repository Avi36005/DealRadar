/**
 * Firestore (GCP) data layer for DealRadar.
 *
 * Uses a dedicated NAMED Firestore database ("dealradar") inside the existing
 * GCP project so we never touch any pre-existing data (e.g. the mediflow app's
 * default database). On Cloud Run, Application Default Credentials are used
 * automatically — no key file required.
 *
 * Collections: watchlist, price_history, email_history
 */
const { Firestore, FieldValue } = require("@google-cloud/firestore");

const PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.FIREBASE_PROJECT_ID ||
  undefined;

// Named database keeps DealRadar fully isolated from any other app's data.
const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || "dealradar";

let db = null;
let firestoreReady = false;

try {
  db = new Firestore({
    projectId: PROJECT_ID,
    databaseId: DATABASE_ID,
    ignoreUndefinedProperties: true,
  });
  firestoreReady = true;
  console.log(
    `[firestore] connected → project=${PROJECT_ID || "(ADC default)"} database=${DATABASE_ID}`
  );
} catch (err) {
  console.error("[firestore] init failed, running in degraded mode:", err.message);
  firestoreReady = false;
}

const COL = {
  WATCHLIST: "watchlist",
  PRICE_HISTORY: "price_history",
  EMAIL_HISTORY: "email_history",
};

// ─── Watchlist ────────────────────────────────────────────────────────────────

async function listWatchlist(userEmail) {
  if (!firestoreReady) return [];
  let ref = db.collection(COL.WATCHLIST);
  if (userEmail) ref = ref.where("user_email", "==", userEmail);
  const snap = await ref.get();
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  rows.sort((a, b) => (b.created_at?.toMillis?.() || 0) - (a.created_at?.toMillis?.() || 0));
  return rows;
}

async function addWatchlist({ user_email, product_name, query, target_price }) {
  const doc = {
    user_email,
    product_name,
    query: query || product_name,
    target_price: parseFloat(target_price),
    current_best_price: parseFloat(target_price) * 1.05,
    best_source: "",
    created_at: FieldValue.serverTimestamp(),
  };
  if (!firestoreReady) {
    return { id: Math.random().toString(36).slice(2, 11), ...doc, created_at: new Date().toISOString() };
  }
  const ref = await db.collection(COL.WATCHLIST).add(doc);
  const saved = await ref.get();
  return { id: ref.id, ...saved.data() };
}

async function deleteWatchlist(id) {
  if (!firestoreReady) return;
  await db.collection(COL.WATCHLIST).doc(id).delete();
}

async function updateWatchlistPrice(id, current_best_price, best_source) {
  if (!firestoreReady) return;
  await db.collection(COL.WATCHLIST).doc(id).update({ current_best_price, best_source });
}

async function getAllWatchlist() {
  if (!firestoreReady) return [];
  const snap = await db.collection(COL.WATCHLIST).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── Price History ────────────────────────────────────────────────────────────

async function savePriceBatch(productName, results) {
  if (!firestoreReady) return;
  const batch = db.batch();
  results
    .filter((r) => r.price != null && r.price > 0)
    .forEach((r) => {
      const ref = db.collection(COL.PRICE_HISTORY).doc();
      batch.set(ref, {
        product_name: productName,
        source: r.source,
        price: r.price,
        currency: r.currency || "USD",
        stock_status: r.stock || "Unknown",
        fetched_at: FieldValue.serverTimestamp(),
      });
    });
  await batch.commit();
}

async function getPriceHistory(productName) {
  if (!firestoreReady) return [];
  const snap = await db
    .collection(COL.PRICE_HISTORY)
    .where("product_name", "==", productName)
    .get();
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  rows.sort((a, b) => (a.fetched_at?.toMillis?.() || 0) - (b.fetched_at?.toMillis?.() || 0));
  return rows;
}

// ─── Email History ──────────────────────────────────────────────────────────

async function saveEmail({ user_email, product_name, supplier_name, email_body }) {
  if (!firestoreReady) return { id: "local-draft" };
  const ref = await db.collection(COL.EMAIL_HISTORY).add({
    user_email,
    product_name,
    supplier_name,
    email_body,
    status: "Draft",
    created_at: FieldValue.serverTimestamp(),
  });
  return { id: ref.id };
}

module.exports = {
  db,
  firestoreReady,
  COL,
  FieldValue,
  listWatchlist,
  addWatchlist,
  deleteWatchlist,
  updateWatchlistPrice,
  getAllWatchlist,
  savePriceBatch,
  getPriceHistory,
  saveEmail,
};
