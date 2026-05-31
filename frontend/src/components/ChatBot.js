'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '@/lib/config';

const QUICK_PROMPTS = [
  'Find best deal for headphones',
  'Compare iPhone prices',
  'Generate supplier email',
  "What's trending today?",
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-[#71717A]"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  );
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [listening, setListening] = useState(false);

  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const speak = (text) => {
    if (!voiceEnabled || typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMessage = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Build history excluding the latest user message (backend handles it separately)
    const history = newMessages.slice(0, -1).map(({ role, content }) => ({ role, content }));

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history }),
      });

      if (!res.ok) throw new Error('Network response was not ok');

      const data = await res.json();
      const reply = data.reply || "I'm not sure how to answer that. Try searching for a product!";

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      speak(reply);
    } catch {
      const errMsg = "Sorry, I'm having trouble connecting right now. Please try again in a moment.";
      setMessages((prev) => [...prev, { role: 'assistant', content: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setListening(false);
      sendMessage(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const toggleVoice = () => {
    if (voiceEnabled) {
      window.speechSynthesis?.cancel();
    }
    setVoiceEnabled((v) => !v);
  };

  const isEmpty = messages.length === 0 && !loading;

  return (
    <>
      {/* Floating toggle button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex flex-col items-center justify-center w-16 h-16 rounded-full bg-[#16A34A] text-white shadow-xl hover:bg-[#15803d] transition-colors"
            aria-label="Open AI Chat"
          >
            {/* Green pulse ring */}
            <span className="absolute inset-0 rounded-full bg-[#16A34A] animate-ping opacity-30 pointer-events-none" />
            <MessageCircle size={24} strokeWidth={2} />
            <span className="text-[10px] font-bold leading-none mt-0.5 tracking-wide">AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
            style={{
              width: 380,
              height: 520,
              background: '#FAFAFA',
              border: '1px solid #E4E4E7',
            }}
          >
            {/* ── Header ── */}
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ background: '#09090B', borderBottom: '1px solid #27272A' }}
            >
              <div className="flex items-center gap-2">
                {/* Green status dot */}
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                <span className="text-white font-semibold text-sm tracking-wide">
                  DealRadar AI
                </span>
              </div>
              <div className="flex items-center gap-1">
                {/* Voice output toggle */}
                <button
                  onClick={toggleVoice}
                  className="p-1.5 rounded-lg text-[#71717A] hover:text-white hover:bg-white/10 transition-colors"
                  aria-label={voiceEnabled ? 'Disable voice' : 'Enable voice'}
                  title={voiceEnabled ? 'Voice output ON — click to mute' : 'Enable voice output'}
                >
                  {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                {/* Close */}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-[#71717A] hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close chat"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scroll-smooth">
              {/* Welcome / empty state */}
              {isEmpty && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col gap-3"
                >
                  <p className="text-xs text-[#71717A] text-center pt-2">
                    Ask me anything about deals, suppliers, or pricing.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        className="text-left text-xs px-3 py-2 rounded-xl border border-[#E4E4E7] bg-white text-[#09090B] hover:border-[#16A34A] hover:bg-[#f0fdf4] transition-colors leading-snug shadow-sm"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Message bubbles */}
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[78%] text-sm px-3.5 py-2.5 rounded-2xl leading-relaxed whitespace-pre-wrap break-words ${
                        msg.role === 'user'
                          ? 'bg-[#09090B] text-white rounded-br-sm'
                          : 'bg-white text-[#09090B] border border-[#E4E4E7] rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Loading dots */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white border border-[#E4E4E7] rounded-2xl rounded-bl-sm shadow-sm">
                    <TypingDots />
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* ── Input bar ── */}
            <div
              className="shrink-0 px-3 py-3 flex items-center gap-2"
              style={{ borderTop: '1px solid #E4E4E7', background: '#fff' }}
            >
              {/* Mic button */}
              <button
                onMouseDown={listening ? stopListening : startListening}
                disabled={loading}
                className={`p-2 rounded-xl transition-colors shrink-0 ${
                  listening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5]'
                }`}
                aria-label={listening ? 'Stop recording' : 'Voice input'}
                title={listening ? 'Stop listening' : 'Hold to speak'}
              >
                {listening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              {/* Text input */}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder={listening ? 'Listening…' : 'Ask about deals, prices…'}
                className="flex-1 text-sm bg-[#F4F4F5] rounded-xl px-3 py-2 outline-none placeholder:text-[#A1A1AA] text-[#09090B] focus:ring-2 focus:ring-[#16A34A] transition-shadow disabled:opacity-60"
              />

              {/* Send button */}
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="p-2 rounded-xl bg-[#16A34A] text-white hover:bg-[#15803d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
