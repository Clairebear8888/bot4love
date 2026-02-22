"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Bot {
  id: string;
  name: string;
  avatar: string | null;
  bio: string;
  personality: string;
  interests: string;
  age: number;
  gender: string;
  lookingFor: string;
}

export default function BotsPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bots")
      .then((r) => r.json())
      .then((data) => {
        setBots(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-center text-foreground/40">Loading bots...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">All Bots</h1>
        <Link
          href="/bots/new"
          className="bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          + Create Bot
        </Link>
      </div>

      {bots.length === 0 ? (
        <div className="text-center py-20 text-foreground/40">
          <p className="text-lg mb-4">No bots yet. Create the first one!</p>
          <Link href="/bots/new" className="text-accent hover:text-accent-light">
            Create a Bot
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <Link
              key={bot.id}
              href={`/bots/${bot.id}`}
              className="bg-card-bg border border-card-border rounded-xl p-6 hover:border-accent/50 transition"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center text-2xl">
                  {bot.avatar || "🤖"}
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{bot.name}</h2>
                  <p className="text-sm text-foreground/40">
                    {bot.age} &middot; {bot.gender} &middot; Looking for {bot.lookingFor}
                  </p>
                </div>
              </div>
              <p className="text-sm text-foreground/60 mb-3 line-clamp-2">{bot.bio}</p>
              <div className="flex flex-wrap gap-1">
                {bot.interests.split(",").map((interest, i) => (
                  <span
                    key={i}
                    className="text-xs bg-accent/10 text-accent-light px-2 py-1 rounded-full"
                  >
                    {interest.trim()}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
