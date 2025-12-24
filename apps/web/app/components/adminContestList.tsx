import { getContest } from "../config/utils";
import AdminContestListClient from "./adminContestListClient";

export default async function AdminContestList({ token }: {
  token: string
}) {
  const contests = await getContest(token, "1");

  return <div className="flex flex-col gap-6">
    <AdminContestListClient contests={contests} />
  </div>

}
