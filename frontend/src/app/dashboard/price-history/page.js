'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { Search } from 'lucide-react';
import { API_BASE } from '@/lib/config';

export const dynamic = 'force-dynamic';

const USD_TO_INR = 83.5;

const RANGES = ['7D', '30D', '90D'];

// Palette cycles through these for dynamically discovered sources
const COLOR_PALETTE = [
  '#16A34A', '#D97706', '#2563EB', '#DC2626',
  '#9333EA', '#0891B2', '#EA580C', '#4F46E5',
];

const LS_KEY = 'dealradar_recent_searches';

function getRecentSearches() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term) {
  try {
    const existing = getRecentSearches().filter((s) => s !== term);
    const updated = [term, ...existing].slice(0, 10);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  } catch {}
}

/** Returns true if the source is an international (USD) store. */
function isUsdSource(source) {
  const lower = (source || '').toLowerCase();
  return (
    lower.includes('amazon') ||
    lower.includes('walmart') ||
    lower.includes('newegg') ||
    lower.includes('ebay') ||
    lower.includes('bestbuy') ||
    lower.includes('target') ||
    lower.includes('costco')
  );
}

/** Convert a price to INR. USD sources are multiplied by USD_TO_INR; INR sources are kept as-is. */
function toInr(price, source) {
  return isUsdSource(source) ? Math.round(Number(price) * USD_TO_INR) : Math.round(Number(price));
}

/**
 * Convert raw history rows to Recharts-friendly data points.
 * Each point: { date: string, [source]: price_in_INR, ... }
 * Grouped by a date bucket determined by `range`.
 */
function buildChartData(rows, range) {
  if (!rows.length) return { chartData: [], sources: [] };

  const sources = [...new Set(rows.map((r) => r.source))];

  // Determine how far back to include
  const now = Date.now();
  const msPerDay = 86_400_000;
  const cutoffMs = {
    '7D':  now - 7  * msPerDay,
    '30D': now - 30 * msPerDay,
    '90D': now - 90 * msPerDay,
  }[range] ?? 0;

  const filtered = rows.filter((r) => new Date(r.timestamp).getTime() >= cutoffMs);

  // Group by date string (YYYY-MM-DD) then by source → keep latest price in that bucket
  const buckets = {}; // { dateStr: { source: price_in_INR } }
  for (const row of filtered) {
    const d = new Date(row.timestamp);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!buckets[dateStr]) buckets[dateStr] = { _ts: d.getTime() };
    // keep the latest entry for a given source in this bucket
    if (!buckets[dateStr][row.source] || d.getTime() > buckets[dateStr]._ts) {
      buckets[dateStr][row.source] = toInr(row.price, row.source);
    }
  }

  // Sort buckets chronologically
  const chartData = Object.entries(buckets)
    .sort((a, b) => a[1]._ts - b[1]._ts)
    .map(([date, vals]) => {
      const point = { date };
      for (const src of sources) {
        if (vals[src] !== undefined) point[src] = vals[src];
      }
      return point;
    });

  return { chartData, sources };
}

