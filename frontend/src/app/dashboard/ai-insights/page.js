'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { Copy, Check, Loader2 } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getEmailsForUser } from '@/lib/firestore-ops';
import { API_BASE } from '@/lib/config';

export const dynamic = 'force-dynamic';

// ── Constants ──────────────────────────────────────────────────────────────────

const USD_TO_INR = 83.5;

const LINE_COLORS = {
  amazon:   '#16A34A',
  walmart:  '#D97706',
  flipkart: '#2563EB',
  ebay:     '#DC2626',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format a Firestore Timestamp or ISO string into a relative "X ago" label. */
function formatRelativeTime(createdAt) {
  if (!createdAt) return '';
  let date;
  if (typeof createdAt.toDate === 'function') {
    date = createdAt.toDate();
  } else if (typeof createdAt === 'string') {
    date = new Date(createdAt);
  } else if (createdAt.seconds) {
    date = new Date(createdAt.seconds * 1000);
  } else {
    return '';
  }
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

/**
 * Transform raw price history rows from GET /api/history into Recharts data.
 * Expected row shape: { source, price, date } (or fetchedAt).
 * Groups by date label and pivots sources into columns.
 */
function buildChartData(rows) {
  if (!rows || rows.length === 0) return null;

  // Detect known sources and normalise to lowercase keys matching LINE_COLORS
  const sourceMap = {
    amazon:   ['amazon', 'amazon us', 'amazon.com'],
    walmart:  ['walmart', 'walmart.com'],
    flipkart: ['flipkart', 'flipkart.com'],
    ebay:     ['ebay', 'ebay.com'],
  };

  const normaliseSource = (raw) => {
    const lower = (raw || '').toLowerCase();
    for (const [key, aliases] of Object.entries(sourceMap)) {
      if (aliases.some((a) => lower.includes(a))) return key;
    }
    return lower.replace(/\s+/g, '_');
  };

  // Sort by date
  const sorted = [...rows].sort((a, b) => {
    const ta = a.fetchedAt?.seconds ?? new Date(a.date ?? 0).getTime() / 1000;
    const tb = b.fetchedAt?.seconds ?? new Date(b.date ?? 0).getTime() / 1000;
    return ta - tb;
  });

  // Group by date label (week buckets for readability)
  const byDate = {};
  sorted.forEach((row) => {
    let label;
    if (row.fetchedAt?.seconds) {
      const d = new Date(row.fetchedAt.seconds * 1000);
      label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (row.date) {
      label = row.date;
    } else {
      label = 'Unknown';
    }
    if (!byDate[label]) byDate[label] = { date: label };
    const src = normaliseSource(row.source);
    // Average if multiple entries for same source+date
    if (byDate[label][src] != null) {
      byDate[label][src] = Math.round((byDate[label][src] + row.price) / 2);
    } else {
      byDate[label][src] = row.price;
    }
  });

  return Object.values(byDate);
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1.5 text-[12px] font-medium text-[#71717A] hover:text-[#09090B] transition-colors"
    >
      {copied ? <><Check size={13} className="text-[#16A34A]" /> Copied!</> : <><Copy size={13} /> Copy</>}
    </button>
  );
}

// ── Build arbitrage rows from raw supplier results ────────────────────────────
function buildArbitrageRows(results, productName) {
  const priced = results.filter((r) => r.price && r.price > 0);
  if (priced.length < 2) return null;
  priced.sort((a, b) => a.price - b.price);
  const rows = [];
  for (let i = 0; i < Math.min(3, priced.length - 1); i++) {
    const buy = priced[i];
    const sell = priced[priced.length - 1 - i] || priced[priced.length - 1];
    if (buy.source === sell.source) continue;
    const spread = (((sell.price - buy.price) / sell.price) * 100).toFixed(1);
    rows.push({
      id: i + 1,
      product: productName || 'Last Searched Product',
      sourceA: buy.source,
      priceA: buy.price,
      sourceB: sell.source,
      priceB: sell.price,
      spread: parseFloat(spread),
      action: parseFloat(spread) > 30 ? 'Flash Buy' : parseFloat(spread) > 15 ? 'Buy Now' : 'Monitor',
    });
  }
  return rows.length > 0 ? rows : null;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AIInsightsPage() {
  const [user, authLoading] = useAuthState(auth);

  // ── Arbitrage state ───────────────────────────────────────────────────────
  const [arbitrageRows, setArbitrageRows] = useState(null);  // null = no real data yet

  // ── Email / Negotiation History state ────────────────────────────────────
  const [emails, setEmails] = useState(null);          // null = not yet loaded
  const [emailsLoading, setEmailsLoading] = useState(false);

  // ── Chart / Price History state ───────────────────────────────────────────
  const [chartData, setChartData] = useState(null);    // null = no real data
  const [chartLoading, setChartLoading] = useState(false);
  const [chartProduct, setChartProduct] = useState('');
  const [chartKeys, setChartKeys] = useState([]);

  // ── Load arbitrage from last search results ───────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem('dealradar_last_results');
      const searches = JSON.parse(localStorage.getItem('dealradar_recent_searches') || '[]');
      const productName = Array.isArray(searches) ? searches[0] : null;
      if (raw) {
        const results = JSON.parse(raw);
        const rows = buildArbitrageRows(results, productName);
        if (rows) {
          setArbitrageRows(rows);
        }
      }
    } catch {}
  }, []);

  // ── Fetch email history ───────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;

    const email = (user?.email || 'guest@dealradar.app');
    setEmailsLoading(true);
    getEmailsForUser(email)
      .then((records) => {
        if (!records || records.length === 0) {
          setEmails([]);
        } else {
          // Normalise EmailRecord → display shape
          const normalised = records.map((r) => ({
            id: r.id,
            supplier: r.supplierName || 'Supplier',
            product: r.productName || '',
            timestamp: formatRelativeTime(r.createdAt),
            status: r.status || 'Draft',
            body: r.emailBody || '',
          }));
          setEmails(normalised);
        }
      })
      .catch(() => {
        setEmails([]);
      })
      .finally(() => setEmailsLoading(false));
  }, [user, authLoading]);

  // ── Fetch price history chart ─────────────────────────────────────────────
  useEffect(() => {
    const product = (() => {
      try {
        const raw = localStorage.getItem('dealradar_recent_searches');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed[0] : null;
      } catch {
        return null;
      }
    })();

    if (!product) {
      // No recent search — show empty state
      setChartData(null);
      setChartKeys([]);
      return;
    }

    setChartProduct(product);
    setChartLoading(true);

    fetch(`${API_BASE}/api/history?product=${encodeURIComponent(product)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        // Accept either { rows: [...] } or a plain array
        const rows = Array.isArray(data) ? data : (data.rows ?? data.history ?? []);
        const built = buildChartData(rows);
        if (!built || built.length === 0) {
          setChartData(null);
          setChartKeys([]);
        } else {
          // Derive the set of source keys actually present in the data
          const keys = [...new Set(built.flatMap((d) => Object.keys(d).filter((k) => k !== 'date')))];
          // Convert prices to INR
          const inrBuilt = built.map((point) => {
            const converted = { date: point.date };
            for (const k of keys) {
              if (point[k] != null) converted[k] = Math.round(point[k] * USD_TO_INR);
            }
            return converted;
          });
          setChartData(inrBuilt);
          setChartKeys(keys);
        }
      })
      .catch(() => {
        setChartData(null);
        setChartKeys([]);
      })
      .finally(() => setChartLoading(false));
  }, []);

  // ── Resolved display values ───────────────────────────────────────────────
  const displayEmails = emails ?? [];
  const displayChartData = chartData ?? [];
  const displayChartKeys = chartKeys;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-[28px] font-bold text-[#09090B]">AI Insights</h1>
        <p className="text-[14px] text-[#71717A] mt-0.5">Arbitrage opportunities, price trends, and negotiation history</p>
      </motion.div>

      {/* ── 1. Arbitrage Opportunities ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
        <div className="flex items-center gap-2.5 mb-4">
          <h2 className="text-[16px] font-semibold text-[#09090B]">Arbitrage Opportunities</h2>
        </div>
        <div className="bg-white border border-[#E4E4E7] rounded-[14px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          {!arbitrageRows || arbitrageRows.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-center">
              <div>
                <p className="text-[15px] font-medium text-[#09090B]">No arbitrage opportunities yet</p>
                <p className="text-[13px] text-[#71717A] mt-1">Search a product to see arbitrage opportunities.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-6 py-3 bg-[#F4F4F5] border-b border-[#E4E4E7]">
                {['PRODUCT', 'BUY FROM', 'BUY PRICE', 'VS SOURCE', 'SPREAD %', 'ACTION'].map((c) => (
                  <span key={c} className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider">{c}</span>
                ))}
              </div>
              {arbitrageRows.map((row, i) => (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] items-center px-6 py-4 border-b border-[#E4E4E7]/50 last:border-0 hover:bg-[#FAFAFA] transition-colors"
                >
                  <span className="text-[13px] font-medium text-[#09090B] truncate pr-2">{row.product}</span>
                  <span className="text-[13px] text-[#71717A]">{row.sourceA}</span>
                  <span className="font-mono text-[13px] font-semibold text-[#16A34A]">
                    ₹{Math.round(row.priceA * USD_TO_INR).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[13px] text-[#71717A]">{row.sourceB}</span>
                  <span className="font-mono text-[13px] font-bold text-[#09090B]">{row.spread}%</span>
                  <button className="text-[12px] font-semibold text-white bg-[#09090B] hover:bg-[#16A34A] px-3 py-1.5 rounded-lg transition-colors w-fit">
                    {row.action}
                  </button>
                </motion.div>
              ))}
            </>
          )}
        </div>
      </motion.div>

      {/* ── 2. Market Trend Analysis ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[16px] font-semibold text-[#09090B]">Market Trend Analysis</h2>
            {chartProduct && chartData && (
              <span className="text-[11px] font-medium text-[#71717A] bg-[#F4F4F5] px-2 py-0.5 rounded-full truncate max-w-[200px]">
                {chartProduct}
              </span>
            )}
            {chartLoading && (
              <Loader2 size={14} className="text-[#A1A1AA] animate-spin" />
            )}
          </div>
          <span className="text-[11px] font-medium text-[#A1A1AA] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] inline-block animate-pulse" />
            Powered by Gemini
          </span>
        </div>
        <div className="bg-white border border-[#E4E4E7] rounded-[14px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          {chartLoading ? (
            <div className="flex items-center justify-center h-[280px] gap-2 text-[13px] text-[#A1A1AA]">
              <Loader2 size={18} className="animate-spin" />
              Loading price history…
            </div>
          ) : !chartData || displayChartData.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] text-center">
              <div>
                <p className="text-[15px] font-medium text-[#09090B]">No price trends yet</p>
                <p className="text-[13px] text-[#71717A] mt-1">Search a product first to see price trends.</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={displayChartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                <XAxis dataKey="date" stroke="#A1A1AA" tick={{ fontSize: 11 }} />
                <YAxis stroke="#A1A1AA" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #E4E4E7', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, undefined]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {displayChartKeys.map((key) => {
                  const color = LINE_COLORS[key] ?? '#A1A1AA';
                  return (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={color}
                      strokeWidth={2}
                      dot={{ r: 3, fill: color }}
                      activeDot={{ r: 5 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* ── 3. Negotiation History ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
        <div className="flex items-center gap-2.5 mb-4">
          <h2 className="text-[16px] font-semibold text-[#09090B]">Negotiation History</h2>
          {(emailsLoading || authLoading) && (
            <Loader2 size={14} className="text-[#A1A1AA] animate-spin" />
          )}
        </div>
        <div className="bg-white border border-[#E4E4E7] rounded-[14px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          {(emailsLoading || authLoading) ? (
            <div className="flex items-center justify-center py-12 gap-2 text-[13px] text-[#A1A1AA]">
              <Loader2 size={18} className="animate-spin" />
              Loading negotiation history…
            </div>
          ) : displayEmails.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-center">
              <div>
                <p className="text-[15px] font-medium text-[#09090B]">No negotiation emails yet</p>
                <p className="text-[13px] text-[#71717A] mt-1">Generate one from the Results page.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#E4E4E7]/50">
              {displayEmails.map((email, i) => (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 + i * 0.06, duration: 0.3 }}
                  className="px-6 py-4 hover:bg-[#FAFAFA] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[14px] font-semibold text-[#09090B]">{email.supplier}</span>
                        <span className="text-[11px] text-[#A1A1AA]">·</span>
                        <span className="text-[13px] text-[#71717A] truncate">{email.product}</span>
                      </div>
                      <p className="text-[12px] text-[#A1A1AA]">{email.timestamp}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        email.status === 'Sent'
                          ? 'bg-[#F0FDF4] text-[#16A34A]'
                          : 'bg-[#EFF6FF] text-[#2563EB]'
                      }`}>
                        {email.status}
                      </span>
                      <CopyButton text={email.body} />
                    </div>
                  </div>
                  {/* Email preview */}
                  <pre className="mt-3 text-[12px] text-[#71717A] whitespace-pre-wrap font-sans leading-relaxed bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-4 py-3 line-clamp-3 overflow-hidden">
                    {email.body}
                  </pre>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
