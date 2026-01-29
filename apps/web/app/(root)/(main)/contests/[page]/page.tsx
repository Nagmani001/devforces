import { getUserInfo } from "@/app/config/utils";
import { cookies } from "next/headers";
import AdminContestPage from "./adminContestPage";
import UserContestPage from "./userContestPage";

export default async function Page({
  params,
}: {
  params: Promise<{ page: string }>
}) {
  const { page } = await params;
  const token = (await cookies()).get("token")?.value;
  if (!token) return <div>
    token not found
  </div>;


  const me = await getUserInfo(token);
  console.log("ouput of me ", me);

  if (me.data.isAdmin) {
    return <AdminContestPage token={token} page={page} />
  } else {
    return <UserContestPage token={token} page={page} />
  }
}
