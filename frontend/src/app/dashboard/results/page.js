'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import {
  addToWatchlist as firestoreAddToWatchlist,
  savePriceHistoryBatch,
  saveEmailRecord,
} from '@/lib/firestore-ops';
import { API_BASE } from '@/lib/config';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Mail, TrendingUp, Copy, Check, Bell, ExternalLink,
  ToggleLeft, ToggleRight, Search, ArrowLeft,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

// ── Currency utilities ────────────────────────────────────────────────────────
const USD_TO_INR = 83.5;

const SOURCE_CURRENCY = {
  'Flipkart': 'INR', 'IndiaMART': 'INR', 'BigBasket': 'INR',
};

function getCurrency(row) {
  if (row?.currency) return row.currency;
  return SOURCE_CURRENCY[row?.source] || 'USD';
}

function formatPrice(price, currency) {
  if (!price && price !== 0) return '—';
  if (currency === 'INR') return '₹' + Math.round(price).toLocaleString('en-IN');
  return '$' + price.toFixed(2);
}

function toUSD(price, currency) {
  return currency === 'INR' ? price / USD_TO_INR : price;
}

function dualPrice(price, currency) {
  if (!price) return { primary: '—', secondary: '' };
  if (currency === 'INR') {
    return { primary: '₹' + Math.round(price).toLocaleString('en-IN'), secondary: '~$' + (price / USD_TO_INR).toFixed(0) };
  }
  return { primary: '$' + price.toFixed(2), secondary: '~₹' + Math.round(price * USD_TO_INR).toLocaleString('en-IN') };
}
// ─────────────────────────────────────────────────────────────────────────────

const SOURCES_META = ['amazon', 'flipkart', 'walmart', 'costco', 'indiamart', 'ebay', 'bigbasket'];
const SOURCE_LABELS = {
  'Amazon US': 'amazon', Flipkart: 'flipkart', 'Walmart US': 'walmart',
  'Costco US': 'costco', IndiaMART: 'indiamart', 'eBay US': 'ebay', BigBasket: 'bigbasket',
};

function stockColor(s = '') {
  const l = s.toLowerCase();
  if (l.includes('out')) return 'bg-[#FEF2F2] text-[#DC2626]';
  if (l.includes('low')) return 'bg-[#FFFBEB] text-[#D97706]';
  return 'bg-[#F4F4F5] text-[#71717A]';
}

function scoreColor(score) {
  if (score >= 85) return 'bg-[#F0FDF4] text-[#16A34A]';
  if (score >= 60) return 'bg-[#FFFBEB] text-[#D97706]';
  return 'bg-[#FEF2F2] text-[#DC2626]';
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 text-[12px] text-[#71717A] hover:text-[#09090B] transition-colors"
    >
      {copied ? <><Check size={13} className="text-[#16A34A]" /> Copied</> : <><Copy size={13} /> Copy</>}
    </button>
  );
}

