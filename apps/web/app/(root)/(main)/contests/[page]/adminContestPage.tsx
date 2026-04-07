import ContestHeader from "@/app/components/contestHeader";
import ContestSearchAndFilter from "@/app/components/contestSearchAndFilter";
import { Suspense } from "react";
import CardListSkeleton from "@/app/components/cardListSkeleton";
import AdminContestList from "@/app/components/adminContestList";
import { PaginationComponent } from "@/app/components/PaginationControls";
import { BASE_URL, getPageNumbers } from "@/app/config/utils";
import axios from "axios";

export default async function AdminContestPage({ token, page }: {
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
      <ContestHeader />

      <ContestSearchAndFilter />

      <Suspense fallback={<CardListSkeleton />}>
        <AdminContestList token={token} page={page} />
      </Suspense>
      <div className="flex flex-col gap-6">
        <PaginationComponent pageArr={pageArr} />
      </div>
    </div>
  );
}
