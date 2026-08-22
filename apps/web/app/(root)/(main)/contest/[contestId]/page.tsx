import { getChallengesForContest } from "@/app/config/session"
import Challenges from "./challenges";

export default async function Page({
  params,
}: {
  params: Promise<{ contestId: string }>
}) {
  const { contestId } = await params

  const challenges = await getChallengesForContest(contestId);
  return <div>
    <Challenges challenges={challenges.challenges} contestId={contestId} />
  </div>
}
