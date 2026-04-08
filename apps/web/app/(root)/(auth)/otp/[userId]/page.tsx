import OtpClient from "./otpPageClient"

export default async function Page({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  return <div>
    <OtpClient userId={userId} />
  </div>
}