/** Build table rows sorted by timestamp desc */
function buildTableRows(rows) {
  return [...rows].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export default function PriceHistoryPage() {
  const [inputValue, setInputValue]   = useState('');
  const [product, setProduct]         = useState('');
  const [range, setRange]             = useState('30D');
  const [rawRows, setRawRows]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  // Load recent searches from localStorage on mount and optionally auto-search
  useEffect(() => {
    const recents = getRecentSearches();
    setRecentSearches(recents);
    if (recents.length > 0) {
      const first = recents[0];
      setInputValue(first);
      setProduct(first);
    }
  }, []);

  // Fetch when `product` changes (including the auto-search on mount)
  const doFetch = useCallback(async (term) => {
    if (!term.trim()) return;
    setLoading(true);
    setError(null);
    setRawRows([]);
    try {
      const url = `${API_BASE}/api/history?product=${encodeURIComponent(term.trim())}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      setRawRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message ?? 'Failed to fetch price history.');
      setRawRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (product) doFetch(product);
  }, [product, doFetch]);

  const handleSearch = () => {
    const term = inputValue.trim();
    if (!term) return;
    saveRecentSearch(term);
    setRecentSearches(getRecentSearches());
    setProduct(term);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') setShowSuggestions(false);
  };

  const handleSuggestionClick = (term) => {
    setInputValue(term);
    saveRecentSearch(term);
    setRecentSearches(getRecentSearches());
    setProduct(term);
    setShowSuggestions(false);
  };

  const { chartData, sources } = buildChartData(rawRows, range);
  const tableRows = buildTableRows(rawRows);

  // Map each source to a stable color from the palette
  const lineColors = Object.fromEntries(
    sources.map((src, i) => [src, COLOR_PALETTE[i % COLOR_PALETTE.length]])
  );

  const isEmpty = !loading && !error && rawRows.length === 0;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-[28px] font-bold text-[#09090B]">Price History</h1>
        <p className="text-[14px] text-[#71717A] mt-0.5">Track price trends across all sources</p>
      </motion.div>

      {/* Product search bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex gap-3"
      >
        <div className="flex-1 relative max-w-[480px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder="Search a tracked product..."
            className="w-full h-10 pl-9 pr-4 text-[14px] bg-white border border-[#E4E4E7] rounded-lg outline-none focus:border-[#16A34A] focus:ring-[3px] focus:ring-[rgba(22,163,74,0.15)] transition-all"
          />

          {/* Recent searches dropdown */}
          {showSuggestions && recentSearches.length > 0 && (
            <div className="absolute z-20 top-full mt-1 w-full bg-white border border-[#E4E4E7] rounded-lg shadow-md overflow-hidden">
              <p className="px-3 py-1.5 text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider bg-[#F4F4F5]">
                Recent Searches
              </p>
              {recentSearches
                .filter((s) => !inputValue || s.toLowerCase().includes(inputValue.toLowerCase()))
                .slice(0, 6)
                .map((s) => (
                  <button
                    key={s}
                    onMouseDown={() => handleSuggestionClick(s)}
                    className="w-full text-left px-3 py-2 text-[13px] text-[#09090B] hover:bg-[#F4F4F5] transition-colors flex items-center gap-2"
                  >
                    <Search size={12} className="text-[#A1A1AA] shrink-0" />
                    {s}
                  </button>
                ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="h-10 px-5 bg-[#09090B] text-white text-[13px] font-semibold rounded-lg hover:bg-[#16A34A] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </motion.div>

      {/* Chart card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="bg-white border border-[#E4E4E7] rounded-[14px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
      >
        {/* Title + date range tabs */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-semibold text-[#09090B]">
            {product || 'Select a product'}
          </h2>
          <div className="flex bg-[#F4F4F5] rounded-lg p-0.5 gap-0.5">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-1.5 text-[12px] font-semibold rounded-md transition-colors ${
                  range === r
                    ? 'bg-white text-[#09090B] shadow-sm'
                    : 'text-[#71717A] hover:text-[#09090B]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="flex items-center justify-center h-[280px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#16A34A] border-t-transparent rounded-full animate-spin" />
              <span className="text-[13px] text-[#71717A]">Loading price history…</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex items-center justify-center h-[280px]">
            <div className="text-center">
              <p className="text-[14px] font-medium text-[#DC2626]">Failed to load data</p>
              <p className="text-[13px] text-[#71717A] mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && isEmpty && (
          <div className="flex items-center justify-center h-[280px]">
            <div className="text-center">
              <p className="text-[15px] font-medium text-[#09090B]">No price history yet for this product</p>
              <p className="text-[13px] text-[#71717A] mt-1">Search it first on the Results page.</p>
            </div>
          </div>
        )}

        {/* Chart */}
        {!loading && !error && !isEmpty && (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
              <XAxis dataKey="date" stroke="#A1A1AA" tick={{ fontSize: 11 }} />
              <YAxis stroke="#A1A1AA" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #E4E4E7', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, undefined]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {sources.map((src) => (
                <Line
                  key={src}
                  type="monotone"
                  dataKey={src}
                  stroke={lineColors[src]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: lineColors[src] }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Data table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <div className="bg-white border border-[#E4E4E7] rounded-[14px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr] px-6 py-3 bg-[#F4F4F5] border-b border-[#E4E4E7]">
            {['DATE', 'SOURCE', 'PRICE', 'STOCK STATUS'].map((c) => (
              <span key={c} className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider">{c}</span>
            ))}
          </div>

          {/* Table loading */}
          {loading && (
            <div className="px-6 py-8 text-center text-[13px] text-[#A1A1AA]">Loading…</div>
          )}

          {/* Table empty / error */}
          {!loading && (error || isEmpty) && (
            <div className="px-6 py-10 text-center">
              <p className="text-[14px] text-[#71717A]">
                {error ? 'Could not load price history.' : 'No price history yet for this product. Search it first on the Results page.'}
              </p>
            </div>
          )}

          {/* Table rows */}
          {!loading && !error && !isEmpty && (
            <div className="divide-y divide-[#E4E4E7]/50">
              {tableRows.map((row, i) => {
                const dateStr = new Date(row.timestamp).toLocaleString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                });
                const stockLabel = row.stock ?? 'Unknown';
                const isLow = /low/i.test(stockLabel) || /out/i.test(stockLabel);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.03, duration: 0.3 }}
                    className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr] items-center px-6 py-3.5 hover:bg-[#FAFAFA] transition-colors"
                  >
                    <span className="text-[13px] text-[#71717A]">{dateStr}</span>
                    <span className="text-[13px] font-medium text-[#09090B]">{row.source}</span>
                    <span className="font-mono text-[13px] font-semibold text-[#09090B]">
                      ₹{toInr(row.price, row.source).toLocaleString('en-IN')}
                    </span>
                    <span className={`text-[12px] font-medium px-2 py-0.5 rounded-full w-fit ${
                      isLow ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#F4F4F5] text-[#71717A]'
                    }`}>
                      {stockLabel}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
