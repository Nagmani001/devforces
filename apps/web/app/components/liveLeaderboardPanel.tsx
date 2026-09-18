"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { BASE_URL } from "@/app/config/utils";
import LeaderboardPage, { type LeaderboardPayload } from "@repo/ui/components/leaderboardComponent";

type LoadState = "loading" | "ready" | "error" | "ended";

export function LiveLeaderboardPanel({ contestId }: { contestId: string }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardPayload | null>(null);
  const [status, setStatus] = useState<LoadState>("loading");

  useEffect(() => {
    let isMounted = true;
    const source = new EventSource(`${BASE_URL}/api/leaderboard/live/${contestId}/stream`, {
      withCredentials: true,
    });

    async function refreshLeaderboard() {
      try {
        const response = await fetch(`${BASE_URL}/api/leaderboard/live/${contestId}`, {
          credentials: "include",
        });

        if (response.status === 409) {
          if (isMounted) setStatus("ended");
          return;
        }

        if (!response.ok) throw new Error("failed to load live leaderboard");

        const data = await response.json();
        if (!isMounted) return;
        setLeaderboard(data);
        setStatus("ready");
      } catch (err) {
        console.error("failed to refresh live leaderboard", err);
        if (isMounted) setStatus("error");
      }
    }

    refreshLeaderboard();

    source.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "connected" || message.type === "leaderboardUpdated") {
          refreshLeaderboard();
        }
      } catch (err) {
        console.error("failed to parse leaderboard event", err);
      }
    };

    source.onerror = () => {
      if (isMounted) setStatus((current) => current === "ready" ? "ready" : "error");
    };

    return () => {
      isMounted = false;
      source.close();
    };
  }, [contestId]);

  return (
    <div className="flex h-full flex-col bg-[#0f1f36] text-slate-100">
      {status === "loading" && (
        <div className="flex items-center gap-2 px-3 py-4 text-xs text-gray-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading live rankings...
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 px-3 py-4 text-xs text-red-300">
          <AlertCircle className="h-3.5 w-3.5" /> Could not load leaderboard.
        </div>
      )}

      {status === "ended" && (
        <div className="px-3 py-4 text-xs text-gray-400">
          This contest has ended. Open the full leaderboard for final standings.
        </div>
      )}

      {status === "ready" && leaderboard && (
        <div className="min-h-0 flex-1 overflow-auto">
          <LeaderboardPage data={leaderboard} compact />
        </div>
      )}
    </div>
  );
}
