'use client';

import { motion } from 'framer-motion';
import { Zap, Mail, TrendingUp } from 'lucide-react';
import Card from './Card';
import Button from './Button';

export default function AIPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Arbitrage Alert */}
      <Card className="bg-gradient-to-br from-[#f0fdf4] to-white border-[#86efac] p-4">
        <div className="flex items-start gap-3 mb-3">
          <Zap className="text-[#16A34A] mt-1" size={20} />
          <div>
            <h3 className="font-semibold text-[#16A34A] text-sm">Arbitrage Alert</h3>
            <p className="text-xs text-[#16A34A]/70 mt-1">
              Potential $18.75 profit per unit at MOQ 100
            </p>
          </div>
        </div>
        <Button variant="primary" size="sm" className="w-full">
          View Opportunities
        </Button>
      </Card>

      {/* AI Negotiator */}
      <Card className="bg-gradient-to-br from-[#eff6ff] to-white border-[#bfdbfe] p-4">
        <div className="flex items-start gap-3 mb-3">
          <Mail className="text-[#2563EB] mt-1" size={20} />
          <div>
            <h3 className="font-semibold text-[#2563EB] text-sm">AI Negotiator</h3>
            <p className="text-xs text-[#2563EB]/70 mt-1">
              Generate negotiation email
            </p>
          </div>
        </div>
        <Button variant="primary" size="sm" className="w-full">
          Generate Email
        </Button>
      </Card>

      {/* Price Predictor */}
      <Card className="bg-gradient-to-br from-[#fffbeb] to-white border-[#fcd34d] p-4">
        <div className="flex items-start gap-3 mb-3">
          <TrendingUp className="text-[#D97706] mt-1" size={20} />
          <div>
            <h3 className="font-semibold text-[#D97706] text-sm">Price Predictor</h3>
            <p className="text-xs text-[#D97706]/70 mt-1">
              AI forecast for next 30 days
            </p>
          </div>
        </div>
        <Button variant="primary" size="sm" className="w-full">
          View Forecast
        </Button>
      </Card>

      {/* Info */}
      <p className="text-xs text-[#a1a1aa] text-center pt-4">
        AI panel shows after 3+ sources resolve
      </p>
    </motion.div>
  );
}
