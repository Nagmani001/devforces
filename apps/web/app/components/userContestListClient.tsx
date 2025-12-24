"use client";

import UserContest from "@repo/ui/components/userContest";
import { getStatusOfContest, getTimeFromSeconds } from "../config/utils";
import { useRouter } from "next/navigation";
import { ENDED, LIVE, NOT_STARTED } from "@repo/common/consts";

export default function UserContestListClient({ contests }: any) {
  const router = useRouter();
  return <div className="flex flex-col gap-6">
    {contests.contests.contests.map((x: any) => {
      const duration = getTimeFromSeconds(x.duration);
      const contestStatus = getStatusOfContest(x.startsAt, x.duration);
      return contestStatus.status == NOT_STARTED ? <UserContest
        key={x.id}
        title={x.title}
        status={NOT_STARTED}
        subtitle={x.subtitle}
        duration={duration}
        challengeCount={x._count.challenges}
        startTimeLabel={contestStatus.startsAtMessage}
        onClick={() => {
          alert("notify them");
        }}
      /> : contestStatus.status == LIVE ? <UserContest
        key={x.id}
        title={x.title}
        subtitle={x.subtitle}
        status={LIVE}
        duration={duration}
        challengeCount={x._count.challenges}
        onClick={() => {
          router.push(`/contest/${x.id}`)
        }}
      /> : <UserContest
        key={x.id}
        title={x.title}
        status={ENDED}
        subtitle={x.subtitle}
        duration={duration}
        challengeCount={x._count.challenges}
        onClick={() => {
          alert("see leaderboard");
        }}
      />
    })}
  </div>
}
