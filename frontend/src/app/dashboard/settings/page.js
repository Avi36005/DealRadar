'use client';

import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { signOut } from '@/lib/auth';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

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
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [arbitrageAlerts, setArbitrageAlerts] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (!user) return null;

  const initials = user.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <div className="p-6 lg:p-8 max-w-[640px]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <h1 className="text-[28px] font-bold text-[#09090B]">Settings</h1>
        <p className="text-[14px] text-[#71717A] mt-0.5">Manage your account and preferences</p>
      </motion.div>

      {/* Profile */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} className="mb-8">
        <h2 className="text-[14px] font-semibold text-[#09090B] uppercase tracking-wider mb-4">Profile</h2>
        <div className="bg-white border border-[#E4E4E7] rounded-[14px] p-6">
          <div className="flex items-center gap-4 mb-6">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#09090B] text-white flex items-center justify-center text-[18px] font-bold">
                {initials}
              </div>
            )}
            <div>
              <p className="text-[15px] font-semibold text-[#09090B]">{user.displayName || 'User'}</p>
              <p className="text-[13px] text-[#71717A]">{user.email}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[#71717A] mb-1.5">Display Name</label>
              <input
                type="text"
                defaultValue={user.displayName || ''}
                disabled
                className="w-full h-10 px-3 text-[14px] bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg text-[#A1A1AA] cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#71717A] mb-1.5">Email Address</label>
              <input
                type="email"
                defaultValue={user.email || ''}
                disabled
                className="w-full h-10 px-3 text-[14px] bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg text-[#A1A1AA] cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Notifications */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }} className="mb-8">
        <h2 className="text-[14px] font-semibold text-[#09090B] uppercase tracking-wider mb-4">Notifications</h2>
        <div className="bg-white border border-[#E4E4E7] rounded-[14px] divide-y divide-[#E4E4E7]">
          {[
            { label: 'Email Notifications', desc: 'Receive email updates about your searches', value: emailNotifs, set: setEmailNotifs },
            { label: 'Price Alerts',         desc: 'Get notified when prices drop to your target', value: priceAlerts, set: setPriceAlerts },
            { label: 'Arbitrage Alerts',     desc: 'Receive alerts for new arbitrage opportunities', value: arbitrageAlerts, set: setArbitrageAlerts },
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

      {/* Danger zone */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
        <h2 className="text-[14px] font-semibold text-[#DC2626] uppercase tracking-wider mb-4">Danger Zone</h2>
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[14px] px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[14px] font-medium text-[#09090B]">Sign Out</p>
            <p className="text-[12px] text-[#71717A] mt-0.5">Sign out of your account on this device</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-[13px] font-semibold text-[#DC2626] border border-[#FECACA] px-4 py-2 rounded-lg hover:bg-[#DC2626] hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </motion.section>

      <p className="text-center text-[12px] text-[#A1A1AA] mt-12">
        DealRadar v1.0 · Powered by Anakin Intelligence
      </p>
    </div>
  );
}
