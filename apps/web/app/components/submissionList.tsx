"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  CheckCircle2,
  CircleDashed,
  Clock,
  Download,
  History,
  Loader2,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { BASE_URL } from "@/app/config/utils";

export type SubmissionListItem = {
  id: string;
  status: string;
  testCasesPassed: number | null;
  testCasesTotal: number | null;
  createdAt: string;
};

function statusMeta(status: string) {
  switch (status) {
    case "completed":
      return { icon: CheckCircle2, className: "text-green-500", label: "Completed" };
    case "processing":
      return { icon: Loader2, className: "text-blue-400 animate-spin", label: "Running" };
    case "pending":
      return { icon: Clock, className: "text-amber-400", label: "Pending" };
    default:
      return { icon: CircleDashed, className: "text-muted-foreground", label: status };
  }
}

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SubmissionList({
  contestId,
  challengeId,
}: {
  contestId: string;
  challengeId: string;
}) {
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    axios
      .get(`${BASE_URL}/api/submissions/challenge/${challengeId}`, {
        params: { contestId },
        withCredentials: true,
      })
      .then((res) => {
        if (cancelled) return;
        const list: SubmissionListItem[] = res.data?.submissions ?? [];
        list.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setSubmissions(list);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [contestId, challengeId]);

  const handleDownload = useCallback(async (submissionId: string) => {
    setDownloadingId(submissionId);
    try {
      const res = await axios.get(`${BASE_URL}/api/submissions/${submissionId}/downloadUrl`, {
        withCredentials: true,
      });
      const url = res.data?.url;
      if (!url) throw new Error("no download url returned");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("error downloading submission", err);
      alert("Could not download this submission");
    } finally {
      setDownloadingId(null);
    }
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <History className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Submissions</span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-x-3 border-b border-border px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <span>Status</span>
        <span>Result</span>
        <span>When</span>
        <span />
      </div>

      <div className="flex-1 overflow-auto">
        {status === "loading" && (
          <div className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading submissions…
          </div>
        )}

        {status === "error" && (
          <div className="px-3 py-4 text-xs text-red-500">Could not load submissions.</div>
        )}

        {status === "ready" && submissions.length === 0 && (
          <div className="px-3 py-4 text-xs text-muted-foreground">
            No submissions yet. Submit a solution to see it here.
          </div>
        )}

        {status === "ready" &&
          submissions.map((submission, index) => {
            const meta = statusMeta(submission.status);
            const Icon = meta.icon;
            const isDownloading = downloadingId === submission.id;
            return (
              <div
                key={submission.id}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-x-3 border-b border-border/60 px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-2 text-xs">
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${meta.className}`} />
                  <span className="truncate font-medium">
                    #{submissions.length - index} · {meta.label}
                  </span>
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {submission.testCasesPassed ?? 0}/{submission.testCasesTotal ?? 0}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatWhen(submission.createdAt)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  title="Download code"
                  onClick={() => handleDownload(submission.id)}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            );
          })}
      </div>
    </div>
  );
}