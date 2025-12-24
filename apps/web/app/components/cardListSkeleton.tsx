import { ContestCardSkeleton } from "@repo/ui/components/contestCardSkeleton"

export default function CardListSkeleton() {
  return <div className="flex flex-col gap-6">
    {[0, 1, 2].map(x => {
      return <ContestCardSkeleton key={x} />
    })}
  </div>
}
