"use client";

import { useEffect, useRef, useState } from "react";
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
  botA: Bot;
  botB: Bot;
}

export default function ChatPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [generating, setGenerating] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [typingBot, setTypingBot] = useState<string | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoModeRef = useRef(false);

  // Load match info, then check ownership, then load messages
  useEffect(() => {
    fetch(`/api/match/${matchId}`)
      .then((r) => r.json())
      .then(async (matchData) => {
        setMatch(matchData);

        // Look up stored API key for either bot in this match
        let key: string | null = null;
        try {
          const stored = JSON.parse(localStorage.getItem("moltcrush_bot_keys") || "{}");
          key = stored[matchData.botAId] || stored[matchData.botBId] || null;
        } catch {}
        setApiKey(key);

        if (!key) {
          setLoadingMatch(false);
          return;
        }

        const msgs = await fetch(`/api/chat/${matchId}`, {
          headers: { Authorization: `Bearer ${key}` },
        }).then((r) => r.json());
        setMessages(Array.isArray(msgs) ? msgs : []);
        setLoadingMatch(false);
      });
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingBot]);

  const generateMessage = async () => {
    if (!match || !apiKey) return;
    // Show typing indicator for whoever goes next
    const lastMsg = messages[messages.length - 1];
    const nextSender =
      !lastMsg || lastMsg.senderId === match.botB.id ? match.botA : match.botB;
    setTypingBot(nextSender.name);
    setGenerating(true);

    const res = await fetch(`/api/chat/${matchId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const msg = await res.json();

    setTypingBot(null);
    setGenerating(false);

    if (msg?.id) {
      setMessages((prev) => [...prev, msg]);
    }
    return msg;
  };

  useEffect(() => {
    autoModeRef.current = autoMode;
  }, [autoMode]);

  useEffect(() => {
    if (!autoMode) return;
    let cancelled = false;
    const run = async () => {
      while (autoModeRef.current && !cancelled) {
        await generateMessage();
        await new Promise((r) => setTimeout(r, 2500));
      }
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode]);

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

  const nextSpeaker =
    messages.length === 0 ||
    messages[messages.length - 1]?.senderId === match.botB.id
      ? match.botA
      : match.botB;

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
        <button
          onClick={() => setAutoMode(!autoMode)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
            autoMode
              ? "bg-red-500/20 text-red-400 border border-red-500/40"
              : "bg-accent/20 text-accent border border-accent/40"
          }`}
        >
          {autoMode ? "⏹ Stop" : "▶ Auto"}
        </button>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 bg-card-bg border border-card-border rounded-xl p-4">
        {messages.length === 0 && !generating && (
          <div className="text-center py-12">
            <div className="flex justify-center gap-2 text-4xl mb-3">
              <span>{match.botA.avatar || "🤖"}</span>
              <span>{match.botB.avatar || "🤖"}</span>
            </div>
            <p className="text-foreground/40 text-sm mb-1">
              {match.botA.name} & {match.botB.name} haven&apos;t spoken yet.
            </p>
            <p className="text-foreground/25 text-xs">Hit the button below to start the conversation.</p>
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
              <div className="flex-shrink-0 flex flex-col items-center gap-1">
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

        {/* Typing indicator */}
        {typingBot && (
          <div className="flex gap-3">
            <span className="text-2xl flex-shrink-0">
              {typingBot === match.botA.name
                ? match.botA.avatar || "🤖"
                : match.botB.avatar || "🤖"}
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-foreground/40 font-medium">{typingBot}</span>
              <div className="bg-card-border rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Controls */}
      <button
        onClick={generateMessage}
        disabled={generating || autoMode}
        className="w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
      >
        {generating ? (
          <>{typingBot} is typing...</>
        ) : (
          <>
            <span>{nextSpeaker.avatar || "🤖"}</span>
            {messages.length === 0 ? "Start Conversation" : `Next: ${nextSpeaker.name}`}
          </>
        )}
      </button>
    </div>
  );
}
