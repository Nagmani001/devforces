import { getContest } from "../config/utils";
import UserContestListClient from "./userContestListClient";

export default async function UserContestList({ token }: {
  token: string
}) {
  const contests = await getContest(token, "1");

  return <div className="flex flex-col gap-6">
    <UserContestListClient contests={contests} />
  </div>

}
