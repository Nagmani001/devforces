import { BASE_URL, getStatusOfContest } from "@/app/config/utils";
import { authedGet } from "@/app/config/session";
import { ENDED, LIVE } from "@repo/common/consts";
import LeaderboardEnded from "./leaderboardEnded";
import LeaderboardLive from "./leaderboardLive";

export default async function Page({
  params,
}: {
  params: Promise<{ contestId: string }>
}) {
  const { contestId } = await params
  const contest = await authedGet(`${BASE_URL}/api/user/contest/${contestId}`);
  const startsAt = contest.data.contest.startsAt;
  const duration = contest.data.contest.duration;
  const contestStatus = getStatusOfContest(startsAt, duration);


  if (contestStatus.status == LIVE) {
    const leaderboard = await authedGet(`${BASE_URL}/api/leaderboard/live/${contestId}`);
    return <div>
      <LeaderboardLive contestId={contestId} initialData={leaderboard.data} />
    </div>
  } else if (contestStatus.status == ENDED) {
    const leaderboard = await authedGet(`${BASE_URL}/api/leaderboard/stale/${contestId}`);
    return <div>
      <LeaderboardEnded initialData={leaderboard.data} />
    </div>
  }

  return <div className="mx-auto max-w-3xl px-4 py-10 text-slate-200">Leaderboard will be available when the contest starts.</div>
}
