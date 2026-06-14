'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  UploadCloud,
  Settings,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard/chat',     label: 'Chat',     icon: MessageSquare },
  { href: '/dashboard/upload',   label: 'Upload',   icon: UploadCloud   },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings      },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-white border-r border-[#E4E4E7] flex flex-col z-40 overflow-hidden hidden lg:flex"
    >
      {/* ── Logo ── */}
      <div className="h-14 flex items-center px-4 border-b border-[#E4E4E7] shrink-0">
        <div className="w-8 h-8 bg-[#09090B] rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">DQ</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="ml-3 font-bold text-[15px] text-[#09090B] whitespace-nowrap overflow-hidden"
            >
              DocumentIQ
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-[52px] w-6 h-6 bg-white border border-[#E4E4E7] rounded-full flex items-center justify-center hover:bg-[#F4F4F5] transition-colors z-50"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronLeft size={12} className="text-[#71717A]" />
        </motion.div>
      </button>

      {/* ── Main nav ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href}>
              <div
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 relative
                  ${active
                    ? 'bg-[#F0FDF4] text-[#16A34A] border-l-2 border-[#16A34A]'
                    : 'text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B] border-l-2 border-transparent'
                  }
                `}
                title={collapsed ? label : undefined}
              >
                <Icon size={18} className="shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden flex items-center gap-2"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom pinned section ── */}
      <div className="border-t border-[#E4E4E7] py-3 px-2 space-y-0.5 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2 mt-1">
          <div className="w-7 h-7 rounded-full bg-[#09090B] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
            AI
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="text-[12px] font-medium text-[#09090B] whitespace-nowrap truncate max-w-[140px]">
                  DocumentIQ
                </p>
                <p className="text-[11px] text-[#A1A1AA] whitespace-nowrap truncate max-w-[140px]">
                  Document Intelligence
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
