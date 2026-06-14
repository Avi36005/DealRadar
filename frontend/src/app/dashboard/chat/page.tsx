'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, FileText, AlertTriangle, X, Volume2, Loader2 } from 'lucide-react';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  askQuestion,
  getPageImageUrl,
  getVoiceStatus,
  speakText,
  VOICE_REPLIES_STORAGE_KEY,
  type Citation,
} from '@/lib/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  sourcesFound?: boolean;
}

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    'Hi! Ask me anything about the documents in your library. Every answer comes with ' +
    'inline citations like [DocumentName, p.N] linked back to the exact source page.',
  sourcesFound: true,
};

const CITATION_PATTERN = /\[([^,\]]+),\s*p\.\s*(\d+)\]/g;

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [modalCitation, setModalCitation] = useState<Citation | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    getVoiceStatus()
      .then((s) => setVoiceEnabled(s.enabled))
      .catch(() => setVoiceEnabled(false));
  }, []);

  const prevMessageCount = useRef(messages.length);
  useEffect(() => {
    const last = messages[messages.length - 1];
    const isNew = messages.length > prevMessageCount.current;
    prevMessageCount.current = messages.length;

    if (!isNew || !last || last.role !== 'assistant') return;
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(VOICE_REPLIES_STORAGE_KEY) !== 'true') return;

    playMessage(last.content, messages.length - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, voiceEnabled]);

  const playMessage = async (text: string, idx: number) => {
    if (!voiceEnabled) return;
    try {
      setSpeakingIdx(idx);
      const blob = await speakText(text.replace(CITATION_PATTERN, '').trim());
      const url = URL.createObjectURL(blob);
      audioRef.current?.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setSpeakingIdx((i) => (i === idx ? null : i));
      audio.onerror = () => setSpeakingIdx((i) => (i === idx ? null : i));
      await audio.play();
    } catch {
      setSpeakingIdx((i) => (i === idx ? null : i));
    }
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const lastCitations = lastAssistant?.citations || [];

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    const history = messages
      .filter((m) => m !== WELCOME_MESSAGE)
      .map((m) => ({ role: m.role, content: m.content }));

    const next = [...messages, { role: 'user', content: question } as ChatMessage];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const res = await askQuestion(question, history);
      setMessages([
        ...next,
        {
          role: 'assistant',
          content: res.answer,
          citations: res.citations,
          sourcesFound: res.sources_found,
        },
      ]);
    } catch {
      setMessages([
        ...next,
        {
          role: 'assistant',
          content: 'Something went wrong while contacting the backend. Please check the server and try again.',
          citations: [],
          sourcesFound: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += transcript;
        else interim += transcript;
      }
      if (final.trim()) {
        setInput((prev) => (prev ? `${prev.trim()} ${final.trim()}` : final.trim()));
      }
      setLiveTranscript(interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      setLiveTranscript('');
    };

    recognition.onerror = () => {
      setIsListening(false);
      setLiveTranscript('');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)]">
      {/* Conversation column */}
      <div className="flex flex-col flex-1 lg:basis-[70%] min-h-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-4">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <MessageBubble
                message={msg}
                onCitationClick={setModalCitation}
                voiceEnabled={voiceEnabled}
                isSpeaking={speakingIdx === idx}
                onSpeak={() => playMessage(msg.content, idx)}
              />
            </motion.div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#E4E4E7] rounded-lg px-4 py-3">
                <LoadingSpinner size="sm" text="Searching documents..." />
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-[#E4E4E7] bg-white p-4">
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mb-2 px-3 py-2 bg-[#eff6ff] border border-[#2563EB]/20 rounded text-sm text-[#2563EB] flex items-center gap-2"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2563EB] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2563EB]" />
                </span>
                {liveTranscript || 'Listening...'}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? 'Stop voice input' : 'Start voice input'}
              className={`shrink-0 p-2.5 rounded border transition-colors ${
                isListening
                  ? 'bg-[#DC2626] text-white border-[#DC2626]'
                  : 'border-[#E4E4E7] text-[#71717A] hover:bg-[#F4F4F5]'
              }`}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents..."
              rows={1}
              className="flex-1 resize-none border border-[#E4E4E7] rounded px-3 py-2.5 text-sm text-[#09090B] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black/30"
            />

            <Button onClick={handleSend} disabled={loading || !input.trim()} size="md">
              <Send size={16} />
              Send
            </Button>
          </div>
        </div>
      </div>

      {/* Citations panel */}
      <div className="hidden lg:flex lg:basis-[30%] flex-col border-l border-[#E4E4E7] bg-white p-4 overflow-y-auto">
        <h3 className="text-sm font-semibold text-[#09090B] mb-1">Sources</h3>
        <p className="text-xs text-[#71717A] mb-4">
          Page citations for the latest answer
        </p>

        {lastCitations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center px-4">
            <p className="text-sm text-[#A1A1AA]">
              Citations and source page thumbnails will appear here after you ask a question.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lastCitations.map((c, i) => (
              <button
                key={`${c.document_id}-${c.page_number}-${i}`}
                onClick={() => setModalCitation(c)}
                className="block w-full text-left border border-[#E4E4E7] rounded overflow-hidden bg-white hover:shadow-hover transition-shadow"
              >
                <img
                  src={getPageImageUrl(c.document_id, c.page_number)}
                  alt={`${c.document_name} page ${c.page_number}`}
                  className="w-full h-[120px] object-cover object-top bg-[#F4F4F5]"
                />
                <div className="p-2">
                  <p className="text-xs font-medium text-[#09090B] truncate">{c.document_name}</p>
                  <p className="text-xs text-[#71717A]">Page {c.page_number}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen page image modal */}
      <AnimatePresence>
        {modalCitation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalCitation(null)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#E4E4E7] sticky top-0 bg-white">
                <div>
                  <p className="text-sm font-semibold text-[#09090B]">{modalCitation.document_name}</p>
                  <p className="text-xs text-[#71717A]">Page {modalCitation.page_number}</p>
                </div>
                <button
                  onClick={() => setModalCitation(null)}
                  className="p-1 hover:bg-[#F4F4F5] rounded transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <img
                src={getPageImageUrl(modalCitation.document_id, modalCitation.page_number)}
                alt={`${modalCitation.document_name} page ${modalCitation.page_number}`}
                className="w-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MessageBubble({
  message,
  onCitationClick,
  voiceEnabled,
  isSpeaking,
  onSpeak,
}: {
  message: ChatMessage;
  onCitationClick: (c: Citation) => void;
  voiceEnabled: boolean;
  isSpeaking: boolean;
  onSpeak: () => void;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`group relative max-w-[85%] sm:max-w-[75%] rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser ? 'bg-black text-white' : 'bg-white border border-[#E4E4E7] text-[#09090B]'
        }`}
      >
        {isUser ? message.content : renderWithCitations(message.content, message.citations || [], onCitationClick)}

        {!isUser && message.sourcesFound === false && (
          <div className="mt-3 flex items-center gap-2 text-xs text-[#D97706] bg-[#FFFBEB] rounded px-2.5 py-2">
            <AlertTriangle size={14} className="shrink-0" />
            No relevant documents found for this question.
          </div>
        )}

        {!isUser && voiceEnabled && (
          <button
            onClick={onSpeak}
            title="Read answer aloud"
            className={`absolute -right-2 -bottom-2 p-1.5 rounded-full border bg-white shadow-sm transition-opacity ${
              isSpeaking ? 'border-accent-green text-accent-green' : 'border-[#E4E4E7] text-[#A1A1AA] opacity-0 group-hover:opacity-100 hover:text-[#09090B]'
            }`}
          >
            {isSpeaking ? <Loader2 size={12} className="animate-spin" /> : <Volume2 size={12} />}
          </button>
        )}
      </div>
    </div>
  );
}

function renderWithCitations(
  content: string,
  citations: Citation[],
  onCitationClick: (c: Citation) => void
): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  CITATION_PATTERN.lastIndex = 0;
  while ((match = CITATION_PATTERN.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{content.slice(lastIndex, match.index)}</span>);
    }

    const docName = match[1].trim();
    const pageNumber = parseInt(match[2], 10);
    const citation = citations.find(
      (c) => c.document_name === docName && c.page_number === pageNumber
    );

    parts.push(
      <button
        key={key++}
        onClick={() => citation && onCitationClick(citation)}
        disabled={!citation}
        className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded text-xs font-medium bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] transition-colors align-middle disabled:cursor-default disabled:opacity-70"
      >
        <FileText size={12} />
        {docName}, p.{pageNumber}
      </button>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(<span key={key++}>{content.slice(lastIndex)}</span>);
  }

  return parts;
}
