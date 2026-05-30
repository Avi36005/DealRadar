'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { Copy, Check } from 'lucide-react';

export const dynamic = 'force-dynamic';

// ── Demo data ─────────────────────────────────────────────────────────────────

const ARBITRAGE_ROWS = [
  { id: 1, product: 'Pro Camera Lens 85mm f/1.4', sourceA: 'Amazon US', priceA: 1242.00, sourceB: 'eBay', priceB: 1599.00, spread: 22.3, action: 'Buy on Amazon' },
  { id: 2, product: 'Wireless Earbuds Pro',        sourceA: 'Walmart',   priceA: 185.00,  sourceB: 'eBay', priceB: 329.00,  spread: 43.7, action: 'Flash Buy'    },
  { id: 3, product: 'Smart Fitness Watch Pro',     sourceA: 'Flipkart',  priceA: 210.00,  sourceB: 'Amazon US', priceB: 299.00, spread: 29.7, action: 'Monitor'  },
];

// 30-day price trend for last searched product (multi-source)
const CHART_DATA = [
  { date: 'Jan 1',  amazon: 1310, walmart: 1280, flipkart: 1260, ebay: 1590 },
  { date: 'Jan 8',  amazon: 1295, walmart: 1270, flipkart: 1255, ebay: 1580 },
  { date: 'Jan 15', amazon: 1280, walmart: 1265, flipkart: 1248, ebay: 1570 },
  { date: 'Jan 22', amazon: 1265, walmart: 1258, flipkart: 1242, ebay: 1560 },
  { date: 'Jan 29', amazon: 1255, walmart: 1250, flipkart: 1240, ebay: 1555 },
  { date: 'Feb 5',  amazon: 1248, walmart: 1245, flipkart: 1242, ebay: 1599 },
  { date: 'Feb 12', amazon: 1242, walmart: 1242, flipkart: 1242, ebay: 1599 },
];

const LINE_COLORS = {
  amazon:   '#16A34A',
  walmart:  '#D97706',
  flipkart: '#2563EB',
  ebay:     '#DC2626',
};

const EMAIL_HISTORY = [
  {
    id: 1,
    supplier: 'Newegg',
    product: 'Pro Camera Lens 85mm f/1.4',
    timestamp: '2 hours ago',
    status: 'Draft',
    body: `Dear Newegg Account Manager,\n\nI am interested in placing a bulk order of 50 units of the Pro Camera Lens 85mm f/1.4. I have found the same product available at Amazon US for $1,242.00 per unit.\n\nCould you match or beat this price? I am ready to place the order immediately upon confirmation.\n\nBest regards`,
  },
  {
    id: 2,
    supplier: 'B&H Video',
    product: 'Wireless Earbuds Pro',
    timestamp: '1 day ago',
    status: 'Sent',
    body: `Dear B&H Video Team,\n\nI found Wireless Earbuds Pro at Walmart for $185.00. Can you match this price for a 100-unit order?\n\nThank you`,
  },
  {
    id: 3,
    supplier: 'Costco',
    product: 'Smart Fitness Watch Pro',
    timestamp: '3 days ago',
    status: 'Draft',
    body: `Dear Costco Procurement,\n\nRegarding Smart Fitness Watch Pro — Flipkart is offering $210.00. Can you provide a competitive quote for 200 units?\n\nBest regards`,
  },
];

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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AIInsightsPage() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-[28px] font-bold text-[#09090B]">AI Insights</h1>
        <p className="text-[14px] text-[#71717A] mt-0.5">Arbitrage opportunities, price trends, and negotiation history</p>
      </motion.div>

      {/* ── 1. Arbitrage Opportunities ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
        <h2 className="text-[16px] font-semibold text-[#09090B] mb-4">Arbitrage Opportunities</h2>
        <div className="bg-white border border-[#E4E4E7] rounded-[14px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          {/* Column headers */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-6 py-3 bg-[#F4F4F5] border-b border-[#E4E4E7]">
            {['PRODUCT', 'SOURCE A', 'PRICE A', 'SOURCE B', 'SPREAD %', 'ACTION'].map((c) => (
              <span key={c} className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider">{c}</span>
            ))}
          </div>
          {ARBITRAGE_ROWS.map((row, i) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] items-center px-6 py-4 border-b border-[#E4E4E7]/50 last:border-0 hover:bg-[#FAFAFA] transition-colors"
            >
              <span className="text-[13px] font-medium text-[#09090B] truncate pr-2">{row.product}</span>
              <span className="text-[13px] text-[#71717A]">{row.sourceA}</span>
              <span className="font-mono text-[13px] font-semibold text-[#16A34A]">${row.priceA.toFixed(2)}</span>
              <span className="text-[13px] text-[#71717A]">{row.sourceB}</span>
              <span className="font-mono text-[13px] font-bold text-[#09090B]">{row.spread}%</span>
              <button className="text-[12px] font-semibold text-white bg-[#09090B] hover:bg-[#16A34A] px-3 py-1.5 rounded-lg transition-colors w-fit">
                {row.action}
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── 2. Market Trend Analysis ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-semibold text-[#09090B]">Market Trend Analysis</h2>
          <span className="text-[11px] font-medium text-[#A1A1AA] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] inline-block animate-pulse" />
            Powered by Gemini
          </span>
        </div>
        <div className="bg-white border border-[#E4E4E7] rounded-[14px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={CHART_DATA} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
              <XAxis dataKey="date" stroke="#A1A1AA" tick={{ fontSize: 11 }} />
              <YAxis stroke="#A1A1AA" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #E4E4E7', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`$${v}`, undefined]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {Object.entries(LINE_COLORS).map(([key, color]) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: color }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ── 3. Negotiation History ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
        <h2 className="text-[16px] font-semibold text-[#09090B] mb-4">Negotiation History</h2>
        <div className="bg-white border border-[#E4E4E7] rounded-[14px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="divide-y divide-[#E4E4E7]/50">
            {EMAIL_HISTORY.map((email, i) => (
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
        </div>
      </motion.div>
    </div>
  );
}
