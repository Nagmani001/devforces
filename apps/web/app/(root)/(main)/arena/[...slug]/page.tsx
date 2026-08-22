import { getChallengeDetails } from "@/app/config/session";
import { NotionAPI } from 'notion-client'
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

  const recordMap = await notion.getPage(challenge.data?.data.challenge.notionLink);
  return <ArenaPage recordMap={recordMap} challengeId={challengeId} baseGithubUrl={challenge.data!.data.challenge.baseGithubUrl} contestId={contestId} title={challenge.data?.data.challenge.title} />
}
