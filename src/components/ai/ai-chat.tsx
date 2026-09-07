"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Bot, Eye } from "lucide-react";
import { useWorkspace } from "@/lib/client/store";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "How does the match score work?",
  "Who are my top candidates?",
  "Tips for writing a better job description?",
  "What should I ask in an interview?",
];

export function AIChat() {
  const ws = useWorkspace();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || loading) return;
    setInput("");
    setError(null);

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setLoading(true);

    try {
      const best = (candidateId: string) => {
        const c = ws.candidates.find((x) => x.id === candidateId);
        if (!c) return null;
        return c.screenings.reduce<number | null>(
          (acc, s) => (acc == null || s.match.overallScore > acc ? s.match.overallScore : acc),
          null,
        );
      };

      const workspaceSummary = {
        jobs: ws.jobs.slice(0, 15).map((j) => ({
          title: j.title,
          company: j.company,
          skills: j.requiredSkills.map((s) => s.name),
          screened: ws.candidates.filter((c) => c.screenings.some((s) => s.jobId === j.id)).length,
        })),
        candidates: ws.candidates.slice(0, 40).map((c) => ({
          name: c.resume.name ?? c.applicantName ?? c.fileName ?? "Unknown",
          status: c.status,
          bestScore: best(c.id) ?? undefined,
          jobTitle: c.screenings[0]?.jobTitle,
          topSkills: c.resume.skills.map((s) => s.name),
          tags: c.tags.map((t) => t.name),
        })),
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, workspaceSummary }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-xl shadow-rose-500/30 transition-transform hover:scale-105 active:scale-95 lg:bottom-6"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-36 right-4 z-50 flex h-[520px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 lg:bottom-24"
            role="dialog"
            aria-label="HireLens AI assistant"
          >
            {/* Header */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-3 text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                <Bot className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold">HireLens Assistant</p>
                <p className="flex items-center gap-1 text-[11px] text-white/80">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  </span>
                  {ws.candidates.length > 0 ? `Knows your ${ws.candidates.length} candidates` : "Ask me anything"}
                </p>
              </div>
              <Eye className="h-4 w-4 opacity-60" aria-hidden />
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-3.5 py-2.5 text-sm leading-relaxed text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    Hi! I&apos;m your hiring assistant. Ask me about your candidates, jobs, how scoring
                    works — or anything about recruiting in general.
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:bg-brand-950/40"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                    m.role === "user"
                      ? "ml-auto rounded-tr-sm bg-gradient-to-br from-rose-500 to-pink-600 text-white"
                      : "rounded-tl-sm bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
                  )}
                >
                  {m.content}
                </div>
              ))}

              {loading && (
                <div className="flex w-fit items-center gap-2 rounded-2xl rounded-tl-sm bg-slate-100 px-3.5 py-2.5 dark:bg-slate-800">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Thinking…</span>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                  {error}
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-slate-700"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything…"
                aria-label="Message the AI assistant"
                maxLength={4000}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/25 transition-all hover:scale-105 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
