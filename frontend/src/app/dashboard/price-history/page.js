'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

const RANGES = ['7D', '30D', '90D'];

// Demo price history data
const ALL_DATA = {
  '7D': [
    { date: 'Feb 6',  amazon: 1255, walmart: 1248, flipkart: 1242, ebay: 1590 },
    { date: 'Feb 7',  amazon: 1252, walmart: 1246, flipkart: 1242, ebay: 1588 },
    { date: 'Feb 8',  amazon: 1250, walmart: 1245, flipkart: 1242, ebay: 1595 },
    { date: 'Feb 9',  amazon: 1248, walmart: 1244, flipkart: 1242, ebay: 1599 },
    { date: 'Feb 10', amazon: 1246, walmart: 1243, flipkart: 1242, ebay: 1599 },
    { date: 'Feb 11', amazon: 1244, walmart: 1242, flipkart: 1242, ebay: 1599 },
    { date: 'Feb 12', amazon: 1242, walmart: 1242, flipkart: 1242, ebay: 1599 },
  ],
  '30D': [
    { date: 'Jan 14', amazon: 1310, walmart: 1290, flipkart: 1270, ebay: 1610 },
    { date: 'Jan 17', amazon: 1300, walmart: 1285, flipkart: 1265, ebay: 1605 },
    { date: 'Jan 20', amazon: 1290, walmart: 1278, flipkart: 1260, ebay: 1600 },
    { date: 'Jan 23', amazon: 1280, walmart: 1270, flipkart: 1255, ebay: 1598 },
    { date: 'Jan 26', amazon: 1270, walmart: 1262, flipkart: 1250, ebay: 1595 },
    { date: 'Jan 29', amazon: 1260, walmart: 1255, flipkart: 1246, ebay: 1592 },
    { date: 'Feb 1',  amazon: 1255, walmart: 1250, flipkart: 1244, ebay: 1590 },
    { date: 'Feb 5',  amazon: 1248, walmart: 1245, flipkart: 1242, ebay: 1599 },
    { date: 'Feb 12', amazon: 1242, walmart: 1242, flipkart: 1242, ebay: 1599 },
  ],
  '90D': [
    { date: 'Nov 14', amazon: 1420, walmart: 1390, flipkart: 1360, ebay: 1650 },
    { date: 'Nov 28', amazon: 1400, walmart: 1375, flipkart: 1345, ebay: 1640 },
    { date: 'Dec 12', amazon: 1380, walmart: 1360, flipkart: 1330, ebay: 1630 },
    { date: 'Dec 26', amazon: 1360, walmart: 1340, flipkart: 1315, ebay: 1620 },
    { date: 'Jan 9',  amazon: 1340, walmart: 1320, flipkart: 1300, ebay: 1610 },
    { date: 'Jan 23', amazon: 1310, walmart: 1290, flipkart: 1270, ebay: 1600 },
    { date: 'Feb 6',  amazon: 1270, walmart: 1260, flipkart: 1250, ebay: 1595 },
    { date: 'Feb 12', amazon: 1242, walmart: 1242, flipkart: 1242, ebay: 1599 },
  ],
};

const TABLE_DATA = [
  { date: '2024-02-12', source: 'Amazon US',  price: 1242.00, change: '-2.00', stock: 'In Stock'  },
  { date: '2024-02-12', source: 'Walmart',    price: 1242.00, change: '-3.00', stock: 'In Stock'  },
  { date: '2024-02-12', source: 'Flipkart',   price: 1242.00, change: '0.00',  stock: 'In Stock'  },
  { date: '2024-02-12', source: 'eBay',       price: 1599.00, change: '+4.00', stock: 'In Stock'  },
  { date: '2024-02-11', source: 'Amazon US',  price: 1244.00, change: '-2.00', stock: 'In Stock'  },
  { date: '2024-02-11', source: 'B&H Video',  price: 1310.00, change: '0.00',  stock: 'Low Stock' },
];

const LINE_COLORS = {
  amazon:   '#16A34A',
  walmart:  '#D97706',
  flipkart: '#2563EB',
  ebay:     '#DC2626',
};

export default function PriceHistoryPage() {
  const [product, setProduct] = useState('Pro Camera Lens 85mm f/1.4');
  const [range, setRange] = useState('30D');

  const chartData = ALL_DATA[range] || ALL_DATA['30D'];

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
            type="text"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="Search a tracked product..."
            className="w-full h-10 pl-9 pr-4 text-[14px] bg-white border border-[#E4E4E7] rounded-lg outline-none focus:border-[#16A34A] focus:ring-[3px] focus:ring-[rgba(22,163,74,0.15)] transition-all"
          />
        </div>
        <button className="h-10 px-5 bg-[#09090B] text-white text-[13px] font-semibold rounded-lg hover:bg-[#16A34A] transition-colors">
          Search
        </button>
      </motion.div>

      {/* Chart card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="bg-white border border-[#E4E4E7] rounded-[14px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
      >
        {/* Date range tabs */}
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

        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
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
      </motion.div>

      {/* Data table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <div className="bg-white border border-[#E4E4E7] rounded-[14px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr] px-6 py-3 bg-[#F4F4F5] border-b border-[#E4E4E7]">
            {['DATE', 'SOURCE', 'PRICE', 'CHANGE', 'STOCK STATUS'].map((c) => (
              <span key={c} className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider">{c}</span>
            ))}
          </div>
          <div className="divide-y divide-[#E4E4E7]/50">
            {TABLE_DATA.map((row, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.04, duration: 0.3 }}
                className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr] items-center px-6 py-3.5 hover:bg-[#FAFAFA] transition-colors"
              >
                <span className="text-[13px] text-[#71717A]">{row.date}</span>
                <span className="text-[13px] font-medium text-[#09090B]">{row.source}</span>
                <span className="font-mono text-[13px] font-semibold text-[#09090B]">
                  ${row.price.toFixed(2)}
                </span>
                <span className={`font-mono text-[13px] font-semibold ${
                  row.change.startsWith('-') ? 'text-[#16A34A]' : row.change === '0.00' ? 'text-[#A1A1AA]' : 'text-[#DC2626]'
                }`}>
                  {row.change.startsWith('-') ? row.change : row.change === '0.00' ? '—' : `+${row.change}`}
                </span>
                <span className={`text-[12px] font-medium px-2 py-0.5 rounded-full w-fit ${
                  row.stock === 'Low Stock' ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#F4F4F5] text-[#71717A]'
                }`}>
                  {row.stock}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
