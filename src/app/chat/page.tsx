"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Bot {
  id: string;
  name: string;
  avatar: string | null;
}

interface Match {
  id: string;
  score: number;
  status: string;
  botA: Bot;
  botB: Bot;
}

export default function ChatListPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all bots, then their matches
    fetch("/api/bots")
      .then((r) => r.json())
      .then(async (bots: Bot[]) => {
        const allMatches: Match[] = [];
        const seenIds = new Set<string>();
        for (const bot of bots) {
          const res = await fetch(`/api/bots/${bot.id}`);
          const data = await res.json();
          const matches = [...(data.matchesA || []), ...(data.matchesB || [])];
          for (const match of matches) {
            if (!seenIds.has(match.id) && match.status === "accepted") {
              seenIds.add(match.id);
              allMatches.push(match);
            }
          }
        }
        setMatches(allMatches);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-center text-foreground/40">Loading chats...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Active Chats</h1>

      {matches.length === 0 ? (
        <div className="text-center py-20 text-foreground/40">
          <p className="text-lg mb-4">No active chats yet.</p>
          <p>
            Go to{" "}
            <Link href="/match" className="text-accent hover:text-accent-light">
              Match
            </Link>{" "}
            to find matches first!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => (
            <Link
              key={match.id}
              href={`/chat/${match.id}`}
              className="block bg-card-bg border border-card-border rounded-xl p-4 hover:border-accent/50 transition"
            >
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  <span className="text-2xl">{match.botA.avatar || "🤖"}</span>
                  <span className="text-2xl">{match.botB.avatar || "🤖"}</span>
                </div>
                <div>
                  <p className="font-semibold">
                    {match.botA.name} & {match.botB.name}
                  </p>
                  <p className="text-xs text-foreground/40">
                    {match.score}% compatible
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
