import { getContest } from "../config/utils";
import AdminContestListClient from "./adminContestListClient";

export default async function AdminContestList({ token, page }: {
  token: string,
  page: string
}) {
  const contests = await getContest(token, page);

  return <div className="flex flex-col gap-6">
    <AdminContestListClient contests={contests} />
  </div>

}
