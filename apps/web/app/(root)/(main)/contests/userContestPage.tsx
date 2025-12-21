"use client";
import UserContest from "@repo/ui/components/userContest";
import { PaginationComponent } from "@repo/ui/components/paginatioComponent";
import { useRouter } from "next/navigation";
import { Filter, Search } from "lucide-react";
import { Input } from "@repo/ui/components/input";
import { useState } from "react";
import { getStatusOfContest, getTimeFromSeconds } from "@/app/config/utils";

export default function UserContestPage({ contests }: any) {

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const router = useRouter();
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Explore Contests</h1>
          <p className="text-muted-foreground mt-2 text-base">Join challenges to test your Development skills.</p>
        </div>
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
            return <UserContest
              key={x.id}
              title={x.title}
              subtitle={x.subtitle}
              duration={duration}
              //Fill in the blanks
              startTimeLabel="Starts at 7:30 pm"
              isContestStarted={false}

              challengeCount={x._count.challenges}
              onClick={() => {
                router.push(`/contest/${x.id}`)
              }}
            />
          })}
          {/*
          <UserContest
            id={1}
            title="Build a HTTP Backend for a Quiz Platform"
            subtitle="Backend Development"
            duration="2 hours"
            startTimeLabel="Starts at 7:30 pm"
            isContestStarted={false}
            challengeCount={4}
            variant="default"
            onClick={() => console.log('open contest 1')}
          />

          <UserContest
            id={2}
            title="Build a Websocket Server for Chat App"
            subtitle="Realtime Systems"
            duration="2 hours"
            startTimeLabel="Start now"
            isContestStarted={true}
            isLive={true}
            challengeCount={6}
            variant="default"
            onClick={() => console.log('open contest 2')}
          />

          <UserContest
            id={3}
            title="Weekly Algorithm Challenge #42"
            subtitle="Data Structures & Algorithms"
            duration="1.5 hours"
            startTimeLabel="Starts Tomorrow, 8:00 PM"
            isContestStarted={false}
            challengeCount={5}
            variant="default"
            onClick={() => console.log('open contest 3')}
          />

*/}
        </div>
        <PaginationComponent />
      </div>
    </div>
  );
}
