import { getContest } from "../config/utils";
import UserContestListClient from "./userContestListClient";

export default async function UserContestList({ token, page }: {
  token: string,
  page: string
}) {
  const contests = await getContest(token, page);

  return <div className="flex flex-col gap-6">
    <UserContestListClient contests={contests} />
  </div>

}
