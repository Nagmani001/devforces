export default async function Page({
  params,
}: {
  params: Promise<{ challengeId: string }>
}) {
  const { challengeId } = await params
  return <div>hi ser</div>
}
