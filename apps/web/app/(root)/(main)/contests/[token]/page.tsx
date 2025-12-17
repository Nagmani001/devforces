import { getCourses } from "@/app/config/utils";
import AdminContestPage from "./adminContestPage";
import UserContestPage from "./userContestPage";
import { cookies } from "next/headers";


export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const cook = await cookies();
  console.log(cook);
  const { token } = await params;
  const courses = await getCourses(token, "1");

  if (courses.isAdmin) {
    return <AdminContestPage contest={courses.courses} />
  } else {
    return <UserContestPage contest={courses.courses} />
  }
}
