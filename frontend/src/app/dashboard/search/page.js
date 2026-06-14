'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

const SUGGESTED = ['USB-C Hub', 'Wireless Earbuds', 'MacBook Stand', 'Ring Light'];
const LS_KEY = 'dealradar_recent_searches';

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      setRecent(stored);
    } catch {
      setRecent([]);
    }
  }, []);

  const handleSearch = (term) => {
    const q = term.trim();
    if (!q) return;

    // Persist to localStorage (max 6, deduplicated)
    const updated = [q, ...recent.filter((r) => r !== q)].slice(0, 6);
    setRecent(updated);
    try { localStorage.setItem(LS_KEY, JSON.stringify(updated)); } catch {}

    router.push(`/dashboard/results?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[640px]"
      >
        {/* Headline */}
        <h1 className="text-[32px] font-bold text-[#09090B] text-center mb-2">
          Find the best deal
        </h1>
        <p className="text-[15px] text-[#71717A] text-center mb-8">
          Search any product — DealRadar scans 7 suppliers simultaneously
        </p>

        {/* Search bar — 56px height */}
        <div className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A1A1AA] pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              placeholder="Search any product — e.g. USB Hub, iPhone 15 case, Wireless Earbuds..."
              className="w-full h-[56px] pl-12 pr-4 text-[15px] bg-white border border-[#E4E4E7] rounded-xl outline-none focus:border-[#16A34A] focus:ring-[3px] focus:ring-[rgba(22,163,74,0.15)] transition-all placeholder:text-[#A1A1AA] shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
              autoFocus
            />
          </div>
          <button
            onClick={() => handleSearch(query)}
            disabled={!query.trim()}
            className="h-[56px] px-6 bg-[#09090B] text-white font-semibold text-[15px] rounded-xl hover:bg-[#16A34A] disabled:bg-[#A1A1AA] disabled:cursor-not-allowed transition-colors"
          >
            Search
          </button>
        </div>

        {/* Recent searches */}
        {recent.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <p className="text-[12px] font-semibold text-[#A1A1AA] uppercase tracking-wider mb-3">
              Recent searches
            </p>
            <div className="flex flex-wrap gap-2">
              {recent.map((r) => (
                <button
                  key={r}
                  onClick={() => handleSearch(r)}
                  className="px-3 py-1.5 text-[13px] font-medium bg-white border border-[#E4E4E7] rounded-full text-[#09090B] hover:border-[#16A34A] hover:text-[#16A34A] transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Suggested products */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-[12px] font-semibold text-[#A1A1AA] uppercase tracking-wider mb-3">
            Try these
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                onClick={() => handleSearch(s)}
                className="px-3 py-1.5 text-[13px] font-medium bg-[#F0FDF4] border border-[#BBF7D0] rounded-full text-[#16A34A] hover:bg-[#16A34A] hover:text-white transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
