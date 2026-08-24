"use client";

import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { useUserInfo } from "@/app/hooks/useUser";
import { BASE_URL } from "@/app/config/utils";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Loader2, Code2 } from "lucide-react";

type Submission = {
  id: string;
  challenge: string;
  contest: string;
  status: "pending" | "processing" | "completed";
  submittedAt: string;
};

const STATUSES = ["All", "pending", "processing", "completed"] as const;

const STATUS_STYLES: Record<Submission["status"], { label: string; className: string; dot: string }> = {
  pending: { label: "Pending", className: "text-muted-foreground", dot: "bg-muted-foreground" },
  processing: { label: "Processing", className: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500 animate-pulse" },
  completed: { label: "Completed", className: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
};

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function SubmissionsPage() {
  const user = useUserInfo();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("All");

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/submissions/`, { withCredentials: true });
      setSubmissions(res.data?.submissions ?? []);
    } catch (err) {
      console.error("failed to load submissions", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = status === "All" ? submissions : submissions.filter((s) => s.status === status);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Submissions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {submissions.length} total · for{" "}
            <span className="font-medium text-foreground">{user.data?.username ?? "you"}</span>
          </p>
        </div>
      </div>

      <Card className="p-0">
        <CardContent className="px-4 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <label htmlFor="status-filter" className="text-sm font-medium text-foreground shrink-0">
            Status
          </label>
          <select
            id="status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}
            className="w-full sm:w-48 pl-3 pr-8 h-9 border border-input rounded-md bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card className="p-0 overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-base">Submission History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading submissions...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Code2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">
                {submissions.length === 0
                  ? "You haven't made any submissions yet."
                  : "No submissions match this status."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Challenge</TableHead>
                  <TableHead>Contest</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => {
                  const style = STATUS_STYLES[s.status];
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="pl-6 font-medium text-foreground">
                        {s.challenge}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{s.contest}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-2 font-medium ${style.className}`}>
                          <span className={`inline-block h-2 w-2 rounded-full ${style.dot}`} />
                          {style.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6 text-muted-foreground">
                        {formatRelative(s.submittedAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
