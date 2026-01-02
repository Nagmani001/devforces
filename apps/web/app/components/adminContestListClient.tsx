"use client";

import { useAtomValue } from "jotai";
import { searchFilter, searchInput } from "../atom";
import { AdminContestCard } from "@repo/ui/components/challengesCard";
import { deleteContest, getStatusOfContest, getTimeFromSeconds } from "../config/utils";
import DeleteContestDialog from "@repo/ui/components/deleteContest";
import { Button } from "@repo/ui/components/button";
import { ENDED, LIVE, NOT_STARTED } from "@repo/common/consts";
import { useRouter } from "next/navigation";

export default function AdminContestListClient({ contests }: any) {

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
        return <AdminContestCard
          id={x.id}
          key={x.id}
          title={x.title}
          subtitle={x.subtitle}
          duration={duration}
          status="upcoming"
          isLive={false}
          challengeCount={x._count.challenges}
          startTimeLabel={contestStatus.startsAtMessage}
          onUpdate={() => {
            router.push(`/updateContest/${x.id}`)
          }}
          deleteDialogTrigger={
            <DeleteContestDialog
              contestName={x.title}
              onDelete={async () => {
                const response = await deleteContest(x.id, localStorage.getItem("token")!);
                if (response.success) {
                  router.refresh();
                }
              }}
              trigger={
                <Button size="sm" variant="destructive">
                  Delete
                </Button>
              }
            />
          }
          onSeeResult={() => {
            alert("see result");
          }}
        />
      } else if (contestStatus.status == LIVE && (filter == LIVE || filter == "ALL")) {
        return <AdminContestCard
          id={x.id}
          key={x.id}
          title={x.title}
          subtitle={x.subtitle}
          duration={duration}
          isLive={true}
          status="running"
          challengeCount={x._count.challenges}
          onSeeResult={() => {
            router.push(`/liveLeaderboard/${x.id}`);
          }}
        />

      } else if (contestStatus.status == ENDED && (filter == ENDED || filter == "ALL")) {
        return <AdminContestCard
          id={x.id}
          key={x.id}
          title={x.title}
          subtitle={x.subtitle}
          duration={duration}
          isLive={false}
          status="ended"
          challengeCount={x._count.challenges}
          onSeeResult={() => {
            router.push(`/leaderboard/${x.id}`);
          }}
        />

      }
    })}
  </div>
}
