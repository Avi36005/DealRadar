'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Zap,
  Clock,
  AlertTriangle,
  ShoppingCart,
  Activity,
  Search,
  Loader2,
  X,
} from 'lucide-react';
import { API_BASE } from '@/lib/config';

export const dynamic = 'force-dynamic';

// ── Constants ──────────────────────────────────────────────────────────────────

const RISK_CONFIG = {
  CRITICAL: {
    label: 'CRITICAL',
    color: '#DC2626',
    bg: 'bg-[#FEF2F2]',
    text: 'text-[#DC2626]',
    border: 'border-[#FECACA]',
    pulse: true,
  },
  HIGH: {
    label: 'HIGH',
    color: '#D97706',
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#D97706]',
    border: 'border-[#FDE68A]',
    pulse: false,
  },
  MEDIUM: {
    label: 'MEDIUM',
    color: '#2563EB',
    bg: 'bg-[#EFF6FF]',
    text: 'text-[#2563EB]',
    border: 'border-[#BFDBFE]',
    pulse: false,
  },
  LOW: {
    label: 'LOW',
    color: '#71717A',
    bg: 'bg-[#F4F4F5]',
    text: 'text-[#71717A]',
    border: 'border-[#E4E4E7]',
    pulse: false,
  },
};

const REC_CONFIG = {
  BUY_NOW:  { label: 'BUY NOW',  bg: 'bg-[#09090B]', text: 'text-white',       icon: ShoppingCart },
  BUY_SOON: { label: 'BUY SOON', bg: 'bg-[#16A34A]', text: 'text-white',       icon: TrendingUp   },
  MONITOR:  { label: 'MONITOR',  bg: 'bg-[#F4F4F5]', text: 'text-[#71717A]',   icon: Activity     },
  WAIT:     { label: 'WAIT',     bg: 'bg-[#FFFBEB]', text: 'text-[#D97706]',   icon: Clock        },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function spikeColor(pct) {
  if (pct === null || pct === undefined) return 'text-[#71717A]';
  if (pct > 25) return 'text-[#DC2626]';
  if (pct >= 10) return 'text-[#D97706]';
  return 'text-[#16A34A]';
}

function windowDotClass(hrs) {
  if (hrs === null || hrs === undefined) return 'bg-[#71717A]';
  if (hrs < 6) return 'bg-[#DC2626] animate-pulse';
  if (hrs < 24) return 'bg-[#D97706]';
  return 'bg-[#16A34A]';
}

// ── TrendScore Gauge ───────────────────────────────────────────────────────────

function TrendGauge({ score, color }) {
  const radius = 36;
  const stroke = 7;
  const norm = radius - stroke / 2;
  const circ = 2 * Math.PI * norm;
  // Only arc the top 75% (270 deg) so it looks like a gauge, not full circle
  const arcLen = circ * 0.75;
  const dash = (score / 100) * arcLen;
  const gap = circ - dash;
  // Rotate so arc starts at bottom-left (225 deg)
  const rotation = 135;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 88, height: 88 }}>
      <svg width={88} height={88} viewBox="0 0 88 88" style={{ transform: 'rotate(0deg)' }}>
        {/* Track */}
        <circle
          cx={44}
          cy={44}
          r={norm}
          fill="none"
          stroke="#E4E4E7"
          strokeWidth={stroke}
          strokeDasharray={`${arcLen} ${circ - arcLen}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '44px 44px' }}
        />
        {/* Filled arc */}
        <circle
          cx={44}
          cy={44}
          r={norm}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${gap + (circ - arcLen)}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '44px 44px', transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-bold text-[#09090B] leading-none">{score ?? '—'}</span>
        <span className="text-[9px] font-semibold text-[#A1A1AA] uppercase tracking-wider mt-0.5">Score</span>
      </div>
    </div>
  );
}

// ── Skeleton Card ──────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white border border-[#E4E4E7] rounded-[14px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-4 bg-[#E4E4E7] rounded w-3/4 mb-2" />
          <div className="h-3 bg-[#F4F4F5] rounded w-1/3" />
        </div>
        <div className="w-16 h-5 bg-[#F4F4F5] rounded-full" />
      </div>
      <div className="flex items-center gap-6 mb-4">
        <div className="w-[88px] h-[88px] rounded-full bg-[#F4F4F5]" />
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-[#F4F4F5] rounded w-2/3" />
          <div className="h-4 bg-[#F4F4F5] rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-1.5 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-3 bg-[#F4F4F5] rounded" style={{ width: `${85 - i * 10}%` }} />
        ))}
      </div>
      <div className="h-9 bg-[#F4F4F5] rounded-lg w-full" />
    </div>
  );
}

// ── Product Card ───────────────────────────────────────────────────────────────

function ProductCard({ data, index }) {
  const risk = RISK_CONFIG[data.riskLevel] ?? RISK_CONFIG.LOW;
  const rec = REC_CONFIG[data.recommendation] ?? REC_CONFIG.MONITOR;
  const RecIcon = rec.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: 'easeOut' }}
      className="bg-white border border-[#E4E4E7] rounded-[14px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-5 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-semibold text-[#09090B] truncate leading-snug">
            {data.productName}
          </h3>
        </div>
        {/* Risk badge */}
        <span
          className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${risk.bg} ${risk.text} ${risk.border}`}
        >
          {risk.pulse && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse inline-block" />
          )}
          {risk.label}
        </span>
      </div>

      {/* Gauge + numbers */}
      <div className="flex items-center gap-5">
        <TrendGauge score={data.trendScore} color={risk.color} />
        <div className="flex flex-col gap-2 flex-1">
          {/* Spike percent */}
          <div>
            <span
              className={`text-[26px] font-extrabold leading-none ${spikeColor(data.predictedSpikePercent)}`}
            >
              +{data.predictedSpikePercent ?? '?'}%
            </span>
            <span className="text-[11px] text-[#A1A1AA] font-medium ml-1.5 align-middle">
              predicted spike
            </span>
          </div>
          {/* Buy window */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${windowDotClass(data.buyWindowHours)}`} />
            <Clock size={12} className="text-[#A1A1AA]" />
            <span className="text-[13px] font-semibold text-[#09090B]">
              {data.buyWindowHours != null ? `${data.buyWindowHours}h` : '—'}
            </span>
            <span className="text-[12px] text-[#A1A1AA]">buy window</span>
          </div>
        </div>
      </div>

      {/* Signals */}
      {Array.isArray(data.signals) && data.signals.length > 0 && (
        <ul className="space-y-1">
          {data.signals.slice(0, 4).map((sig, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[12px] text-[#71717A] leading-snug">
              <Zap size={10} className="shrink-0 mt-0.5" style={{ color: risk.color }} />
              <span>{sig}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Recommendation button */}
      <button
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-bold transition-opacity hover:opacity-90 ${rec.bg} ${rec.text}`}
      >
        <RecIcon size={14} />
        {rec.label}
      </button>

      {/* Reasoning */}
      {data.reasoning && (
        <p className="text-[11px] text-[#A1A1AA] leading-relaxed border-t border-[#F4F4F5] pt-3">
          {data.reasoning}
        </p>
      )}
    </motion.div>
  );
}

