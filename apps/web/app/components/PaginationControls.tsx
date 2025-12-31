"use client";

import { useParams } from 'next/navigation';
import { BASE_FRONTEND_URL } from "../config/utils";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./pagination";

export function PaginationComponent({ pageArr }: any) {
  const params = useParams<{ tag: string; item: string }>()
  return (
    <Pagination>
      <PaginationContent>
        <PaginationPrevious
          // @ts-ignore
          href={`${BASE_FRONTEND_URL}/contests/${(parseInt(params.page) - 1) == 0 ? "1" : (parseInt(params.page) - 1).toString()}`} />
        {pageArr.map((page: any, idx: any) => {
          return (
            < PaginationItem key={idx} >
              {page === "..." ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  href={`/contests/${page}`}
                  //@ts-ignore
                  isActive={page === parseInt(params.page)}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          )
        })}
        <PaginationNext
          // @ts-ignore
          href={`${BASE_FRONTEND_URL}/contests/${(parseInt(params.page) + 1) == (parseInt(pageArr[pageArr.length - 1]) + 1) ? parseInt(pageArr[pageArr.length - 1]).toString() : (parseInt(params.page) + 1)}`} />
      </PaginationContent>
    </Pagination >
  )
}
