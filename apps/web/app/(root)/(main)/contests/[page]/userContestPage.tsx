import { PaginationComponent } from "@/app/components/PaginationControls";
import ContestSearchAndFilter from "@/app/components/contestSearchAndFilter";
import { Suspense } from "react";
import CardListSkeleton from "@/app/components/cardListSkeleton";
import UserContestList from "@/app/components/userContestList";
import { getPageNumbers } from "@/app/config/utils";
import { BASE_URL } from "@/app/config/utils";
import { authedGet } from "@/app/config/session";

import UserContestHeader from "@/app/components/userContestHeader";

export default async function UserContestPage({ page }: {
  page: string
}) {

  const total = await authedGet(`${BASE_URL}/api/user/contest/totalPages`);

  //@ts-ignore
  const pageArr = getPageNumbers(parseInt(page), total.data.total);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
      <UserContestHeader />
      <ContestSearchAndFilter />

      <Suspense fallback={<CardListSkeleton />}>
        <UserContestList page={page} />
      </Suspense>

      <div className="flex flex-col gap-6">
        <PaginationComponent pageArr={pageArr} />
      </div>
    </div >
  );
}
