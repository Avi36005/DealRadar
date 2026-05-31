'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Search } from 'lucide-react';

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

function calcRow(cogs, sellingPrice, qty, currency = 'USD') {
  if (!sellingPrice || sellingPrice <= 0) return null;
  const cogsUSD = toUSD(cogs, currency);
  const grossMarginPct = ((sellingPrice - cogsUSD) / sellingPrice) * 100;
  const profitPerUnit = sellingPrice - cogsUSD;
  const profitAtQty = profitPerUnit * qty;
  const breakEven = profitPerUnit > 0 ? Math.ceil(cogsUSD / profitPerUnit) : Infinity;
  const roi = cogsUSD > 0 ? (profitPerUnit / cogsUSD) * 100 : 0;
  return { grossMarginPct, profitPerUnit, profitAtQty, breakEven, roi };
}

function exportCSV(rows, sellingPrice, qty) {
  const headers = ['Source', 'COGS (native)', 'COGS (USD)', 'Selling Price (USD)', 'Gross Margin %', 'Profit/Unit (USD)', `Profit @ ${qty} units (USD)`, 'Break-even Qty', 'ROI %'];
  const lines = rows.map((r) => {
    const currency = getCurrency(r);
    const m = calcRow(r.cogs, sellingPrice, qty, currency);
    const cogsUSD = toUSD(r.cogs, currency);
    const { primary: cogsNative } = dualPrice(r.cogs, currency);
    if (!m) return [r.source, cogsNative, cogsUSD.toFixed(2), sellingPrice, '—', '—', '—', '—', '—'].join(',');
    return [
      r.source, cogsNative, cogsUSD.toFixed(2), sellingPrice.toFixed(2),
      m.grossMarginPct.toFixed(1) + '%',
      m.profitPerUnit.toFixed(2),
      m.profitAtQty.toFixed(2),
      m.breakEven === Infinity ? '∞' : m.breakEven,
      m.roi.toFixed(1) + '%',
    ].join(',');
  });
  const csv = [headers.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'unit-economics.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function UnitEconomicsPage() {
  const [sellingPrice, setSellingPrice] = useState('');
  const [qty, setQty] = useState('100');
  const [suppliers, setSuppliers] = useState([]);
  const [productName, setProductName] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('dealradar_last_results');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSuppliers(
            parsed.map((r, i) => ({
              id: i + 1,
              source: r.source,
              cogs: typeof r.price === 'number' ? r.price : parseFloat(r.price) || 0,
              stock: r.stock || 'In Stock',
              currency: getCurrency(r),
            }))
          );
        }
      }
      const rawSearches = localStorage.getItem('dealradar_recent_searches');
      if (rawSearches) {
        try {
          const parsed = JSON.parse(rawSearches);
          const first = Array.isArray(parsed) ? parsed[0] : null;
          if (first) setProductName(first);
        } catch {
          // rawSearches was a plain string (legacy), use as-is
          setProductName(rawSearches);
        }
      }
    } catch {}
  }, []);

  const sp = parseFloat(sellingPrice) || 0;
  const q = parseInt(qty) || 1;

  // Find best margin row
  const rowsWithMetrics = suppliers.map((s) => ({ ...s, metrics: calcRow(s.cogs, sp, q, getCurrency(s)) }));
  const bestMarginId = sp > 0
    ? rowsWithMetrics.reduce((best, r) =>
        r.metrics && (!best.metrics || r.metrics.grossMarginPct > best.metrics.grossMarginPct) ? r : best
      ).id
    : null;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6">
        <h1 className="text-[28px] font-bold text-[#09090B]">Unit Economics</h1>
        <p className="text-[14px] text-[#71717A] mt-0.5">
          {productName
            ? <>Results for <span className="font-semibold text-[#09090B]">{productName}</span> — enter your selling price and quantity to see margin calculations</>
            : 'Enter your selling price and quantity to see margin calculations'}
        </p>
      </motion.div>

      {/* Input row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex items-end gap-4 mb-6 flex-wrap"
      >
        <div>
          <label className="block text-[12px] font-semibold text-[#71717A] uppercase tracking-wider mb-1.5">
            Selling Price (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] font-mono text-[14px]">$</span>
            <input
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="0.00"
              className="h-10 pl-7 pr-4 w-40 font-mono text-[14px] bg-white border border-[#E4E4E7] rounded-lg outline-none focus:border-[#16A34A] focus:ring-[3px] focus:ring-[rgba(22,163,74,0.15)] transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-[#71717A] uppercase tracking-wider mb-1.5">
            Quantity
          </label>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="100"
            className="h-10 px-4 w-28 font-mono text-[14px] bg-white border border-[#E4E4E7] rounded-lg outline-none focus:border-[#16A34A] focus:ring-[3px] focus:ring-[rgba(22,163,74,0.15)] transition-all"
          />
        </div>
      </motion.div>

      {/* Supplier economics table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <div className="bg-white border border-[#E4E4E7] rounded-[14px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          {/* Column headers */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_1fr] px-6 py-3 bg-[#F4F4F5] border-b border-[#E4E4E7]">
            {['SOURCE', 'COGS', 'GROSS MARGIN %', `PROFIT @ ${q} UNITS`, 'BREAK-EVEN QTY', 'ROI %', 'STOCK'].map((c) => (
              <span key={c} className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider">{c}</span>
            ))}
          </div>

          {suppliers.length === 0 ? (
            <div className="py-16 text-center text-[#A1A1AA]">
              <Search size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-[14px]">Search a product first to see data here</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E4E4E7]/50">
              {rowsWithMetrics.map((row, i) => {
                const m = row.metrics;
                const isBest = row.id === bestMarginId;
                return (
                  <motion.div
                    key={row.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.06, duration: 0.3 }}
                    className={`grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_1fr] items-center px-6 py-4 transition-colors ${
                      isBest ? 'bg-[#F0FDF4] border-l-[3px] border-l-[#16A34A]' : 'hover:bg-[#FAFAFA]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-[#09090B]">{row.source}</span>
                      {isBest && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#16A34A] text-white">BEST</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      {(() => {
                        const currency = getCurrency(row);
                        const cogs_in_inr = currency === 'INR' ? row.cogs : row.cogs * USD_TO_INR;
                        return (
                          <span className="font-mono text-[14px] font-semibold text-[#09090B]">
                            {'₹' + Math.round(cogs_in_inr).toLocaleString('en-IN')}
                          </span>
                        );
                      })()}
                    </div>
                    <span className={`font-mono text-[14px] font-semibold ${m ? (m.grossMarginPct > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]') : 'text-[#A1A1AA]'}`}>
                      {m ? `${m.grossMarginPct.toFixed(1)}%` : '—'}
                    </span>
                    <div className="flex flex-col">
                      <span className={`font-mono text-[14px] font-semibold ${m ? (m.profitAtQty > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]') : 'text-[#A1A1AA]'}`}>
                        {m ? `₹${Math.round(m.profitAtQty * USD_TO_INR).toLocaleString('en-IN')}` : '—'}
                      </span>
                      {m && <span className="font-mono text-[11px] text-[#A1A1AA]">₹{Math.round(m.profitPerUnit * USD_TO_INR).toLocaleString('en-IN')}/unit</span>}
                    </div>
                    <span className="font-mono text-[14px] text-[#09090B]">
                      {m ? (m.breakEven === Infinity ? '∞' : m.breakEven) : '—'}
                    </span>
                    <span className={`font-mono text-[14px] font-semibold ${m ? (m.roi > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]') : 'text-[#A1A1AA]'}`}>
                      {m ? `${m.roi.toFixed(1)}%` : '—'}
                    </span>
                    <span className={`text-[12px] font-medium px-2 py-0.5 rounded-full w-fit ${
                      row.stock === 'Low Stock' ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#F4F4F5] text-[#71717A]'
                    }`}>
                      {row.stock}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Export CSV — only shown when there is real data */}
      {suppliers.length > 0 && (
        <div className="flex justify-end mt-4">
          <button
            onClick={() => exportCSV(suppliers, sp, q)}
            className="flex items-center gap-2 text-[13px] font-medium text-[#71717A] border border-[#E4E4E7] px-4 py-2 rounded-lg hover:bg-[#F4F4F5] transition-colors"
          >
            <Download size={14} />
            Export as CSV
          </button>
        </div>
      )}
    </div>
  );
}
