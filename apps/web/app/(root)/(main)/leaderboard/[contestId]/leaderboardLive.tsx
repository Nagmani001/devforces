"use client"
import { useEffect, useState } from "react";
import LeaderboardPage, { type LeaderboardPayload } from "@repo/ui/components/leaderboardComponent";
import { BASE_URL } from "@/app/config/utils";

export default function LeaderboardLive({ contestId, initialData }: { contestId: string; initialData: LeaderboardPayload }) {
  const [leaderboard, setLeaderboard] = useState(initialData);

  useEffect(() => {
    let isMounted = true;
    const source = new EventSource(`${BASE_URL}/api/leaderboard/live/${contestId}/stream`, {
      withCredentials: true,
    });

    async function refreshLeaderboard() {
      const response = await fetch(`${BASE_URL}/api/leaderboard/live/${contestId}`, {
        credentials: "include",
      });
      if (!response.ok) return;
      const data = await response.json();
      if (isMounted) setLeaderboard(data);
    }

    source.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "leaderboardUpdated") refreshLeaderboard();
    };

    return () => {
      isMounted = false;
      source.close();
    };
  }, [contestId]);

  return <LeaderboardPage data={leaderboard} />
}
