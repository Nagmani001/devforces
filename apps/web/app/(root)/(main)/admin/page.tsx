"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { useUserInfo } from "@/app/hooks/useUser";
import { useState } from "react";
import {
  Users,
  Trophy,
  FileCode2,
  Activity,
  Search,
  ShieldAlert,
  MoreHorizontal,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const OVERVIEW = [
  { label: "Total Users", value: "12,483", delta: "+248 this week", icon: Users, up: true },
  { label: "Total Contests", value: "186", delta: "+6 this week", icon: Trophy, up: true },
  { label: "Submissions", value: "94,220", delta: "+1,204 this week", icon: FileCode2, up: true },
  { label: "Active Now", value: "1,048", delta: "24 contests live", icon: Activity, up: false },
];

const RECENT_USERS = [
  { name: "Aarav Sharma", handle: "aarav_s", email: "aarav@example.com", contests: 12, rating: 1720, status: "Active" },
  { name: "Priya Verma", handle: "priya_v", email: "priya@example.com", contests: 8, rating: 1580, status: "Active" },
  { name: "Rohan Gupta", handle: "rohan_g", email: "rohan@example.com", contests: 3, rating: 0, status: "New" },
  { name: "Sneha Patel", handle: "sneha_p", email: "sneha@example.com", contests: 21, rating: 1890, status: "Active" },
  { name: "Kabir Singh", handle: "kabir_s", email: "kabir@example.com", contests: 15, rating: 1430, status: "Suspended" },
  { name: "Ananya Iyer", handle: "ananya_i", email: "ananya@example.com", contests: 6, rating: 1210, status: "Active" },
];

const LIVE_CONTESTS = [
  { title: "Weekly Contest #58", participants: 428, challenges: 4, started: "1h 20m ago", status: "Live" },
  { title: "Devforces Arena #12", participants: 964, challenges: 5, started: "40m ago", status: "Live" },
  { title: "Beginner Sprint #3", participants: 215, challenges: 3, started: "2h 05m ago", status: "Live" },
];

const RECENT_SUBMISSIONS = [
  { user: "aarav_s", challenge: "Merge Two Sorted Lists", verdict: "Accepted", time: "2m ago" },
  { user: "priya_v", challenge: "LRU Cache", verdict: "Accepted", time: "5m ago" },
  { user: "rohan_g", challenge: "Two Sum", verdict: "Wrong Answer", time: "8m ago" },
  { user: "sneha_p", challenge: "Reverse Linked List", verdict: "Accepted", time: "11m ago" },
  { user: "kabir_s", challenge: "Valid Parentheses", verdict: "Compilation Error", time: "14m ago" },
  { user: "ananya_i", challenge: "Two Sum", verdict: "Time Limit Exceeded", time: "17m ago" },
];

export default function AdminPage() {
  const user = useUserInfo();
  const [userQuery, setUserQuery] = useState("");

  if (!user.data?.isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold text-foreground">Access Denied</h1>
        <p className="text-sm text-muted-foreground mt-2">
          You do not have permission to view the admin panel. Contact an administrator if you
          believe this is a mistake.
        </p>
      </div>
    );
  }

  const filteredUsers = RECENT_USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(userQuery.toLowerCase()) ||
      u.handle.toLowerCase().includes(userQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <Badge className="gap-1">
              <ShieldAlert className="h-3 w-3" /> Admin
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of the Devforces platform. Signed in as{" "}
            <span className="font-medium text-foreground">{user.data?.username}</span>.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Create Contest
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {OVERVIEW.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
                <div
                  className={`text-xs mt-0.5 ${stat.up ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
                >
                  {stat.delta}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" /> Live Contests
            </CardTitle>
            <CardDescription>Contests currently running.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {LIVE_CONTESTS.map((c) => (
              <div key={c.title} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{c.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {c.participants} participants · {c.challenges} challenges · started {c.started}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="rounded-full">
                    <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    {c.status}
                  </Badge>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-muted-foreground" /> Recent Submissions
            </CardTitle>
            <CardDescription>Latest activity across the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {RECENT_SUBMISSIONS.map((s) => (
              <div key={`${s.user}-${s.time}`} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <div className="text-sm text-foreground truncate">
                    <span className="font-medium text-primary">{s.user}</span> · {s.challenge}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.time}</div>
                </div>
                {s.verdict === "Accepted" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {s.verdict}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 shrink-0">
                    <XCircle className="h-3.5 w-3.5" /> {s.verdict}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" /> Users
          </CardTitle>
          <CardDescription>Manage registered users.</CardDescription>
          <div className="relative w-full sm:w-72 mt-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
            <Input
              type="text"
              placeholder="Search users..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">User</TableHead>
                <TableHead>Handle</TableHead>
                <TableHead className="text-right">Contests</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.handle}>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-foreground font-bold text-xs shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{u.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">@{u.handle}</TableCell>
                  <TableCell className="text-right tabular-nums">{u.contests}</TableCell>
                  <TableCell className="text-right tabular-nums">{u.rating || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={u.status === "Suspended" ? "destructive" : u.status === "New" ? "secondary" : "default"}>
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${u.name}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No users match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
