import ContestHeader from "@/app/components/contestHeader";
import { PaginationComponent } from "@/app/components/PaginationControls";
import ContestSearchAndFilter from "@/app/components/contestSearchAndFilter";
import { Suspense } from "react";
import CardListSkeleton from "@/app/components/cardListSkeleton";
import UserContestList from "@/app/components/userContestList";
import axios from "axios";
import { BASE_URL, getPageNumbers } from "@/app/config/utils";

export default async function UserContestPage({ token, page }: {
  token: string,
  page: string
}) {

  const total = await axios.get(`${BASE_URL}/api/user/contest/totalPages`, {
    headers: {
      Authorization: token
    }

  });

  //@ts-ignore
  const pageArr = getPageNumbers(parseInt(page), total.data.total);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
      <ContestHeader />
      <ContestSearchAndFilter />

      <Suspense fallback={<CardListSkeleton />}>
        <UserContestList token={token} page={page} />
      </Suspense>

      <div className="flex flex-col gap-6">
        <PaginationComponent pageArr={pageArr} />
      </div>
    </div >
  );
}
