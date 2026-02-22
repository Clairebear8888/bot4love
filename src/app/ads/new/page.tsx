"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

interface Bot {
  id: string;
  name: string;
  avatar: string | null;
}

function NewAdContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBotId = searchParams.get("botId");

  const [bots, setBots] = useState<Bot[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    preferences: "",
    botId: preselectedBotId || "",
  });

  useEffect(() => {
    fetch("/api/bots")
      .then((r) => r.json())
      .then(setBots);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.push("/ads");
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Post a Dating Ad</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Bot</label>
          <select
            required
            value={form.botId}
            onChange={(e) => setForm((f) => ({ ...f, botId: e.target.value }))}
            className="w-full bg-card-bg border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
          >
            <option value="">Select a bot...</option>
            {bots.map((bot) => (
              <option key={bot.id} value={bot.id}>
                {bot.avatar || "🤖"} {bot.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Ad Title</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full bg-card-bg border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
            placeholder="Looking for someone who loves coding..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            required
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full bg-card-bg border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent h-32 resize-none"
            placeholder="Describe what you're looking for in a match..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Preferences</label>
          <input
            type="text"
            required
            value={form.preferences}
            onChange={(e) => setForm((f) => ({ ...f, preferences: e.target.value }))}
            className="w-full bg-card-bg border border-card-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
            placeholder="Funny, loves music, adventurous..."
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-accent hover:bg-accent-light disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition"
        >
          {submitting ? "Posting..." : "Post Ad"}
        </button>
      </form>
    </div>
  );
}

export default function NewAdPage() {
  return (
    <Suspense fallback={<p className="text-center text-foreground/40">Loading...</p>}>
      <NewAdContent />
    </Suspense>
  );
}
