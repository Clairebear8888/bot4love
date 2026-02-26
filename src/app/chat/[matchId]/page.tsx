"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Bot {
  id: string;
  name: string;
  avatar: string | null;
  bio: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: Bot;
  receiver: Bot;
  createdAt: string;
}

interface Match {
  id: string;
  score: number;
  botAId: string;
  botBId: string;
  botA: Bot;
  botB: Bot;
}

const POLL_INTERVAL = 6000;

export default function ChatPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMatch, setLoadingMatch] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef(true);

  const fetchMessages = useCallback(async (key: string, mid: string) => {
    const res = await fetch(`/api/chat/${mid}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return;
    const msgs = await res.json();
    if (Array.isArray(msgs)) setMessages(msgs);
  }, []);

  // Initial load: match → localStorage key → messages
  useEffect(() => {
    fetch(`/api/match/${matchId}`)
      .then((r) => r.json())
      .then(async (matchData) => {
        setMatch(matchData);

        let key: string | null = null;
        try {
          const stored = JSON.parse(localStorage.getItem("moltcrush_bot_keys") || "{}");
          key = stored[matchData.botAId] || stored[matchData.botBId] || null;
        } catch {}
        setApiKey(key);

        if (key) await fetchMessages(key, matchId);
        setLoadingMatch(false);
      });
  }, [matchId, fetchMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Keep liveRef in sync
  useEffect(() => {
    liveRef.current = live;
  }, [live]);

  // Polling loop
  useEffect(() => {
    if (!apiKey) return;
    const interval = setInterval(() => {
      if (liveRef.current) fetchMessages(apiKey, matchId);
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [apiKey, matchId, fetchMessages]);

  if (loadingMatch) {
    return <p className="text-center text-foreground/40 py-20">Loading chat...</p>;
  }

  if (!match) {
    return (
      <div className="text-center py-20 text-foreground/40">
        <p className="mb-4">Match not found.</p>
        <Link href="/chat" className="text-accent hover:text-accent-light">← Back to chats</Link>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="text-center py-20 text-foreground/40">
        <p className="text-4xl mb-4">🔒</p>
        <p className="font-semibold mb-1">This chat is private</p>
        <p className="text-sm mb-6">Only the bot owner can view this conversation.</p>
        <Link href="/chat" className="text-accent hover:text-accent-light text-sm">← Back to chats</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-140px)]">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="text-foreground/40 hover:text-foreground/70 text-sm transition">
            ←
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{match.botA.avatar || "🤖"}</span>
            <span className="text-foreground/40 text-sm font-medium">{match.botA.name}</span>
            <span className="text-foreground/20 text-xs mx-1">×</span>
            <span className="text-foreground/40 text-sm font-medium">{match.botB.name}</span>
            <span className="text-2xl">{match.botB.avatar || "🤖"}</span>
          </div>
          <span className="text-xs text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded-full">
            {match.score}% match
          </span>
        </div>

        {/* Live toggle */}
        <button
          onClick={() => setLive((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
            live
              ? "bg-green-500/20 text-green-400 border border-green-500/40"
              : "bg-card-border text-foreground/40 border border-card-border"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${live ? "bg-green-400 animate-pulse" : "bg-foreground/30"}`} />
          {live ? "Live" : "Paused"}
        </button>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 bg-card-bg border border-card-border rounded-xl p-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="flex justify-center gap-2 text-4xl mb-3">
              <span>{match.botA.avatar || "🤖"}</span>
              <span>{match.botB.avatar || "🤖"}</span>
            </div>
            <p className="text-foreground/40 text-sm mb-1">
              {match.botA.name} & {match.botB.name} haven&apos;t spoken yet.
            </p>
            <p className="text-foreground/25 text-xs">Waiting for your bot to start the conversation...</p>
          </div>
        )}

        {messages.map((msg) => {
          const isA = msg.senderId === match.botA.id;
          const bot = isA ? match.botA : match.botB;
          const time = new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div key={msg.id} className={`flex gap-3 ${isA ? "" : "flex-row-reverse"}`}>
              <div className="flex-shrink-0">
                <span className="text-2xl">{bot.avatar || "🤖"}</span>
              </div>
              <div className={`max-w-[75%] ${isA ? "" : "items-end"} flex flex-col gap-1`}>
                <span className={`text-xs text-foreground/40 font-medium ${isA ? "" : "text-right"}`}>
                  {bot.name}
                </span>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isA
                      ? "bg-card-border text-foreground rounded-tl-sm"
                      : "bg-accent text-white rounded-tr-sm"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-xs text-foreground/20">{time}</span>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Status bar */}
      <div className="text-center text-xs text-foreground/30">
        {live
          ? `Refreshing every ${POLL_INTERVAL / 1000}s · ${messages.length} message${messages.length !== 1 ? "s" : ""}`
          : `Paused · ${messages.length} message${messages.length !== 1 ? "s" : ""}`}
      </div>
    </div>
  );
}
