import { getChallengesForContest } from "@/app/config/utils"
import { cookies } from "next/headers";
import Challenges from "./challenges";

export default async function Page({
  params,
}: {
  params: Promise<{ contestId: string }>
}) {
  const { contestId } = await params
  const token = (await cookies()).get("token")?.value;
  if (!token) return;

  const challenges = await getChallengesForContest(contestId, token);
  return <div>
    <Challenges challenges={challenges.challenges} />
  </div>
}
