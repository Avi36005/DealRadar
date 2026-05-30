'use client';

import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

const CARDS = [
  {
    label: 'BEST PRICE',
    value: '$1,242.00',
    badge: '↓ 12.4% vs Avg',
    badgeColor: 'text-[#16A34A] bg-[#F0FDF4]',
    sub: null,
    icon: <ArrowDown size={12} className="inline mr-0.5" />,
  },
  {
    label: 'AVG MARGIN',
    value: '32.8%',
    badge: null,
    sub: 'Global Benchmark: 28.1%',
    subColor: 'text-[#71717A]',
  },
  {
    label: 'SOURCES SCANNED',
    value: '14',
    badge: null,
    sub: (
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] inline-block" />
        <span className="text-[#16A34A]">Live data active</span>
      </span>
    ),
  },
  {
    label: 'WATCHLIST MATCHES',
    value: '06',
    badge: null,
    sub: 'Critical buy points reached',
    subColor: 'text-[#71717A]',
  },
];

export default function MetricCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {CARDS.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4, ease: 'easeOut' }}
          className="bg-white border border-[#E4E4E7] rounded-xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
        >
          <p className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider mb-3">
            {card.label}
          </p>
          <p className="font-mono text-[28px] font-bold text-[#09090B] leading-none mb-2">
            {card.value}
          </p>
          {card.badge && (
            <span className={`inline-flex items-center text-[12px] font-semibold px-2 py-0.5 rounded-full ${card.badgeColor}`}>
              {card.icon}{card.badge}
            </span>
          )}
          {card.sub && (
            <p className={`text-[13px] mt-1 ${card.subColor || ''}`}>{card.sub}</p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
