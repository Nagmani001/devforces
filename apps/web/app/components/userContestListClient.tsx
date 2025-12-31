"use client";

import UserContest from "@repo/ui/components/userContest";
import { getStatusOfContest, getTimeFromSeconds } from "../config/utils";
import { useRouter } from "next/navigation";
import { ENDED, LIVE, NOT_STARTED } from "@repo/common/consts";
import { useAtomValue } from "jotai";
import { searchFilter, searchInput } from "../atom";

export default function UserContestListClient({ contests }: any) {
  const router = useRouter();

  const search = useAtomValue(searchInput);
  const filter = useAtomValue(searchFilter);


  const filteredContest = contests.contests.contests.filter((x: any) => {
    if ((x.title.includes(search) || x.subtitle.includes(search))) {
      return true;
    } else {
      return false;
    }
  });


  return <div className="flex flex-col gap-6">
    {filteredContest.map((x: any) => {
      const duration = getTimeFromSeconds(x.duration);
      const contestStatus = getStatusOfContest(x.startsAt, x.duration);

      if (contestStatus.status == NOT_STARTED && (filter == NOT_STARTED || filter == "ALL")) {
        return <UserContest
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
        />
      } else if (contestStatus.status == LIVE && (filter == LIVE || filter == "ALL")) {
        return <UserContest
          key={x.id}
          title={x.title}
          subtitle={x.subtitle}
          status={LIVE}
          duration={duration}
          challengeCount={x._count.challenges}
          onClick={() => {
            router.push(`/contest/${x.id}`)
          }}
        />
      } else if (contestStatus.status == ENDED && (filter == ENDED || filter == "ALL")) {
        return <UserContest
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

      }

    })}
  </div>
}
