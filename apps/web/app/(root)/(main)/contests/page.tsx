import { getUserInfo } from "@/app/config/utils";
import AdminContestPage from "./adminContestPage";
import UserContestPage from "./userContestPage";
import { cookies } from "next/headers";

export default async function Page() {
  const token = (await cookies()).get("token")?.value;
  if (!token) return;

  const me = await getUserInfo(token);
  if (!me.success) {
    return <div>Something went wrong</div>
  }

  if (me.data.isAdmin) {
    return <AdminContestPage token={token} />
  } else {
    return <UserContestPage token={token} />
  }
}
