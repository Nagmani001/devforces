"use client"
import { Input } from "@repo/ui/components/input";
import { Filter, Search } from "lucide-react";
import { searchFilter, searchInput } from "../atom";
import { useAtom } from "jotai";
import { ENDED, LIVE, NOT_STARTED } from "@repo/common/consts";

export default function ContestSearchAndFilter() {
  const [input, setInput] = useAtom(searchInput);
  const [filter, setFilter] = useAtom(searchFilter);

  return <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border p-6">
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 z-10" />
        <Input
          type="text"
          placeholder="Search by name or test title..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="pl-10 h-10"
        />
      </div>

      {/* Status Filter */}
      <div className="relative">
        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-10 pr-8 h-10 border border-input rounded-md bg-background ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option defaultChecked value="ALL">All</option>
          <option value={LIVE}>Running</option>
          <option value={ENDED}>Ended</option>
          <option value={NOT_STARTED}>NotStarted</option>
        </select>
      </div>
    </div>
  </div>
}
