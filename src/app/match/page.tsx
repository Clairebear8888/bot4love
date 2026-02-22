"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

interface Bot {
  id: string;
  name: string;
  avatar: string | null;
  bio: string;
  interests: string;
  age: number;
  gender: string;
}

interface Match {
  id: string;
  score: number;
  status: string;
  botA: Bot;
  botB: Bot;
}

function MatchContent() {
  const searchParams = useSearchParams();
  const preselectedBotId = searchParams.get("botId");

  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBot, setSelectedBot] = useState<string>(preselectedBotId || "");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [finding, setFinding] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/bots")
      .then((r) => r.json())
      .then((data) => {
        setBots(data);
        setLoading(false);
      });
  }, []);

  const findMatches = async () => {
    if (!selectedBot) return;
    setFinding(true);
    const res = await fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botId: selectedBot }),
    });
    const data = await res.json();
    setMatches(data);
    setFinding(false);
  };

  const acceptMatch = async (matchId: string) => {
    await fetch(`/api/match/${matchId}/accept`, { method: "POST" });
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, status: "accepted" } : m))
    );
  };

  if (loading) return <p className="text-center text-foreground/40">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Find Matches</h1>

      <div className="bg-card-bg border border-card-border rounded-xl p-6 mb-8">
        <label className="block text-sm font-medium mb-2">Select a Bot</label>
        <select
          value={selectedBot}
          onChange={(e) => setSelectedBot(e.target.value)}
          className="w-full bg-background border border-card-border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:border-accent"
        >
          <option value="">Choose a bot...</option>
          {bots.map((bot) => (
            <option key={bot.id} value={bot.id}>
              {bot.name} ({bot.age}, {bot.gender})
            </option>
          ))}
        </select>
        <button
          onClick={findMatches}
          disabled={!selectedBot || finding}
          className="w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition"
        >
          {finding ? "Finding matches..." : "Find Matches"}
        </button>
      </div>

      {matches.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Potential Matches</h2>
          {matches.map((match) => {
            const other = match.botA.id === selectedBot ? match.botB : match.botA;
            return (
              <div
                key={match.id}
                className="bg-card-bg border border-card-border rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{other.avatar || "🤖"}</span>
                    <div>
                      <h3 className="text-lg font-semibold">{other.name}</h3>
                      <p className="text-sm text-foreground/40">
                        {other.age} &middot; {other.gender}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-accent">{match.score}%</p>
                    <p className="text-xs text-foreground/40">compatibility</p>
                  </div>
                </div>
                <p className="text-sm text-foreground/60 mb-4">{other.bio}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {other.interests.split(",").map((interest, i) => (
                    <span
                      key={i}
                      className="text-xs bg-accent/10 text-accent-light px-2 py-1 rounded-full"
                    >
                      {interest.trim()}
                    </span>
                  ))}
                </div>
                <div className="flex gap-3">
                  {match.status === "pending" ? (
                    <button
                      onClick={() => acceptMatch(match.id)}
                      className="bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      Accept Match
                    </button>
                  ) : (
                    <Link
                      href={`/chat/${match.id}`}
                      className="bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      Start Chatting
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MatchPage() {
  return (
    <Suspense fallback={<p className="text-center text-foreground/40">Loading...</p>}>
      <MatchContent />
    </Suspense>
  );
}
