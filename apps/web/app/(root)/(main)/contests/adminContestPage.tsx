"use client"

import { PaginationComponent } from "@repo/ui/components/paginatioComponent";
import DeleteContestDialog from "@repo/ui/components/deleteContest";
import { Button } from "@repo/ui/components/button";
import { AdminContestCard } from "@repo/ui/components/adminContest";
import { Input } from "@repo/ui/components/input";
import { Filter, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { getStatusOfContest, getTimeFromSeconds } from "@/app/config/utils";
import { useState } from "react";
import { LIVE, NOT_STARTED } from "@repo/common/consts";

export default function AdminContestPage({ contests }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const router = useRouter();

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contest Management</h1>
          <p className="text-muted-foreground mt-2 text-base">Create and manage your coding contests.</p>
        </div>
        <Button onClick={() => {
          router.push("/createContest");
        }} size="lg" className="w-full md:w-auto shadow-lg hover:shadow-xl transition-all gap-2">
          <Plus className="w-5 h-5" />
          Create New Contest
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 z-10" />
            <Input
              type="text"
              placeholder="Search by name or test title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 h-10 border border-input rounded-md bg-background ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="all">Running</option>
              <option value="pending">Ended</option>
              <option value="graded">NotStarted</option>
            </select>
          </div>
        </div>
      </div>


      {/* Content */}
      <div className="flex flex-col gap-6">

        <div className="flex flex-col gap-6">

          {contests.map((x: any) => {
            const duration = getTimeFromSeconds(x.duration);
            const contestStatus = getStatusOfContest(x.startsAt, x.duration);
            console.log("from adminContese", x.title);
            return contestStatus.status == NOT_STARTED
              ? <AdminContestCard
                id={x.id}
                key={x.id}
                title={x.title}
                subtitle={x.subtitle}
                duration={duration}
                status="upcoming"
                isLive={false}
                isContestEnded={false}
                challengeCount={x._count.challenges}
                startTimeLabel={contestStatus.startsAtMessage}
                onUpdate={() => {
                  router.push(`/updateContest/${x.id}`)
                }}
                deleteDialogTrigger={
                  <DeleteContestDialog
                    contestName={x.title}
                    onDelete={async () => {
                      // Add your delete API call here
                      console.log("Deleting contest:", x.id);
                    }}
                    trigger={
                      <Button onClick={() => {
                        console.log(x);
                      }} size="sm" variant="destructive">
                        Delete
                      </Button>
                    }
                  />
                }
                onSeeResult={() => {
                  alert("see result");
                }}
              /> : contestStatus.status == LIVE
                ? <AdminContestCard
                  id={x.id}
                  key={x.id}
                  title={x.title}
                  subtitle={x.subtitle}
                  duration={duration}
                  isLive={true}
                  isContestEnded={false}
                  status="running"
                  challengeCount={x._count.challenges}
                  onSeeResult={() => {
                    alert("see result");
                  }}
                /> : <AdminContestCard
                  id={x.id}
                  key={x.id}
                  title={x.title}
                  subtitle={x.subtitle}
                  duration={duration}
                  isLive={false}
                  isContestEnded={true}
                  status="ended"
                  challengeCount={x._count.challenges}
                  onSeeResult={() => {
                    alert("see result");
                  }}
                />
          })}
        </div>
        <PaginationComponent />
      </div>
    </div>
  );
}
