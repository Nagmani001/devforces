import { getContest } from "../config/session";
import UserContestListClient from "./userContestListClient";

export default async function UserContestList({ page }: {
  page: string
}) {
  const contests = await getContest(page);

  return <div className="flex flex-col gap-6">
    <UserContestListClient contests={contests} />
  </div>

}
