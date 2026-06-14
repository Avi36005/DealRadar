'use client';

import { motion } from 'framer-motion';
import { SlidersHorizontal, Sparkles, ExternalLink } from 'lucide-react';

// Fallback demo data — always shown even if Wire calls fail
const DEMO_ROWS = [
  {
    id: 1,
    source: 'Amazon US',
    badge: 'BEST',
    price: 1242.00,
    stock: 'In Stock',
    stockColor: 'text-[#71717A] bg-[#F4F4F5]',
    eta: '2 Days',
    rating: 4.9,
    aiScore: 98,
    aiScoreColor: 'bg-[#F0FDF4] text-[#16A34A]',
    url: '#',
    best: true,
  },
  {
    id: 2,
    source: 'Newegg',
    badge: null,
    price: 1299.99,
    stock: 'In Stock',
    stockColor: 'text-[#71717A] bg-[#F4F4F5]',
    eta: '3-5 Days',
    rating: 4.7,
    aiScore: 84,
    aiScoreColor: 'bg-[#FFFBEB] text-[#D97706]',
    url: '#',
    best: false,
  },
  {
    id: 3,
    source: 'B&H Video',
    badge: null,
    price: 1310.00,
    stock: 'Low Stock',
    stockColor: 'text-[#DC2626] bg-[#FEF2F2]',
    eta: 'Next Day',
    rating: 4.9,
    aiScore: 81,
    aiScoreColor: 'bg-[#FFFBEB] text-[#D97706]',
    url: '#',
    best: false,
  },
];

function Stars({ rating }) {
  return (
    <span className="text-[13px] text-[#09090B]">
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))} {rating}
    </span>
  );
}

export default function SupplierTable({ rows = DEMO_ROWS }) {
  const displayRows = rows.length > 0 ? rows : DEMO_ROWS;

  return (
    <div className="bg-white border border-[#E4E4E7] rounded-[14px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      {/* Table header row */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E4E7]">
        <h2 className="text-[16px] font-medium text-[#09090B]">Real-time Supplier Comparison</h2>
        <button className="flex items-center gap-2 text-[13px] text-[#71717A] border border-[#E4E4E7] px-3 py-1.5 rounded-lg hover:bg-[#F4F4F5] transition-colors">
          <SlidersHorizontal size={14} />
          Filter Results
        </button>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1.5fr] px-6 py-3 bg-[#F4F4F5] border-b border-[#E4E4E7]">
        {['SOURCE', 'PRICE', 'STOCK', 'ETA', 'RATING', 'AI SCORE', 'ACTION'].map((col) => (
          <span key={col} className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider">
            {col}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#E4E4E7]/50">
        {displayRows.map((row, i) => (
          <motion.div
            key={row.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35, ease: 'easeOut' }}
            className={`
              grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1.5fr] items-center px-6 py-4
              ${row.best ? 'bg-[#F0FDF4] border-l-[3px] border-l-[#16A34A]' : 'hover:bg-[#FAFAFA]'}
              transition-colors
            `}
          >
            {/* Source */}
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium text-[#09090B]">{row.source}</span>
              {row.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#16A34A] text-white uppercase">
                  {row.badge}
                </span>
              )}
            </div>

            {/* Price */}
            <span className="font-mono text-[15px] font-semibold text-[#09090B]">
              ${row.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>

            {/* Stock */}
            <span className={`text-[12px] font-medium px-2 py-0.5 rounded-full w-fit ${row.stockColor}`}>
              {row.stock}
            </span>

            {/* ETA */}
            <span className="text-[13px] text-[#71717A]">{row.eta}</span>

            {/* Rating */}
            <Stars rating={row.rating} />

            {/* AI Score */}
            <span className={`text-[12px] font-bold px-2.5 py-1 rounded-full w-fit ${row.aiScoreColor}`}>
              {row.aiScore}/100
            </span>

            {/* Action */}
            <div className="flex items-center gap-2">
              <a
                href={row.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  text-[13px] font-medium px-4 py-1.5 rounded-lg transition-colors
                  ${row.best
                    ? 'bg-[#09090B] text-white hover:bg-[#16A34A]'
                    : 'border border-[#E4E4E7] text-[#09090B] hover:bg-[#F4F4F5]'
                  }
                `}
              >
                View Deal
              </a>
              {row.best && (
                <button className="p-1.5 border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors">
                  <Sparkles size={14} className="text-[#16A34A]" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load more */}
      <div className="px-6 py-4 border-t border-[#E4E4E7] text-center">
        <button className="text-[13px] font-medium text-[#71717A] border border-[#E4E4E7] px-6 py-2 rounded-lg hover:bg-[#F4F4F5] transition-colors">
          LOAD 11 MORE SOURCES ↓
        </button>
      </div>
    </div>
  );
}
