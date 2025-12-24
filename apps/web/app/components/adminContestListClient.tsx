"use client";

import { AdminContestCard } from "@repo/ui/components/challengesCard";
import { getStatusOfContest, getTimeFromSeconds } from "../config/utils";
import DeleteContestDialog from "@repo/ui/components/deleteContest";
import { Button } from "@repo/ui/components/button";
import { LIVE, NOT_STARTED } from "@repo/common/consts";
import { useRouter } from "next/navigation";

export default function AdminContestListClient({ contests }: any) {
  const router = useRouter();

  return <div className="flex flex-col gap-6">
    {contests.contests.contests.map((x: any) => {
      const duration = getTimeFromSeconds(x.duration);
      const contestStatus = getStatusOfContest(x.startsAt, x.duration);


      return contestStatus.status == NOT_STARTED
        ? <AdminContestCard
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
                //TODO: make this a mutation in react query
                //@ts-ignore
                const value = await deleteContest(x.id, localStorage.getItem("token"));
                //             if (value.success) { router.refresh() }
              }}
              trigger={
                <Button onClick={() => {

                }} size="sm" variant="destructive">
                  Delete
                </Button>
              }
            />
          }
          onSeeResult={() => {
            alert("see result");
          }}
        /> : contestStatus.status == LIVE
          ? <AdminContestCard
            id={x.id}
            key={x.id}
            title={x.title}
            subtitle={x.subtitle}
            duration={duration}
            isLive={true}
            status="running"
            challengeCount={x._count.challenges}
            onSeeResult={() => {
              alert("see result");
            }}
          /> : <AdminContestCard
            id={x.id}
            key={x.id}
            title={x.title}
            subtitle={x.subtitle}
            duration={duration}
            isLive={false}
            status="ended"
            challengeCount={x._count.challenges}
            onSeeResult={() => {
              alert("see result");
            }}
          />
    })}
  </div>
}
