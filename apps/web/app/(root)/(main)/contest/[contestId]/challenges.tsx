"use client";
import { ChallengeCard } from "@repo/ui/components/challengesCard";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { Trophy } from "lucide-react";

export default function Challenges({ challenges }: any) {
  console.log(challenges);
  const router = useRouter();
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contest Challenges</h1>
          <p className="text-muted-foreground mt-2 text-base">Complete all challenges to maximize your score.</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-x-5">
          <h2 className="text-xl font-semibold tracking-tight text-foreground/90">Available Challenges</h2>
          <Button
            onClick={() => {
              router.push(`/leaderboard/${challenges.challenges[0].contestId}`)
            }}
            variant="outline"
            size="default"
            className="gap-2 shadow-sm hover:shadow-md transition-all"
          >
            <Trophy className="w-4 h-4" />
            View Leaderboard
          </Button>
        </div>

        <div className="flex flex-col gap-6">
          {challenges.challenges.map((x: any) => {
            if (x.challengeResult) {
              if (x.challengeResult.challengeStatus == "SUBMITTED") {
                return <ChallengeCard
                  id={x.id}
                  key={x.id}
                  title={x.title}
                  totalTestCases={x.totalTestCases}
                  passedTestCases={x.challengeResult.passingTestCases}
                  submitted={true}
                  attempted={true}
                />

              } else if (x.challengeResult.challengeStatus == "ATTEMPTED") {
                return <ChallengeCard
                  id={x.id}
                  key={x.id}
                  title={x.title}
                  totalTestCases={x.totalTestCases}
                  passedTestCases={x.challengeResult.passingTestCases}
                  submitted={false}
                  attempted={true}
                  onStart={() => {
                    router.push(`/arena/${x.id}`)
                  }}
                />
              }
            } else {
              return <ChallengeCard
                id={x.id}
                key={x.id}
                title={x.title}
                totalTestCases={x.totalTestCases}
                submitted={false}
                attempted={false}
                onStart={() => {
                  router.push(`/arena/${x.id}`)
                }}
              />
            }
          })}

          {/*
          <ChallengeCard
            title="complete authentication"
            totalTestCases={10}
            passedTestCases={5}
            submitted={true}
            onView={() => { }}
          />

          <ChallengeCard
            title="complete endpoints for managing quiz"
            totalTestCases={12}
            passedTestCases={8}
            submitted={true}
            onView={() => { }}
          />

          <ChallengeCard
            title="complete endpoints for interacting with quiz"
            totalTestCases={10}
            attempted={true}
            onStart={() => { }}
          />

          <ChallengeCard
            title="final leaderboard endpoints"
            totalTestCases={20}
            attempted={false}
            onStart={() => { }}
          />
          */}
        </div>
      </div>
    </div>
  );
}