// ── Email Generator Modal ─────────────────────────────────────────────────────
function EmailModal({ row, query, cheapest, onClose, onSave }) {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [qty, setQty] = useState('50');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/ai/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplierName: row.source,
            theirPrice: `$${row.price?.toFixed(2)}`,
            bestCompetitorPrice: `$${cheapest?.price?.toFixed(2)}`,
            bestCompetitorSource: cheapest?.source,
            productName: query,
            quantity: parseInt(qty) || 50,
          }),
        });
        const data = await res.json();
        if (!cancelled) setEmail(data.emailBody || '');
      } catch {
        if (!cancelled) setEmail('Failed to generate. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [qty]);

  return (
    <>
      <motion.div className="fixed inset-0 bg-black/50 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      >
        <div className="bg-white rounded-2xl border border-[#E4E4E7] p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[17px] font-bold text-[#09090B]">Negotiation Email</h2>
              <p className="text-[12px] text-[#71717A]">To: {row.source} · Competitor: {cheapest?.source} @ ${cheapest?.price?.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[12px] text-[#A1A1AA]">Qty:</label>
              <input
                type="number" value={qty} onChange={(e) => setQty(e.target.value)}
                className="w-16 border border-[#E4E4E7] rounded-lg px-2 py-1 text-[13px] text-center"
              />
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-7 h-7 border-2 border-[#09090B] border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-[13px] text-[#71717A]">Gemini writing your email...</span>
            </div>
          ) : (
            <>
              <pre className="text-[13px] text-[#09090B] whitespace-pre-wrap font-sans leading-relaxed bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl px-4 py-4 mb-4">{email}</pre>
              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 border border-[#E4E4E7] text-[#71717A] py-2.5 rounded-xl text-[13px] font-medium hover:bg-[#F4F4F5] transition-colors">Close</button>
                <CopyBtn text={email} />
                <button
                  onClick={() => { onSave(row.source, email); onClose(); }}
                  className="flex-1 bg-[#09090B] text-white py-2.5 rounded-xl text-[13px] font-semibold hover:bg-[#16A34A] transition-colors"
                >
                  Save Draft
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ── AI Arbitrage Banner ───────────────────────────────────────────────────────
function ArbitrageBanner({ results, query }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!results.length) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/ai/arbitrage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ results, productName: query }),
        });
        const d = await res.json();
        setData(d);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4 mb-5 flex items-center gap-3">
      <div className="w-5 h-5 border-2 border-[#16A34A] border-t-transparent rounded-full animate-spin shrink-0" />
      <span className="text-[13px] text-[#16A34A] font-medium">AI analyzing arbitrage opportunities...</span>
    </div>
  );

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-[#F0FDF4] border border-[#16A34A] rounded-xl p-4 mb-5 flex items-start gap-3"
    >
      <Zap size={18} className="text-[#16A34A] mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="text-[14px] font-semibold text-[#16A34A] mb-0.5">
          Arbitrage Alert · Save {data.savingsPercent?.toFixed(1)}% (${data.savingsAmount?.toFixed(2)}/unit)
        </p>
        <p className="text-[13px] text-[#166534]">{data.reasoning}</p>
        <p className="text-[12px] text-[#16A34A] mt-1 font-medium">
          Buy on {data.bestSource} · Avoid {data.worstSource}
        </p>
      </div>
      <span className="text-[12px] font-bold px-2.5 py-1 rounded-full bg-[#16A34A] text-white shrink-0">
        {data.recommendation}
      </span>
    </motion.div>
  );
}

// ── Price Predictor ───────────────────────────────────────────────────────────
function PricePredictor({ query }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockHistory = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
      price: 1250 + Math.sin(i) * 30,
    }));
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/ai/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceHistory: mockHistory, productName: query }),
        });
        const d = await res.json();
        setData(d);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [query]);

  const verdictStyle = {
    BUY_NOW: 'bg-[#F0FDF4] border-[#16A34A] text-[#16A34A]',
    WAIT: 'bg-[#FFFBEB] border-[#D97706] text-[#D97706]',
    UNCERTAIN: 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB]',
  };

  return (
    <div className={`border rounded-xl p-4 ${data ? verdictStyle[data.verdict] || verdictStyle.UNCERTAIN : 'bg-[#F4F4F5] border-[#E4E4E7]'}`}>
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp size={15} className="shrink-0" />
        <span className="text-[13px] font-semibold">Price Predictor</span>
        {loading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ml-auto" />}
      </div>
      {data && (
        <>
          <p className="text-[22px] font-bold mt-1">{data.verdict?.replace('_', ' ')}</p>
          <p className="text-[12px] mt-1 leading-relaxed opacity-80">{data.reasoning}</p>
          {data.waitDays > 0 && <p className="text-[11px] font-semibold mt-1">Wait ~{data.waitDays} days · Est. drop {data.predictedDropPercent?.toFixed(1)}%</p>}
        </>
      )}
      {!data && !loading && <p className="text-[12px] text-[#A1A1AA]">Prediction unavailable</p>}
    </div>
  );
}

