'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Server,
  Bell,
  Volume2,
  Database,
  Cpu,
  Mic2,
  RefreshCw,
  Check,
  MessageSquare,
} from 'lucide-react';
import Button from '@/components/Button';
import {
  getApiBase,
  getHealth,
  getAllDocuments,
  getVoiceStatus,
  VOICE_REPLIES_STORAGE_KEY,
  PUSH_NOTIFICATIONS_STORAGE_KEY,
} from '@/lib/api';

const DISPLAY_NAME_KEY = 'documentiq:displayName';
const EMAIL_KEY = 'documentiq:email';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${
        checked ? 'bg-[#16A34A]' : 'bg-[#E4E4E7]'
      }`}
    >
      <motion.span
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
      />
    </button>
  );
}

function SectionCard({
  title,
  description,
  delay = 0,
  children,
}: {
  title: string;
  description?: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white border border-[#E4E4E7] rounded-2xl overflow-hidden"
    >
      <div className="px-6 py-5 border-b border-[#E4E4E7]">
        <h2 className="text-sm font-semibold text-[#09090B]">{title}</h2>
        {description && <p className="text-xs text-[#71717A] mt-0.5">{description}</p>}
      </div>
      <div className="divide-y divide-[#E4E4E7]">{children}</div>
    </motion.section>
  );
}

type StatusState = 'loading' | 'online' | 'offline';

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  const [pushNotifications, setPushNotifications] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(false);

  const [backendStatus, setBackendStatus] = useState<StatusState>('loading');
  const [docCount, setDocCount] = useState<number | null>(null);
  const [voiceTtsEnabled, setVoiceTtsEnabled] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setDisplayName(localStorage.getItem(DISPLAY_NAME_KEY) || 'Demo User');
    setEmail(localStorage.getItem(EMAIL_KEY) || 'demo@documentiq.app');
    setPushNotifications(localStorage.getItem(PUSH_NOTIFICATIONS_STORAGE_KEY) === 'true');
    setVoiceReplies(localStorage.getItem(VOICE_REPLIES_STORAGE_KEY) === 'true');
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshStatus = async () => {
    setRefreshing(true);
    setBackendStatus('loading');

    const healthCheck = getHealth()
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));

    const docsCheck = getAllDocuments()
      .then((docs) => setDocCount(docs.length))
      .catch(() => setDocCount(null));

    const voiceCheck = getVoiceStatus()
      .then((s) => setVoiceTtsEnabled(s.enabled))
      .catch(() => setVoiceTtsEnabled(false));

    await Promise.all([healthCheck, docsCheck, voiceCheck]);
    setRefreshing(false);
  };

  const handleSaveProfile = () => {
    localStorage.setItem(DISPLAY_NAME_KEY, displayName);
    localStorage.setItem(EMAIL_KEY, email);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handlePushToggle = (value: boolean) => {
    setPushNotifications(value);
    localStorage.setItem(PUSH_NOTIFICATIONS_STORAGE_KEY, String(value));
  };

  const handleVoiceToggle = (value: boolean) => {
    setVoiceReplies(value);
    localStorage.setItem(VOICE_REPLIES_STORAGE_KEY, String(value));
  };

  const statusItems = [
    {
      key: 'backend',
      label: 'BACKEND',
      icon: Server,
      value:
        backendStatus === 'loading' ? 'Checking...' : backendStatus === 'online' ? 'Online' : 'Offline',
      tone: backendStatus === 'online' ? 'green' : backendStatus === 'offline' ? 'red' : 'gray',
    },
    {
      key: 'indexed',
      label: 'INDEXED',
      icon: Database,
      value: docCount === null ? '—' : `${docCount} document${docCount === 1 ? '' : 's'}`,
      tone: 'blue',
    },
    {
      key: 'engine',
      label: 'AI ENGINE',
      icon: Cpu,
      value: 'Groq Llama 3',
      tone: 'green',
    },
    {
      key: 'voice',
      label: 'VOICE TTS',
      icon: Mic2,
      value:
        voiceTtsEnabled === null ? '—' : voiceTtsEnabled ? 'ElevenLabs eleven_multilingual_v2' : 'Not configured',
      tone: voiceTtsEnabled ? 'amber' : 'gray',
    },
  ] as const;

  const toneClasses: Record<string, string> = {
    green: 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]',
    red: 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]',
    blue: 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]',
    amber: 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]',
    gray: 'bg-[#FAFAFA] border-[#E4E4E7] text-[#71717A]',
  };

  return (
    <div className="px-4 sm:px-8 py-6 max-w-3xl mx-auto space-y-6 pb-28">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-[#09090B]">Settings</h1>
        <p className="text-sm text-[#71717A] mt-1">
          Manage your profile and notification preferences.
        </p>
      </motion.div>

      {/* Profile */}
      <SectionCard title="Profile" description="How you appear across DocumentIQ." delay={0.05}>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-[#71717A] uppercase tracking-wide mb-1.5">
              <User size={14} />
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white border border-[#E4E4E7] rounded-lg outline-none focus:border-[#16A34A] focus:ring-[3px] focus:ring-[rgba(22,163,74,0.15)] transition-all"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-[#71717A] uppercase tracking-wide mb-1.5">
              <Mail size={14} />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white border border-[#E4E4E7] rounded-lg outline-none focus:border-[#16A34A] focus:ring-[3px] focus:ring-[rgba(22,163,74,0.15)] transition-all"
              placeholder="you@example.com"
            />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Button onClick={handleSaveProfile} size="sm">
              Save Profile
            </Button>
            <AnimatePresence>
              {profileSaved && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1 text-xs font-medium text-[#16A34A]"
                >
                  <Check size={14} /> Saved
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </SectionCard>

      {/* Preferences */}
      <SectionCard title="Preferences" delay={0.1}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-start gap-3">
            <Bell size={18} className="text-[#71717A] mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#09090B]">Push Notifications</p>
              <p className="text-xs text-[#71717A] mt-0.5">
                Get notified in-browser when document processing finishes.
              </p>
            </div>
          </div>
          <Toggle checked={pushNotifications} onChange={handlePushToggle} />
        </div>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-start gap-3">
            <Volume2 size={18} className="text-[#71717A] mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#09090B]">AI Voice Replies</p>
              <p className="text-xs text-[#71717A] mt-0.5">
                Enable ElevenLabs TTS to read chat answers aloud automatically.
              </p>
            </div>
          </div>
          <Toggle checked={voiceReplies} onChange={handleVoiceToggle} />
        </div>
      </SectionCard>

      {/* System Status */}
      <SectionCard title="System Status" delay={0.15}>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {statusItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className={`rounded-xl border p-3 flex flex-col gap-2 ${toneClasses[item.tone]}`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-80">
                    <Icon size={12} />
                    {item.label}
                  </div>
                  <p className="text-xs font-semibold leading-snug break-words">{item.value}</p>
                </div>
              );
            })}
          </div>
          <button
            onClick={refreshStatus}
            className="mt-4 flex items-center gap-1.5 text-xs text-[#71717A] hover:text-[#09090B] transition-colors"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh status
          </button>
          <p className="mt-2 text-[11px] text-[#A1A1AA] font-mono">{getApiBase()}</p>
        </div>
      </SectionCard>

      {/* Footer tagline */}
      <p className="text-center text-xs text-[#A1A1AA] pt-2">
        DocumentIQ v1.0 · Documents speak. DocumentIQ translates.
      </p>

      {/* Floating Ask DocumentIQ button */}
      <Link
        href="/dashboard/chat"
        className="fixed bottom-6 right-6 lg:right-10 z-40 flex items-center gap-2 bg-[#09090B] text-white px-5 py-3 rounded-full text-sm font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:bg-[#16A34A] transition-colors duration-300"
      >
        <MessageSquare size={18} />
        Open Ask DocumentIQ
      </Link>
    </div>
  );
}
