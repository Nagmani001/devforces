import axios from "axios";
import { BASE_URL, getStatusOfContest } from "@/app/config/utils";
import { cookies } from "next/headers";
import { ENDED, LIVE } from "@repo/common/consts";
import LeaderboardEnded from "./leaderboardEnded";
import LeaderboardLive from "./leaderboardLive";

export default async function Page({
  params,
}: {
  params: Promise<{ contestId: string }>
}) {
  const { contestId } = await params
  const token = (await cookies()).get("token")?.value;
  const contest = await axios.get(`${BASE_URL}/api/user/contest/${contestId}`, {
    headers: {
      Authorization: token
    }
  });
  const startsAt = contest.data.contest.startsAt;
  const duration = contest.data.contest.duration;
  const contestStatus = getStatusOfContest(startsAt, duration);


  if (contestStatus.status == LIVE) {
    return <div>
      <LeaderboardLive />
    </div>
  } else if (contestStatus.status == ENDED) {
    return <div>
      <LeaderboardEnded />
    </div>
  }
}
