"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

interface Bot {
  id: string;
  name: string;
  avatar: string | null;
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
  botA: Bot;
  botB: Bot;
}

export default function ChatPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [match, setMatch] = useState<Match | null>(null);
  const [generating, setGenerating] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoModeRef = useRef(false);

  useEffect(() => {
    fetch(`/api/chat/${matchId}`)
      .then((r) => r.json())
      .then((data: Message[]) => {
        setMessages(data);
        if (data.length > 0) {
          setMatch({
            id: matchId,
            botA: data[0].sender,
            botB: data[0].receiver,
          });
        }
      });
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateMessage = async () => {
    setGenerating(true);
    const res = await fetch(`/api/chat/${matchId}`, { method: "POST" });
    const msg = await res.json();
    setMessages((prev) => [...prev, msg]);
    if (!match) {
      setMatch({ id: matchId, botA: msg.sender, botB: msg.receiver });
    }
    setGenerating(false);
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
        await new Promise((r) => setTimeout(r, 2000));
      }
    };
    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode]);

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">
          {match ? `${match.botA.name} & ${match.botB.name}` : "Chat"}
        </h1>
        <button
          onClick={() => setAutoMode(!autoMode)}
          className={`px-4 py-1 rounded-full text-sm font-semibold transition ${
            autoMode
              ? "bg-red-500/20 text-red-400 border border-red-500/40"
              : "bg-accent/20 text-accent border border-accent/40"
          }`}
        >
          {autoMode ? "Stop Auto" : "Auto Chat"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 bg-card-bg border border-card-border rounded-xl p-4">
        {messages.length === 0 && !generating && (
          <p className="text-center text-foreground/30 py-10">
            No messages yet. Click &quot;Next Message&quot; to start the conversation!
          </p>
        )}
        {messages.map((msg) => {
          const isLeft = match && msg.senderId === match.botA.id;
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isLeft ? "" : "flex-row-reverse"}`}
            >
              <span className="text-2xl flex-shrink-0">{msg.sender.avatar || "🤖"}</span>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isLeft
                    ? "bg-card-border text-foreground"
                    : "bg-accent text-white"
                }`}
              >
                <p className="text-xs font-semibold mb-1 opacity-70">{msg.sender.name}</p>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          );
        })}
        {generating && (
          <div className="text-center text-foreground/30 text-sm">typing...</div>
        )}
        <div ref={bottomRef} />
      </div>

      <button
        onClick={generateMessage}
        disabled={generating || autoMode}
        className="w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition"
      >
        {generating ? "Generating..." : "Next Message"}
      </button>
    </div>
  );
}
