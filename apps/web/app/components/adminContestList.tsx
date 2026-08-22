import { getContest } from "../config/session";
import AdminContestListClient from "./adminContestListClient";

export default async function AdminContestList({ page }: {
  page: string
}) {

  const contests = await getContest(page);

  return <div className="flex flex-col gap-6">
    <AdminContestListClient contests={contests} />
  </div>

}
