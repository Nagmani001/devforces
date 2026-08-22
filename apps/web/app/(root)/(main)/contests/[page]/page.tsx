import { getAuthSession } from "@/app/config/session";
import AdminContestPage from "./adminContestPage";
import UserContestPage from "./userContestPage";

export default async function Page({
  params,
}: {
  params: Promise<{ page: string }>
}) {
  const { page } = await params;
  const session = await getAuthSession();
  if (!session) {
    return <div>
      token not found
    </div>;
  }

  if (session.isAdmin) {
    return <AdminContestPage page={page} />
  } else {
    return <UserContestPage page={page} />
  }
}
