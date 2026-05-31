'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export const dynamic = 'force-dynamic';

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-[#09090B]' : 'bg-[#E4E4E7]'}`}
    >
      <motion.span
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
      />
    </button>
  );
}

export default function SettingsPage() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [arbitrageAlerts, setArbitrageAlerts] = useState(true);

  return (
    <div className="p-6 lg:p-8 max-w-[640px]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <h1 className="text-[28px] font-bold text-[#09090B]">Settings</h1>
        <p className="text-[14px] text-[#71717A] mt-0.5">Manage your preferences</p>
      </motion.div>

      {/* Notifications */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} className="mb-8">
        <h2 className="text-[14px] font-semibold text-[#09090B] uppercase tracking-wider mb-4">Notifications</h2>
        <div className="bg-white border border-[#E4E4E7] rounded-[14px] divide-y divide-[#E4E4E7]">
          {[
            { label: 'Email Notifications', desc: 'Receive email updates about your searches', value: emailNotifs, set: setEmailNotifs },
            { label: 'Price Alerts',        desc: 'Get notified when prices drop to your target', value: priceAlerts, set: setPriceAlerts },
            { label: 'Arbitrage Alerts',    desc: 'Receive alerts for new arbitrage opportunities', value: arbitrageAlerts, set: setArbitrageAlerts },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-[14px] font-medium text-[#09090B]">{s.label}</p>
                <p className="text-[12px] text-[#71717A] mt-0.5">{s.desc}</p>
              </div>
              <Toggle checked={s.value} onChange={s.set} />
            </div>
          ))}
        </div>
      </motion.section>

      <p className="text-center text-[12px] text-[#A1A1AA] mt-12">
        DealRadar v1.0 · Powered by Anakin Intelligence
      </p>
    </div>
  );
}
