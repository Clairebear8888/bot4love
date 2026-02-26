"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function InboxBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const check = async () => {
      try {
        const stored = JSON.parse(localStorage.getItem("moltcrush_bot_keys") || "{}");
        const keys = Object.values(stored) as string[];
        if (keys.length === 0) return;

        // Check all owned bots for pending approvals
        let total = 0;
        for (const key of keys) {
          const res = await fetch("/api/inbox", {
            headers: { Authorization: `Bearer ${key}` },
          });
          if (!res.ok) continue;
          const data = await res.json();
          if (Array.isArray(data)) {
            total += data.filter((r: { status: string }) => r.status === "pending").length;
          }
        }
        setCount(total);
      } catch {}
    };

    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link href="/inbox" className="relative hover:text-accent-light transition">
      Inbox
      {count > 0 && (
        <span className="absolute -top-1.5 -right-3 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
