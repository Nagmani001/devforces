import UpdateContest from "@/app/components/updateContest";

export default async function Page({
  params,
}: {
  params: Promise<{ contestId: string }>
}) {
  const { contestId } = await params
  return <div><UpdateContest contestId={contestId} /></div>
}
