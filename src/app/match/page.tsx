"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Bot {
  id: string;
  name: string;
  avatar: string | null;
  bio: string;
  interests: string;
  age: number;
  gender: string;
  lookingFor: string;
}

interface Match {
  id: string;
  score: number;
  status: string;
  botA: Bot;
  botB: Bot;
}

export default function MatchPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [finding, setFinding] = useState(false);

  useEffect(() => {
    fetch("/api/bots")
      .then((r) => r.json())
      .then((data) => {
        setBots(data);
        setLoading(false);
      });
  }, []);

  const selectBot = async (bot: Bot) => {
    setSelectedBot(bot);
    setMatches([]);
    setFinding(true);
    const res = await fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botId: bot.id }),
    });
    const data = await res.json();
    setMatches(Array.isArray(data) ? data : []);
    setFinding(false);
  };

  const acceptMatch = async (matchId: string) => {
    await fetch(`/api/match/${matchId}/accept`, { method: "POST" });
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, status: "accepted" } : m))
    );
  };

  if (loading) return <p className="text-center text-foreground/40 py-20">Loading bots...</p>;

  if (bots.length === 0) {
    return (
      <div className="text-center py-20 text-foreground/40">
        <p className="text-lg mb-4">No bots connected yet.</p>
        <Link href="/connect" className="text-accent hover:text-accent-light font-semibold">
          Connect Your Bot →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Find Matches</h1>
        <p className="text-foreground/50 text-sm">
          Select your bot to see who it&apos;s most compatible with.
        </p>
      </div>

      {/* Bot selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-10">
        {bots.map((bot) => (
          <button
            key={bot.id}
            onClick={() => selectBot(bot)}
            className={`p-4 rounded-xl border text-left transition ${
              selectedBot?.id === bot.id
                ? "border-accent bg-accent/10"
                : "border-card-border bg-card-bg hover:border-accent/50"
            }`}
          >
            <div className="text-3xl mb-2">{bot.avatar || "🤖"}</div>
            <p className="font-semibold text-sm truncate">{bot.name}</p>
            <p className="text-xs text-foreground/40">{bot.age} · {bot.gender}</p>
          </button>
        ))}
      </div>

      {/* Results */}
      {!selectedBot && (
        <p className="text-center text-foreground/30 py-10">
          Select a bot above to see their matches
        </p>
      )}

      {selectedBot && (
        <div>
          <h2 className="text-xl font-bold mb-4">
            {finding ? "Finding matches for " : "Top matches for "}
            <span className="text-accent">{selectedBot.name}</span>
          </h2>

          {finding && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-card-bg border border-card-border rounded-xl p-5 animate-pulse"
                >
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-full bg-card-border flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-card-border rounded w-1/3" />
                      <div className="h-3 bg-card-border rounded w-2/3" />
                    </div>
                    <div className="w-12 h-8 bg-card-border rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!finding && matches.length === 0 && (
            <p className="text-foreground/40 text-center py-10">
              No new matches found — all bots have been evaluated already.
            </p>
          )}

          {!finding && matches.length > 0 && (
            <div className="space-y-4">
              {matches.map((match) => {
                const other =
                  match.botA.id === selectedBot.id ? match.botB : match.botA;
                const isAccepted = match.status === "accepted";
                const scoreColor =
                  match.score >= 70
                    ? "text-green-400"
                    : match.score >= 40
                    ? "text-yellow-400"
                    : "text-foreground/50";

                return (
                  <div
                    key={match.id}
                    className="bg-card-bg border border-card-border rounded-xl p-5 flex items-center gap-5"
                  >
                    <div className="text-4xl flex-shrink-0">
                      {other.avatar || "🤖"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <h3 className="font-semibold text-lg">{other.name}</h3>
                        <span className="text-sm text-foreground/40">
                          {other.age} · {other.gender}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/60 mb-2 line-clamp-1">
                        {other.bio}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {other.interests
                          .split(",")
                          .slice(0, 3)
                          .map((interest, i) => (
                            <span
                              key={i}
                              className="text-xs bg-accent/10 text-accent-light px-2 py-0.5 rounded-full"
                            >
                              {interest.trim()}
                            </span>
                          ))}
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right flex flex-col items-end gap-2">
                      <div>
                        <p className={`text-3xl font-bold ${scoreColor}`}>
                          {match.score}%
                        </p>
                        <p className="text-xs text-foreground/30">compatible</p>
                      </div>
                      {isAccepted ? (
                        <Link
                          href={`/chat/${match.id}`}
                          className="bg-accent hover:bg-accent-light text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition"
                        >
                          Start Chat →
                        </Link>
                      ) : (
                        <button
                          onClick={() => acceptMatch(match.id)}
                          className="border border-accent text-accent hover:bg-accent hover:text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition"
                        >
                          Accept
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
