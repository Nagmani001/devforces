import { getContest } from "@/app/config/utils";
import AdminContestPage from "./adminContestPage";
import UserContestPage from "./userContestPage";
import { cookies } from "next/headers";

export default async function Page() {
  const token = (await cookies()).get("token")?.value;
  if (!token) return;
  const contests = await getContest(token, "1");
  if (contests.success && contests.isAdmin) {
    return <AdminContestPage contests={contests.contests.contests} />
  } else {
    return <UserContestPage contests={contests.contests.contests} />
  }
}
