"use client"
import LeaderboardPage, { type LeaderboardPayload } from "@repo/ui/components/leaderboardComponent";

export default function LeaderboardEnded({ initialData }: { initialData: LeaderboardPayload }) {
  return <LeaderboardPage data={initialData} />
}
