import OtpClient from "./otpPageClient"

export default async function Page({
  params,
}: {
  params: Promise<{ email: string }>
}) {
  const { email } = await params

  return <div>
    <OtpClient email={decodeURIComponent(email)} />
  </div>
}