// ── Main Results Content ──────────────────────────────────────────────────────
function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user] = useAuthState(auth);

  const query = searchParams.get('query') || searchParams.get('q') || 'Wireless Earbuds';
  const region = searchParams.get('region') || 'GLOBAL';

  const [results, setResults] = useState([]);
  const [resolvedIds, setResolvedIds] = useState(new Set());
  const [streamDone, setStreamDone] = useState(false);
  const [sellerMode, setSellerMode] = useState(false);
  const [emailRow, setEmailRow] = useState(null);
  const [watchlistSaving, setWatchlistSaving] = useState(null);
  const [sellingPrice, setSellingPrice] = useState('');
  const abortRef = useRef(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setResults([]);
    setResolvedIds(new Set());
    setStreamDone(false);

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, region }),
          signal: controller.signal,
        });
        if (!res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === 'source_resolved') {
                const row = event.data;
                setResults((prev) => {
                  const exists = prev.find((r) => r.source === row.source);
                  if (exists) return prev;
                  return [...prev, row];
                });
                setResolvedIds((prev) => {
                  const key = Object.entries(SOURCE_LABELS).find(([l]) => l === row.source)?.[1] || row.source.toLowerCase();
                  return new Set([...prev, key]);
                });
              } else if (event.type === 'complete') {
                setStreamDone(true);
              }
            } catch {}
          }
        }
        setStreamDone(true);
      } catch (e) {
        if (e.name !== 'AbortError') setStreamDone(true);
      }
    })();

    return () => { abortRef.current?.abort(); };
  }, [query, region]);

  // Save to Firestore once stream is done
  useEffect(() => {
    if (!streamDone || !results.length || !user?.email) return;
    savePriceHistoryBatch(query, results).catch(() => {});
  }, [streamDone]);

  // Persist last results + query to localStorage for Unit Economics / Price History / AI Insights
  useEffect(() => {
    if (!streamDone || !results.length) return;
    try {
      localStorage.setItem('dealradar_last_results', JSON.stringify(results));
      // Keep recent_searches as a deduplicated array (same format as SearchPage)
      const LS_KEY = 'dealradar_recent_searches';
      const prev = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      const updated = [query, ...prev.filter((r) => r !== query)].slice(0, 6);
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
    } catch {}
  }, [streamDone]);

  const allPricesUSD = results.filter((r) => r.price).map((r) => toUSD(r.price, getCurrency(r)));
  const cheapest = results.filter((r) => r.price).sort((a, b) => toUSD(a.price, getCurrency(a)) - toUSD(b.price, getCurrency(b)))[0];
  const bestPrice = cheapest ? toUSD(cheapest.price, getCurrency(cheapest)) : null;
  const avgPrice = allPricesUSD.length ? allPricesUSD.reduce((a, b) => a + b) / allPricesUSD.length : 0;
  const savings = bestPrice && avgPrice ? (((avgPrice - bestPrice) / avgPrice) * 100).toFixed(1) : null;

  const sp = parseFloat(sellingPrice) || 0;

  const handleSaveEmail = async (supplierName, emailBody) => {
    if (!user?.email) return;
    await saveEmailRecord(user.email, query, supplierName, emailBody).catch(() => {});
  };

  const handleAddToWatchlist = async (row) => {
    if (!user?.email || !row.price) return;
    setWatchlistSaving(row.source);
    try {
      await firestoreAddToWatchlist(user.email, query, query, row.price * 0.95, row.price, row.source);
    } catch {}
    setWatchlistSaving(null);
  };

  const SOURCES_FOR_BAR = SOURCES_META.map((id) => {
    const label = Object.entries(SOURCE_LABELS).find(([, v]) => v === id)?.[0] || id;
    return { id, label: label.toUpperCase() };
  });

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="flex items-center gap-4 mb-5 flex-wrap"
      >
        <button onClick={() => router.push('/dashboard/search')} className="p-1.5 hover:bg-[#F4F4F5] rounded-lg transition-colors">
          <ArrowLeft size={18} className="text-[#71717A]" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#16A34A]" />
          </span>
          <h1 className="text-[22px] font-bold text-[#09090B] truncate">
            {query}
          </h1>
          <span className="text-[12px] text-[#A1A1AA]">· {results.length}/7 sources</span>
        </div>
        {/* Seller mode toggle */}
        <button
          onClick={() => setSellerMode(!sellerMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
            sellerMode ? 'bg-[#09090B] text-white border-[#09090B]' : 'bg-white text-[#71717A] border-[#E4E4E7] hover:border-[#09090B]'
          }`}
        >
          {sellerMode ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          Seller Mode
        </button>
        <button
          onClick={() => router.push('/dashboard/search')}
          className="flex items-center gap-2 text-[13px] text-[#71717A] border border-[#E4E4E7] px-4 py-2 rounded-xl hover:bg-[#F4F4F5] transition-colors"
        >
          <Search size={14} /> New Search
        </button>
      </motion.div>

      {/* Seller mode price input */}
      <AnimatePresence>
        {sellerMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-4 bg-[#FFFBEB] border border-[#FCD34D] rounded-xl px-4 py-3 flex items-center gap-4"
          >
            <span className="text-[13px] font-semibold text-[#D97706]">Seller Mode — Enter your selling price:</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] font-mono text-[14px]">$</span>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0.00"
                className="h-9 pl-7 pr-3 w-32 font-mono text-[14px] bg-white border border-[#E4E4E7] rounded-lg outline-none focus:border-[#D97706]"
              />
            </div>
            <span className="text-[12px] text-[#A1A1AA]">Overlays margin % on each supplier row</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'BEST PRICE', value: bestPrice ? `$${bestPrice.toFixed(2)}` : '—', sub: savings ? `↓ ${savings}% vs avg` : 'Scanning...', subColor: 'text-[#16A34A]' },
          { label: 'AVG PRICE', value: avgPrice ? `$${avgPrice.toFixed(2)}` : '—', sub: `${results.length} sources · USD normalized`, subColor: 'text-[#71717A]' },
          { label: 'SOURCES', value: `${results.length}/7`, sub: streamDone ? 'Complete' : 'Live fetch...', subColor: streamDone ? 'text-[#16A34A]' : 'text-[#D97706]' },
          { label: 'BEST SOURCE', value: cheapest?.source?.split(' ')[0] || '—', sub: cheapest?.stock || 'Scanning...', subColor: 'text-[#71717A]' },
        ].map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E4E4E7] rounded-xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
          >
            <p className="text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-wider mb-1">{card.label}</p>
            <p className="font-mono text-[24px] font-bold text-[#09090B] leading-none mb-1">{card.value}</p>
            <p className={`text-[12px] font-medium ${card.subColor}`}>{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Source loading bar */}
      <div className="bg-white border border-[#E4E4E7] rounded-xl p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-[#09090B] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] inline-block animate-pulse" />
            {streamDone ? 'ALL SOURCES SYNCED' : 'RESOLVING DATA SOURCES...'}
          </span>
          <span className="text-[12px] font-medium text-[#A1A1AA]">{results.length}/{SOURCES_META.length} SOURCES</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SOURCES_FOR_BAR.map((src) => {
            const isResolved = resolvedIds.has(src.id);
            return (
              <motion.div
                key={src.id}
                layout
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors duration-300 ${
                  isResolved ? 'bg-[#F0FDF4] border-[#16A34A] text-[#16A34A]' : 'bg-[#F4F4F5] border-[#E4E4E7] text-[#A1A1AA]'
                }`}
              >
                {isResolved ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : (
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                {src.label}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Arbitrage banner (appears after all sources done) */}
      <AnimatePresence>
        {streamDone && results.length >= 3 && (
          <ArbitrageBanner results={results} query={query} />
        )}
      </AnimatePresence>

      {/* Main layout: table + AI sidebar */}
      <div className="flex gap-5 items-start">
        {/* Supplier table */}
        <div className="flex-1 min-w-0 bg-white border border-[#E4E4E7] rounded-[14px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4E4E7]">
            <h2 className="text-[15px] font-semibold text-[#09090B]">
              {sellerMode ? 'Unit Economics View' : 'Real-time Supplier Comparison'}
            </h2>
            {sellerMode && sp > 0 && (
              <span className="text-[12px] text-[#D97706] font-medium">Sell @ ${sp.toFixed(2)}</span>
            )}
          </div>

          {/* Column headers */}
          <div className={`grid px-5 py-2.5 bg-[#F4F4F5] border-b border-[#E4E4E7] text-[11px] font-semibold text-[#71717A] uppercase tracking-wider ${
            sellerMode ? 'grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr]' : 'grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1.5fr]'
          }`}>
            <span>SOURCE</span>
            <span>PRICE</span>
            {sellerMode ? (
              <>
                <span>MARGIN %</span>
                <span>PROFIT/UNIT</span>
              </>
            ) : (
              <>
                <span>STOCK</span>
                <span>ETA</span>
              </>
            )}
            <span>AI SCORE</span>
            <span>ACTION</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#E4E4E7]/50">
            <AnimatePresence>
              {results.length === 0 && !streamDone && (
                <div className="px-5 py-12 text-center text-[#A1A1AA] text-[13px]">
                  <div className="w-6 h-6 border-2 border-[#E4E4E7] border-t-[#16A34A] rounded-full animate-spin mx-auto mb-3" />
                  Connecting to suppliers...
                </div>
              )}
              {results.map((row, i) => {
                const isBest = row.source === cheapest?.source;
                const margin = sp > 0 && row.price ? ((sp - row.price) / sp) * 100 : null;
                const profitPerUnit = sp > 0 && row.price ? sp - row.price : null;
                return (
                  <motion.div
                    key={row.source}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3, ease: 'easeOut' }}
                    className={`grid items-center px-5 py-3.5 transition-colors ${
                      sellerMode ? 'grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr]' : 'grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1.5fr]'
                    } ${isBest ? 'bg-[#F0FDF4] border-l-[3px] border-l-[#16A34A]' : 'hover:bg-[#FAFAFA]'}`}
                  >
                    {/* Source */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[14px] font-medium text-[#09090B] truncate">{row.source}</span>
                      {isBest && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#16A34A] text-white shrink-0">BEST</span>}
                    </div>

                    {/* Price */}
                    <div className="flex flex-col">
                      {(() => {
                        const { primary, secondary } = dualPrice(row.price, getCurrency(row));
                        return (
                          <>
                            <span className="font-mono text-[14px] font-semibold text-[#09090B]">{primary}</span>
                            {secondary && <span className="font-mono text-[11px] text-[#A1A1AA]">{secondary}</span>}
                          </>
                        );
                      })()}
                    </div>

                    {sellerMode ? (
                      <>
                        <span className={`font-mono text-[13px] font-semibold ${margin !== null ? (margin > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]') : 'text-[#A1A1AA]'}`}>
                          {margin !== null ? `${margin.toFixed(1)}%` : '—'}
                        </span>
                        <span className={`font-mono text-[13px] font-semibold ${profitPerUnit !== null ? (profitPerUnit > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]') : 'text-[#A1A1AA]'}`}>
                          {profitPerUnit !== null ? `$${profitPerUnit.toFixed(2)}` : '—'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full w-fit ${stockColor(row.stock)}`}>
                          {row.stock || '—'}
                        </span>
                        <span className="text-[12px] text-[#71717A]">{row.eta || '—'}</span>
                      </>
                    )}

                    {/* AI Score */}
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full w-fit ${scoreColor(row.aiScore || 0)}`}>
                      {row.aiScore || 0}/100
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <a
                        href={row.url || '#'}
                        target="_blank" rel="noopener noreferrer"
                        className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                          isBest ? 'bg-[#09090B] text-white hover:bg-[#16A34A]' : 'border border-[#E4E4E7] text-[#09090B] hover:bg-[#F4F4F5]'
                        }`}
                      >
                        View
                      </a>
                      <button
                        onClick={() => setEmailRow(row)}
                        title="Generate negotiation email"
                        className="p-1.5 border border-[#E4E4E7] rounded-lg hover:bg-[#EFF6FF] hover:border-[#2563EB] transition-colors"
                      >
                        <Mail size={13} className="text-[#71717A]" />
                      </button>
                      <button
                        onClick={() => handleAddToWatchlist(row)}
                        disabled={watchlistSaving === row.source}
                        title="Add to Watchlist"
                        className="p-1.5 border border-[#E4E4E7] rounded-lg hover:bg-[#F0FDF4] hover:border-[#16A34A] transition-colors disabled:opacity-50"
                      >
                        <Bell size={13} className="text-[#71717A]" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right AI sidebar — shows after ≥3 sources */}
        <AnimatePresence>
          {results.length >= 3 && (
            <motion.div
              key="ai-sidebar"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="w-[300px] shrink-0 space-y-4"
            >
              <PricePredictor query={query} />

              <div className="bg-white border border-[#E4E4E7] rounded-xl p-4">
                <h3 className="text-[13px] font-semibold text-[#09090B] mb-3 flex items-center gap-2">
                  <Mail size={14} /> Quick Email Generator
                </h3>
                <p className="text-[12px] text-[#71717A] mb-3">
                  Click <Mail size={11} className="inline" /> on any supplier row to generate a negotiation email using the cheapest competing price.
                </p>
                {cheapest && (
                  <div className="p-2.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg">
                    <p className="text-[11px] text-[#16A34A] font-semibold">Best price to cite:</p>
                    <p className="text-[13px] font-bold text-[#16A34A]">
                      {dualPrice(cheapest.price, getCurrency(cheapest)).primary}
                      {dualPrice(cheapest.price, getCurrency(cheapest)).secondary && (
                        <span className="text-[11px] font-normal ml-1 opacity-70">{dualPrice(cheapest.price, getCurrency(cheapest)).secondary}</span>
                      )}
                      {' '}@ {cheapest.source}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white border border-[#E4E4E7] rounded-xl p-4">
                <h3 className="text-[13px] font-semibold text-[#09090B] mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push('/dashboard/watchlist')}
                    className="w-full flex items-center gap-2 text-[13px] border border-[#E4E4E7] px-3 py-2 rounded-lg hover:bg-[#F4F4F5] transition-colors"
                  >
                    <Bell size={13} /> View Watchlist
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/unit-economics')}
                    className="w-full flex items-center gap-2 text-[13px] border border-[#E4E4E7] px-3 py-2 rounded-lg hover:bg-[#F4F4F5] transition-colors"
                  >
                    <Zap size={13} /> Unit Economics
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Email modal */}
      <AnimatePresence>
        {emailRow && (
          <EmailModal
            row={emailRow}
            query={query}
            cheapest={cheapest}
            onClose={() => setEmailRow(null)}
            onSave={handleSaveEmail}
          />
        )}
      </AnimatePresence>

      <div className="h-10" />
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#09090B] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
