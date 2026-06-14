'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, HelpCircle, Search, Menu, X, FileText } from 'lucide-react';
import { NAV_ITEMS } from './Sidebar';

const BREADCRUMBS: Record<string, string> = {
  '/dashboard/chat':     'Chat',
  '/dashboard/upload':   'Upload',
  '/dashboard/settings': 'Settings',
};

export default function Topbar() {
  const pathname = usePathname();
  const pageLabel = (pathname && BREADCRUMBS[pathname]) || 'Dashboard';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <>
      <div className="fixed top-0 left-0 right-0 lg:left-60 h-14 bg-white border-b border-[#E4E4E7] z-30 flex items-center px-4 sm:px-6 gap-3 sm:gap-4">
        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileNavOpen(true)}
          className="lg:hidden -ml-1 p-1.5 hover:bg-[#F4F4F5] rounded-lg transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={20} className="text-[#71717A]" />
        </button>

        {/* Left: breadcrumb */}
        <div className="hidden sm:flex items-center gap-1.5 text-[14px] shrink-0">
          <span className="text-[#A1A1AA]">Dashboard</span>
          <span className="text-[#A1A1AA]">›</span>
          <span className="text-[#09090B] font-medium">{pageLabel}</span>
        </div>
        <span className="sm:hidden text-[15px] font-semibold text-[#09090B]">{pageLabel}</span>

        {/* Center: search input */}
        <div className="flex-1 hidden md:flex justify-center">
          <div className="relative w-full max-w-[400px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] pointer-events-none" />
            <input
              type="text"
              placeholder="Search documents by name, type, or topic..."
              className="w-full h-8 pl-8 pr-3 text-[13px] bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg outline-none focus:border-[#16A34A] focus:ring-[3px] focus:ring-[rgba(22,163,74,0.15)] transition-all placeholder:text-[#A1A1AA]"
            />
          </div>
        </div>
        <div className="flex-1 md:hidden" />

        {/* Right: icons + badge + avatar */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Bell with green notification dot */}
          <button className="relative p-1.5 hover:bg-[#F4F4F5] rounded-lg transition-colors">
            <Bell size={18} className="text-[#71717A]" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#16A34A] rounded-full" />
          </button>

          {/* Help */}
          <button className="hidden sm:flex p-1.5 hover:bg-[#F4F4F5] rounded-lg transition-colors">
            <HelpCircle size={18} className="text-[#71717A]" />
          </button>

          {/* Free Tier badge */}
          <span className="hidden sm:inline px-2.5 py-1 text-[11px] font-semibold text-[#09090B] border border-[#E4E4E7] rounded-full">
            Free Tier
          </span>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#09090B] text-white flex items-center justify-center text-[12px] font-bold">
            AI
          </div>
        </div>
      </div>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-[#E4E4E7] z-50 lg:hidden flex flex-col"
            >
              <div className="h-14 flex items-center justify-between px-4 border-b border-[#E4E4E7] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#09090B] rounded-lg flex items-center justify-center">
                    <FileText size={16} className="text-white" />
                  </div>
                  <span className="font-bold text-[15px] text-[#09090B]">DocumentIQ</span>
                </div>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="p-1.5 hover:bg-[#F4F4F5] rounded-lg transition-colors"
                  aria-label="Close navigation menu"
                >
                  <X size={20} className="text-[#71717A]" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <Link key={href} href={href} onClick={() => setMobileNavOpen(false)}>
                      <div
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                          active
                            ? 'bg-[#F0FDF4] text-[#16A34A] border-l-2 border-[#16A34A]'
                            : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B] border-l-2 border-transparent'
                        }`}
                      >
                        <Icon size={18} className="shrink-0" />
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-[#E4E4E7] py-3 px-4 text-[11px] text-[#A1A1AA] shrink-0">
                DocumentIQ v1.0 · Document Intelligence
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
