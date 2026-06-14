'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { signOut } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, HelpCircle, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const BREADCRUMBS = {
  '/dashboard/search':         'Search',
  '/dashboard/results':        'Results',
  '/dashboard/ai-insights':    'AI Insights',
  '/dashboard/watchlist':      'Watch List',
  '/dashboard/unit-economics': 'Unit Economics',
  '/dashboard/price-history':  'Price History',
  '/dashboard/settings':       'Settings',
};

export default function Topbar() {
  const pathname = usePathname();
  const [user] = useAuthState(auth);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  const pageLabel = BREADCRUMBS[pathname] || 'Dashboard';

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (!mounted) return null;

  return (
    <div className="fixed top-0 left-0 right-0 lg:left-60 h-14 bg-white border-b border-[#E4E4E7] z-30 hidden lg:flex items-center px-6 gap-4">
      {/* ── Left: breadcrumb ── */}
      <div className="flex items-center gap-1.5 text-[14px] shrink-0">
        <span className="text-[#A1A1AA]">Dashboard</span>
        <span className="text-[#A1A1AA]">›</span>
        <span className="text-[#09090B] font-medium">{pageLabel}</span>
      </div>

      {/* ── Center: search input ── */}
      <div className="flex-1 flex justify-center">
        <div className="relative w-[400px]">
          <input
            type="text"
            placeholder="Search deals, suppliers, or products... (CMD+K)"
            className="w-full h-8 pl-3 pr-3 text-[13px] bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg outline-none focus:border-[#16A34A] focus:ring-[3px] focus:ring-[rgba(22,163,74,0.15)] transition-all placeholder:text-[#A1A1AA]"
          />
        </div>
      </div>

      {/* ── Right: icons + badge + avatar ── */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Bell with green notification dot */}
        <button className="relative p-1.5 hover:bg-[#F4F4F5] rounded-lg transition-colors">
          <Bell size={18} className="text-[#71717A]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#16A34A] rounded-full" />
        </button>

        {/* Help */}
        <button className="p-1.5 hover:bg-[#F4F4F5] rounded-lg transition-colors">
          <HelpCircle size={18} className="text-[#71717A]" />
        </button>

        {/* Pro Tier badge */}
        <span className="px-2.5 py-1 text-[11px] font-semibold text-[#09090B] border border-[#E4E4E7] rounded-full">
          Pro Tier
        </span>

        {/* User avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            className="w-8 h-8 rounded-full bg-[#09090B] text-white flex items-center justify-center text-[12px] font-bold hover:ring-2 hover:ring-[#16A34A] transition-all"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              initials
            )}
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 bg-white border border-[#E4E4E7] rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.10)] z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-[#E4E4E7]">
                  <p className="text-[13px] font-semibold text-[#09090B] truncate">
                    {user?.displayName || 'User'}
                  </p>
                  <p className="text-[11px] text-[#A1A1AA] truncate">{user?.email}</p>
                </div>
                <Link href="/dashboard/settings" onClick={() => setShowUserMenu(false)}>
                  <div className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-[#09090B] hover:bg-[#F4F4F5] cursor-pointer transition-colors">
                    <Settings size={14} />
                    Settings
                  </div>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer transition-colors"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
