'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

// Exact 7 Wire sources per spec, with staggered resolve times for demo
const SOURCES = [
  { id: 'amazon',   label: 'AMAZON.COM',  resolveAt: 600  },
  { id: 'newegg',   label: 'NEWEGG',      resolveAt: 900  },
  { id: 'bh',       label: 'B&H VIDEO',   resolveAt: 1300 },
  { id: 'bestbuy',  label: 'BEST BUY',    resolveAt: 0    }, // stays loading
  { id: 'walmart',  label: 'WALMART',     resolveAt: 1800 },
  { id: 'costco',   label: 'COSTCO',      resolveAt: 0    }, // stays loading
  { id: 'target',   label: 'TARGET',      resolveAt: 2400 },
];

export default function SourceLoadingBar({ externalResolved = null }) {
  // externalResolved: Set of source ids resolved by real Wire calls (optional)
  const [resolved, setResolved] = useState(new Set());

  useEffect(() => {
    if (externalResolved !== null) {
      setResolved(externalResolved);
      return;
    }
    // Demo simulation: resolve sources at their staggered times
    const timers = SOURCES.filter((s) => s.resolveAt > 0).map((s) =>
      setTimeout(() => {
        setResolved((prev) => new Set([...prev, s.id]));
      }, s.resolveAt)
    );
    return () => timers.forEach(clearTimeout);
  }, [externalResolved]);

  const resolvedCount = resolved.size;
  const totalCount = SOURCES.length;

  return (
    <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 mb-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold text-[#09090B] uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] inline-block animate-pulse" />
          RESOLVING DATA SOURCES...
        </span>
        <span className="text-[12px] font-medium text-[#A1A1AA]">
          {resolvedCount}/{totalCount} SOURCES SYNCED
        </span>
      </div>

      {/* Source chips */}
      <div className="flex flex-wrap gap-2">
        {SOURCES.map((src) => {
          const isResolved = resolved.has(src.id);
          return (
            <motion.div
              key={src.id}
              layout
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className={`
                relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold
                border overflow-hidden transition-colors duration-300
                ${isResolved
                  ? 'bg-[#F0FDF4] border-[#16A34A] text-[#16A34A]'
                  : 'bg-[#F4F4F5] border-[#E4E4E7] text-[#A1A1AA]'
                }
              `}
            >
              {/* Ripple on resolve */}
              <AnimatePresence>
                {isResolved && (
                  <motion.span
                    key="ripple"
                    initial={{ scale: 0, opacity: 0.5 }}
                    animate={{ scale: 3, opacity: 0 }}
                    exit={{}}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-full bg-[#16A34A] pointer-events-none"
                    style={{ transformOrigin: 'center' }}
                  />
                )}
              </AnimatePresence>

              {/* Icon */}
              {isResolved ? (
                <Check size={11} className="shrink-0 relative z-10" />
              ) : (
                <Loader2 size={11} className="shrink-0 animate-spin relative z-10" />
              )}

              <span className="relative z-10">{src.label}</span>
              {isResolved && <span className="relative z-10">✓</span>}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