// ── Alert Banner ───────────────────────────────────────────────────────────────

function AlertBanner({ items }) {
  const [visible, setVisible] = useState(true);
  if (!visible || items.length === 0) return null;

  const top = items[0];
  const isRed = top.riskLevel === 'CRITICAL';

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
      className={`relative flex items-center gap-3 px-5 py-3.5 rounded-[12px] border mb-6 ${
        isRed
          ? 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
          : 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]'
      }`}
    >
      <AlertTriangle size={18} className="shrink-0 animate-pulse" />
      <p className="text-[13px] font-semibold flex-1">
        ⚡ SPIKE ALERT:{' '}
        <span className="font-bold">{top.productName}</span>
        {' '}— Buy in{' '}
        <span className="font-bold">{top.buyWindowHours}h</span>
        {' '}before{' '}
        <span className="font-bold">+{top.predictedSpikePercent}%</span>
        {' '}price increase
      </p>
      <button
        onClick={() => setVisible(false)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function TrendRadarPage() {
  const [cards, setCards] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(new Set());
  const [autoLoading, setAutoLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // ── Auto-analyze from recent searches ──────────────────────────────────────

  useEffect(() => {
    let recentSearches = [];
    try {
      const raw = localStorage.getItem('dealradar_recent_searches');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) recentSearches = parsed.slice(0, 3);
      }
    } catch {}

    if (recentSearches.length === 0) {
      setAutoLoading(false);
      return;
    }

    const keys = new Set(recentSearches);
    setLoadingKeys(keys);

    const fetches = recentSearches.map((product) =>
      fetch(`${API_BASE}/api/ai/trend-shock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: product, currentPrices: [] }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => ({ ...data, productName: product, _key: product }))
        .catch(() => null)
        .finally(() => {
          setLoadingKeys((prev) => {
            const next = new Set(prev);
            next.delete(product);
            return next;
          });
        })
    );

    Promise.all(fetches).then((results) => {
      const valid = results.filter(Boolean);
      setCards(valid);
      setAutoLoading(false);
    });
  }, []);

  // ── Manual search ──────────────────────────────────────────────────────────

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    // Prevent duplicate
    if (cards.some((c) => c.productName?.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already on the radar.`);
      return;
    }

    setError('');
    setSearchLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/trend-shock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: trimmed, currentPrices: [] }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCards((prev) => [{ ...data, productName: trimmed, _key: trimmed }, ...prev]);
      setSearchQuery('');
      // Also persist to recent searches
      try {
        const raw = localStorage.getItem('dealradar_recent_searches');
        const arr = raw ? JSON.parse(raw) : [];
        const updated = [trimmed, ...arr.filter((x) => x !== trimmed)].slice(0, 10);
        localStorage.setItem('dealradar_recent_searches', JSON.stringify(updated));
      } catch {}
    } catch (err) {
      setError('Failed to analyze product. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const removeCard = (key) => {
    setCards((prev) => prev.filter((c) => c._key !== key));
  };

  // ── Alert candidates ───────────────────────────────────────────────────────

  const alertCandidates = cards.filter(
    (c) => c.riskLevel === 'CRITICAL' || c.riskLevel === 'HIGH'
  );

  // ── Skeleton count ─────────────────────────────────────────────────────────

  const skeletonCount = autoLoading ? 3 : loadingKeys.size;

  return (
    <div className="p-6 lg:p-8 max-w-[1400px]">
      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#09090B]">
            <Activity size={18} className="text-white" />
          </div>
          <h1 className="text-[28px] font-bold text-[#09090B] tracking-tight">
            Demand Shock Radar
          </h1>
          <span className="text-[11px] font-bold text-white bg-[#DC2626] px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
            LIVE
          </span>
        </div>
        <p className="text-[14px] text-[#71717A] ml-12">
          Detect demand spikes{' '}
          <span className="font-semibold text-[#09090B]">before</span>
          {' '}they hit prices — act in the buy window to lock in current rates.
        </p>
      </motion.div>

      {/* ── Alert banner ── */}
      <AnimatePresence>
        {alertCandidates.length > 0 && (
          <AlertBanner items={alertCandidates} />
        )}
      </AnimatePresence>

      {/* ── Search bar ── */}
      <motion.form
        onSubmit={handleSearch}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex gap-3 max-w-[560px]">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A1A1AA] pointer-events-none"
            />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setError(''); }}
              placeholder="Analyze any product — e.g. iPhone 16 Pro Max"
              className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-white border border-[#E4E4E7] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#09090B]/10 focus:border-[#09090B] transition placeholder:text-[#A1A1AA] text-[#09090B]"
            />
          </div>
          <button
            type="submit"
            disabled={searchLoading || !searchQuery.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#09090B] text-white text-[13px] font-semibold rounded-xl hover:bg-[#18181B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {searchLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Zap size={14} />
            )}
            Analyze
          </button>
        </div>
        {error && (
          <p className="mt-2 text-[12px] text-[#DC2626] font-medium">{error}</p>
        )}
      </motion.form>

      {/* ── Stats bar ── */}
      {cards.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex items-center gap-6 mb-6 pb-5 border-b border-[#E4E4E7]"
        >
          <div className="flex items-center gap-2">
            <span className="text-[22px] font-extrabold text-[#09090B]">{cards.length}</span>
            <span className="text-[12px] text-[#71717A] font-medium">products tracked</span>
          </div>
          <div className="w-px h-5 bg-[#E4E4E7]" />
          <div className="flex items-center gap-2">
            <span className="text-[22px] font-extrabold text-[#DC2626]">
              {cards.filter((c) => c.riskLevel === 'CRITICAL' || c.riskLevel === 'HIGH').length}
            </span>
            <span className="text-[12px] text-[#71717A] font-medium">high-risk alerts</span>
          </div>
          <div className="w-px h-5 bg-[#E4E4E7]" />
          <div className="flex items-center gap-2">
            <span className="text-[22px] font-extrabold text-[#16A34A]">
              {cards.filter((c) => c.recommendation === 'BUY_NOW' || c.recommendation === 'BUY_SOON').length}
            </span>
            <span className="text-[12px] text-[#71717A] font-medium">buy signals</span>
          </div>
        </motion.div>
      )}

      {/* ── Grid ── */}
      {skeletonCount === 0 && cards.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#F4F4F5] flex items-center justify-center mb-4">
            <TrendingUp size={28} className="text-[#A1A1AA]" />
          </div>
          <h3 className="text-[16px] font-semibold text-[#09090B] mb-2">No products on radar yet</h3>
          <p className="text-[13px] text-[#71717A] max-w-[320px] leading-relaxed">
            Search for a product above or run a search from the dashboard — your recent searches will be automatically analyzed.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {/* Skeleton cards */}
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <SkeletonCard key={`skeleton-${i}`} />
          ))}

          {/* Real cards */}
          <AnimatePresence>
            {cards.map((card, i) => (
              <div key={card._key} className="relative group">
                <ProductCard data={card} index={i} />
                {/* Remove button */}
                <button
                  onClick={() => removeCard(card._key)}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#F4F4F5] hover:bg-[#E4E4E7] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  title="Remove from radar"
                >
                  <X size={11} className="text-[#71717A]" />
                </button>
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
