'use client';

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import ChatBot from '@/components/ChatBot';
import { motion } from 'framer-motion';

// All dashboard routes are fully dynamic — never statically prerendered
export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }) {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/login');
    }
  }, [user, loading, mounted, router]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-[#09090B] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) return null;

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
