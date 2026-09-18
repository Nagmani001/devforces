
import { BASE_URL } from "@/app/config/utils";
import { authedGet } from "@/app/config/session";
import LeaderboardLive from "../../leaderboard/[contestId]/leaderboardLive";

export default async function Page({
  params,
}: {
  params: Promise<{ contestId: string }>
}) {
  const { contestId } = await params;
  const leaderboard = await authedGet(`${BASE_URL}/api/leaderboard/live/${contestId}`);

  return <LeaderboardLive contestId={contestId} initialData={leaderboard.data} />;
}
