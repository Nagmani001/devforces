import { PaginationComponent } from "@repo/ui/components/paginatioComponent";
import ContestHeader from "@/app/components/contestHeader";
import ContestSearchAndFilter from "@/app/components/contestSearchAndFilter";
import { Suspense } from "react";
import CardListSkeleton from "@/app/components/cardListSkeleton";
import UserContestList from "@/app/components/userContestList";

export default function UserContestPage({ token }: {
  token: string
}) {

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
      <ContestHeader />
      <ContestSearchAndFilter />

      <Suspense fallback={<CardListSkeleton />}>
        <UserContestList token={token} />
      </Suspense>

      <div className="flex flex-col gap-6">
        <PaginationComponent />
      </div>
    </div >
  );
}
