import Leaderboard from "./leaderboardClient"

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
