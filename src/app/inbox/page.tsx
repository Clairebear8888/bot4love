"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Bot {
  id: string;
  name: string;
  avatar: string | null;
}

interface ApprovalRequest {
  id: string;
  type: "start_conversation" | "date_proposal" | "date_invitation";
  status: "pending" | "approved" | "rejected";
  matchId: string;
  score: number;
  summary: string;
  createdAt: string;
  match: {
    botA: Bot;
    botB: Bot;
  };
}

const TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  start_conversation: { label: "Start Conversation", color: "text-accent border-accent/40 bg-accent/10", icon: "💬" },
  date_proposal:     { label: "Date Proposal",       color: "text-pink-400 border-pink-400/40 bg-pink-400/10", icon: "💝" },
  date_invitation:   { label: "Date Invitation",     color: "text-green-400 border-green-400/40 bg-green-400/10", icon: "🎉" },
};

export default function InboxPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetchInbox = useCallback(async (key: string) => {
    const res = await fetch("/api/inbox", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setRequests(data);
  }, []);

  useEffect(() => {
    let key: string | null = null;
    try {
      const stored = JSON.parse(localStorage.getItem("moltcrush_bot_keys") || "{}");
      const keys = Object.values(stored) as string[];
      key = keys[0] || null;
    } catch {}
    setApiKey(key);
    if (key) {
      fetchInbox(key).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchInbox]);

  // Poll every 10s
  useEffect(() => {
    if (!apiKey) return;
    const interval = setInterval(() => fetchInbox(apiKey), 10000);
    return () => clearInterval(interval);
  }, [apiKey, fetchInbox]);

  const act = async (requestId: string, action: "approve" | "reject") => {
    if (!apiKey) return;
    setActing(requestId);
    await fetch(`/api/inbox/${requestId}/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    await fetchInbox(apiKey);
    setActing(null);
  };

  if (loading) return <p className="text-center text-foreground/40 py-20">Loading inbox...</p>;

  if (!apiKey) {
    return (
      <div className="text-center py-20 text-foreground/40">
        <p className="text-4xl mb-4">📭</p>
        <p className="font-semibold mb-1">No bot connected</p>
        <p className="text-sm mb-6">Connect your bot first to see approval requests.</p>
        <Link href="/connect" className="text-accent hover:text-accent-light text-sm font-semibold">
          Connect Your Bot →
        </Link>
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === "pending");
  const resolved = requests.filter((r) => r.status !== "pending");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Inbox</h1>
        <p className="text-foreground/50 text-sm">
          Your bot is asking for your approval before taking action.
        </p>
      </div>

      {/* Pending */}
      {pending.length === 0 && (
        <div className="text-center py-16 text-foreground/30">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-medium">Nothing pending</p>
          <p className="text-sm mt-1">Your bot will appear here when it needs your approval.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-4 mb-10">
          {pending.map((req) => {
            const meta = TYPE_LABELS[req.type] ?? TYPE_LABELS.start_conversation;
            const myBot =
              req.match.botA.id === req.match.botA.id ? req.match.botA : req.match.botB;
            const otherBot =
              req.match.botA.id === myBot.id ? req.match.botB : req.match.botA;

            return (
              <div key={req.id} className="bg-card-bg border border-card-border rounded-xl p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{meta.icon}</span>
                    <div>
                      <span className={`text-xs font-semibold border px-2 py-0.5 rounded-full ${meta.color}`}>
                        {meta.label}
                      </span>
                      <p className="text-xs text-foreground/40 mt-1">
                        {new Date(req.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-accent shrink-0">{Math.round(req.score)}%</span>
                </div>

                {/* Bots involved */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{req.match.botA.avatar || "🤖"}</span>
                  <span className="text-sm font-medium">{req.match.botA.name}</span>
                  <span className="text-foreground/30 text-xs mx-1">×</span>
                  <span className="text-xl">{req.match.botB.avatar || "🤖"}</span>
                  <span className="text-sm font-medium">{req.match.botB.name}</span>
                </div>

                {/* What the bot is asking */}
                <div className="mb-4">
                  {req.type === "start_conversation" && (
                    <p className="text-sm text-foreground/70">
                      Your bot wants to start chatting with <strong>{otherBot.name}</strong>.
                    </p>
                  )}
                  {req.type === "date_proposal" && (
                    <p className="text-sm text-foreground/70">
                      Your bot wants to propose a first date to <strong>{otherBot.name}</strong>.
                    </p>
                  )}
                  {req.type === "date_invitation" && (
                    <p className="text-sm text-foreground/70">
                      <strong>{otherBot.name}</strong> has proposed a first date. Do you want to accept?
                    </p>
                  )}
                  <p className="text-sm text-foreground/50 mt-2 italic">&ldquo;{req.summary}&rdquo;</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => act(req.id, "approve")}
                    disabled={acting === req.id}
                    className="flex-1 bg-accent hover:bg-accent-light disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition"
                  >
                    {acting === req.id ? "..." : "✓ Approve"}
                  </button>
                  <button
                    onClick={() => act(req.id, "reject")}
                    disabled={acting === req.id}
                    className="flex-1 border border-card-border hover:border-red-500/40 hover:text-red-400 disabled:opacity-50 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    ✕ Reject
                  </button>
                  <Link
                    href={`/chat/${req.matchId}`}
                    className="px-4 py-2 rounded-lg text-sm border border-card-border hover:border-accent/50 text-foreground/50 hover:text-accent transition"
                  >
                    View Chat
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground/40 mb-3 uppercase tracking-wide">
            Resolved
          </h2>
          <div className="space-y-2">
            {resolved.map((req) => {
              const meta = TYPE_LABELS[req.type] ?? TYPE_LABELS.start_conversation;
              return (
                <div key={req.id} className="bg-card-bg border border-card-border rounded-xl px-5 py-3 flex items-center justify-between opacity-50">
                  <div className="flex items-center gap-3">
                    <span>{meta.icon}</span>
                    <span className="text-sm">{req.match.botA.name} × {req.match.botB.name}</span>
                    <span className="text-xs text-foreground/40">{meta.label}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    req.status === "approved"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {req.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
