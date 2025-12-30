import { getChallengeDetails } from "@/app/config/utils";
import { NotionAPI } from 'notion-client'
import { cookies } from "next/headers";
import ArenaPage from "./arenaPageClient";

export default async function Page({
  params,
}: {
  params: Promise<{ challengeId: string }>
}) {
  const { challengeId } = await params
  const token = (await cookies()).get("token")?.value;
  if (!token) return;

  const notion = new NotionAPI()
  const challenge = await getChallengeDetails(challengeId, token);
  const recordMap = await notion.getPage(challenge.data?.data.challenge.notionLink);
  return <ArenaPage recordMap={recordMap} challengeId={challengeId} />
}
