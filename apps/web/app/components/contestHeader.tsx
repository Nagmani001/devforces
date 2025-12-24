import { Button } from "@repo/ui/components/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function ContestHeader() {
  return <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Contest Management</h1>
      <p className="text-muted-foreground mt-2 text-base">Create and manage your coding contests.</p>
    </div>
    <Button asChild size="lg" className="w-full md:w-auto shadow-lg hover:shadow-xl gap-2">
      <Link href="/createContest">
        <Plus className="w-5 h-5" />
        Create New Contest
      </Link>
    </Button>
  </div>
}
