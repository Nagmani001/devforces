import Leaderboard from "../../leaderboard/[contestId]/leaderboardClient"

export default async function Page({
  params,
}: {
  params: Promise<{ contestId: string }>
}) {
  const { contestId } = await params
  return <div>
    <Leaderboard />
  </div>
}
