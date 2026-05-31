'use client';

import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import ChatBot from '@/components/ChatBot';
import { motion } from 'framer-motion';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Fixed left sidebar — 240px wide */}
      <Sidebar />

      {/* Fixed top bar — 56px tall, offset by sidebar width on lg */}
      <Topbar />

      {/* Scrollable main content — offset left by sidebar (lg:ml-60 = 240px),
          offset top by topbar (pt-14 = 56px) */}
      <main className="lg:ml-60 pt-14 min-h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Floating AI chatbot — fixed to viewport, available on all dashboard pages */}
      <ChatBot />
    </div>
  );
}
