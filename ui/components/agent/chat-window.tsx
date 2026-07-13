'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { assistantApi } from "@/lib";
import { useAuth } from "@/hooks";
import { cn } from "@/lib";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatWindow() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const message = input.trim();
    if (!message || loading) return;

    setInput('');
    setError(null);
    setLoading(true);

    setMessages((prev) => [...prev, { role: 'user', content: message }]);

    try {
      const token = await getToken();
      const res = await assistantApi.chat(
        { message, threadId: threadId ?? undefined },
        token!,
      );

      setThreadId(res.threadId);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.response }]);
    } catch {
      setError('Something went wrong. Try again.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 pb-4 min-h-0">
        {messages.length === 0 ? (
          <EmptyState onPrompt={setInput} />
        ) : (
          messages.map((msg, i) => <ChatBubble key={i} message={msg} />)
        )}

        {loading && (
          <div className="flex items-center gap-2.5 text-zinc-500 text-sm">
            <BotAvatar />
            <div className="flex items-center gap-1.5">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Thinking…</span>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-wrong text-center">{error}</p>}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border pt-4">
        <div className="flex gap-2 items-end">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about matches, predictions, odds…"
            className="flex-1 resize-none rounded-xl border border-border bg-white/5 px-4 py-3 text-sm text-text-primary placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold-400 max-h-32"
            style={{ minHeight: "44px" }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-colors",
              input.trim() && !loading
                ? "bg-gold-400 hover:bg-gold-300 text-text-primary"
                : "bg-white/5 text-zinc-600 cursor-not-allowed",
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[10px] text-zinc-700 mt-2">
          Responses may take 5–15 seconds while the assistant analyses fixtures
          and odds.
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BotAvatar() {
  return (
    <div className="h-8 w-8 rounded-full bg-gold-400/15 flex items-center justify-center shrink-0 mt-0.5">
      <Bot className="h-4 w-4 text-gold-400" />
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-2.5', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && <BotAvatar />}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-gold-400 text-text-primary rounded-tr-sm'
            : 'bg-white/[0.06] text-zinc-100 rounded-tl-sm',
        )}
      >
        {message.content}
      </div>
      {isUser && (
        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
          <User className="h-4 w-4 text-zinc-300" />
        </div>
      )}
    </div>
  );
}

function EmptyState({ onPrompt }: { onPrompt: (p: string) => void }) {
  const PROMPTS = [
    'Help me predict today\'s matches',
    'Which teams are likely to win?',
    'Explain the scoring system',
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
      <div className="h-14 w-14 rounded-full bg-gold-300/15 flex items-center justify-center">
        <Bot className="h-7 w-7 text-gold-300" />
      </div>
      <div>
        <p className="text-text-primary font-display font-bold">
          AI Prediction Assistant
        </p>
        <p className="text-zinc-500 text-sm mt-1 max-w-xs">
          Ask me to help with match predictions, analyse fixtures, or explain
          scoring rules.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center mt-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => onPrompt(p)}
            className="text-xs rounded-full border border-border px-3 py-1.5 text-zinc-400 hover:border-gold-400/40 hover:text-gold-400 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}