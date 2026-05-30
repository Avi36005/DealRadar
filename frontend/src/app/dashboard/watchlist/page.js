'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, RefreshCw, X } from 'lucide-react';
import {
  getWatchlistForUser,
  addToWatchlist,
  deleteFromWatchlist,
} from '@/lib/firestore-ops';

export const dynamic = 'force-dynamic';

// Tiny sparkline SVG (demo data)
function Sparkline({ trend = 'down' }) {
  const points = trend === 'down'
    ? '0,20 10,18 20,15 30,17 40,12 50,10 60,8'
    : '0,8 10,10 20,12 30,9 40,14 50,16 60,18';
  return (
    <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
      <polyline
        points={points}
        stroke={trend === 'down' ? '#16A34A' : '#D97706'}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Demo fallback rows
const DEMO_ITEMS = [
  {
    id: 'demo-1',
    productName: 'Pro Camera Lens 85mm f/1.4',
    targetPrice: 1200,
    currentBestPrice: 1242,
    bestSource: 'Amazon US',
    trend: 'down',
    alertStatus: 'Watching',
  },
  {
    id: 'demo-2',
    productName: 'Wireless Earbuds Pro',
    targetPrice: 180,
    currentBestPrice: 185,
    bestSource: 'Walmart',
    trend: 'down',
    alertStatus: 'TARGET REACHED',
  },
  {
    id: 'demo-3',
    productName: 'MacBook Stand Aluminium',
    targetPrice: 45,
    currentBestPrice: 52,
    bestSource: 'Newegg',
    trend: 'up',
    alertStatus: 'Watching',
  },
];

export default function WatchlistPage() {
  const [user] = useAuthState(auth);
  const [items, setItems] = useState(DEMO_ITEMS);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ productName: '', targetPrice: '' });
  const [adding, setAdding] = useState(false);
  const [checkingId, setCheckingId] = useState(null);

  // Load from Firestore when user is available
  useEffect(() => {
    if (!user?.email) return;
    setLoading(true);
    getWatchlistForUser(user.email)
      .then((data) => {
        if (data.length > 0) {
          setItems(
            data.map((d) => ({
              ...d,
              trend: d.currentBestPrice <= d.targetPrice ? 'down' : 'up',
              alertStatus:
                d.currentBestPrice <= d.targetPrice ? 'TARGET REACHED' : 'Watching',
            }))
          );
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleAdd = async () => {
    if (!form.productName.trim()) return;
    setAdding(true);
    try {
      const targetPrice = parseFloat(form.targetPrice) || 0;
      if (user?.email) {
        const id = await addToWatchlist(
          user.email,
          form.productName.trim(),
          form.productName.trim(),
          targetPrice,
          0,
          ''
        );
        setItems((prev) => [
          {
            id,
            productName: form.productName.trim(),
            targetPrice,
            currentBestPrice: 0,
            bestSource: '—',
            trend: 'up',
            alertStatus: 'Watching',
          },
          ...prev,
        ]);
      } else {
        setItems((prev) => [
          {
            id: 'local-' + Date.now(),
            productName: form.productName.trim(),
            targetPrice,
            currentBestPrice: 0,
            bestSource: '—',
            trend: 'up',
            alertStatus: 'Watching',
          },
          ...prev,
        ]);
      }
      setForm({ productName: '', targetPrice: '' });
      setShowModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (!id.startsWith('demo-') && !id.startsWith('local-')) {
      try { await deleteFromWatchlist(id); } catch {}
    }
  };

  const handleCheckNow = async (item) => {
    setCheckingId(item.id);
    // Re-run search for this product
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: item.productName }),
      });
      // SSE stream — just consume it; actual update happens via cron
    } catch {}
    setTimeout(() => setCheckingId(null), 2000);
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#09090B]">Watch List</h1>
          <p className="text-[14px] text-[#71717A] mt-0.5">
            {items.length} product{items.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#09090B] text-white text-[13px] font-semibold px-4 py-2.5 rounded-lg hover:bg-[#16A34A] transition-colors"
        >
          <Plus size={16} />
          Add to Watchlist
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E4E4E7] rounded-[14px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        {/* Column headers */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px_1fr_1.5fr] px-6 py-3 bg-[#F4F4F5] border-b border-[#E4E4E7]">
          {['PRODUCT NAME', 'TARGET PRICE', 'CURRENT BEST', 'BEST SOURCE', 'TREND', 'ALERT STATUS', 'ACTIONS'].map((col) => (
            <span key={col} className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider">
              {col}
            </span>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#E4E4E7]/50">
          {items.map((item, i) => {
            const targetReached = item.alertStatus === 'TARGET REACHED';
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className={`grid grid-cols-[2fr_1fr_1fr_1fr_80px_1fr_1.5fr] items-center px-6 py-4 transition-colors ${
                  targetReached ? 'bg-[#F0FDF4]' : 'hover:bg-[#FAFAFA]'
                }`}
              >
                {/* Product name */}
                <span className="text-[14px] font-medium text-[#09090B] truncate pr-2">
                  {item.productName}
                </span>

                {/* Target price */}
                <span className="font-mono text-[14px] font-semibold text-[#09090B]">
                  {item.targetPrice > 0 ? `$${item.targetPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                </span>

                {/* Current best price */}
                <span className={`font-mono text-[14px] font-semibold ${targetReached ? 'text-[#16A34A]' : 'text-[#09090B]'}`}>
                  {item.currentBestPrice > 0 ? `$${item.currentBestPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                </span>

                {/* Best source */}
                <span className="text-[13px] text-[#71717A]">{item.bestSource || '—'}</span>

                {/* Sparkline */}
                <Sparkline trend={item.trend} />

                {/* Alert status */}
                {targetReached ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#16A34A] text-white w-fit">
                    🎯 TARGET REACHED
                  </span>
                ) : (
                  <span className="text-[12px] font-medium text-[#71717A] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A1A1AA] inline-block" />
                    Watching
                  </span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCheckNow(item)}
                    disabled={checkingId === item.id}
                    className="flex items-center gap-1.5 text-[12px] font-medium text-[#09090B] border border-[#E4E4E7] px-3 py-1.5 rounded-lg hover:bg-[#F4F4F5] disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw size={12} className={checkingId === item.id ? 'animate-spin' : ''} />
                    Check Now
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="py-16 text-center text-[#A1A1AA] text-[14px]">
            No products on your watchlist yet.
          </div>
        )}
      </div>

      {/* Add to Watchlist Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/40 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white rounded-2xl border border-[#E4E4E7] w-full max-w-md shadow-[0_8px_40px_rgba(0,0,0,0.10)]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E4E7]">
                  <h2 className="text-[16px] font-semibold text-[#09090B]">Add to Watchlist</h2>
                  <button onClick={() => setShowModal(false)} className="p-1 hover:bg-[#F4F4F5] rounded-lg transition-colors">
                    <X size={18} className="text-[#71717A]" />
                  </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#09090B] mb-1.5">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={form.productName}
                      onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                      placeholder="e.g. Wireless Earbuds Pro"
                      className="w-full h-10 px-3 text-[14px] bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg outline-none focus:border-[#16A34A] focus:ring-[3px] focus:ring-[rgba(22,163,74,0.15)] transition-all"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#09090B] mb-1.5">
                      Target Price (USD)
                    </label>
                    <input
                      type="number"
                      value={form.targetPrice}
                      onChange={(e) => setForm((f) => ({ ...f, targetPrice: e.target.value }))}
                      placeholder="e.g. 180.00"
                      className="w-full h-10 px-3 text-[14px] font-mono bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg outline-none focus:border-[#16A34A] focus:ring-[3px] focus:ring-[rgba(22,163,74,0.15)] transition-all"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 h-10 text-[14px] font-medium border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAdd}
                      disabled={!form.productName.trim() || adding}
                      className="flex-1 h-10 text-[14px] font-semibold bg-[#09090B] text-white rounded-lg hover:bg-[#16A34A] disabled:bg-[#A1A1AA] disabled:cursor-not-allowed transition-colors"
                    >
                      {adding ? 'Adding…' : 'Add to Watchlist'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
