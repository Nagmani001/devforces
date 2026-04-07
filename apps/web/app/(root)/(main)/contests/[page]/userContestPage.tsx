import { PaginationComponent } from "@/app/components/PaginationControls";
import ContestSearchAndFilter from "@/app/components/contestSearchAndFilter";
import { Suspense } from "react";
import CardListSkeleton from "@/app/components/cardListSkeleton";
import UserContestList from "@/app/components/userContestList";
import axios from "axios";
import { BASE_URL, getPageNumbers } from "@/app/config/utils";

import UserContestHeader from "@/app/components/userContestHeader";

export default async function UserContestPage({ token, page }: {
  token: string,
  page: string
}) {

  const total = await axios.get(`${BASE_URL}/api/admin/contest/totalPages`, {
    headers: {
      Authorization: token
    }
  });

  //@ts-ignore
  const pageArr = getPageNumbers(parseInt(page), total.data.total);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
      <UserContestHeader />
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
