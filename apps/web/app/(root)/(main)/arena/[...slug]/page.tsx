import { getChallengeDetails } from "@/app/config/session";
import { NotionAPI } from 'notion-client'
import { notFound } from "next/navigation";
import ArenaPage from "./arenaPageClient";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const contestId = slug[0];
  const challengeId = slug[1];

  const notion = new NotionAPI()
  const challenge = await getChallengeDetails(challengeId);

  if (!challenge.success || !challenge.data?.data?.challenge) {
    notFound();
  }

  const challengeData = challenge.data.data.challenge;
  const recordMap = await notion.getPage(challengeData.notionLink);
  return <ArenaPage recordMap={recordMap} challengeId={challengeId} baseGithubUrl={challengeData.baseGithubUrl} contestId={contestId} title={challengeData.title} />
}
