
"use client";

import { cn } from "../lib/utils";
import { Radio, Star } from "lucide-react";

// ================= Types =================

export type ProblemSubmission = {
  time: string; // e.g. "0:02:59"
  attempts: number; // e.g. -1, -2 for failed attempts
  status: "solved" | "attempted" | "not_attempted";
};

export type LeaderboardRow = {
  rank: number;
  username: string;
  avatar?: string;
  score: number;
  penalty: number;
  problems: Record<string, ProblemSubmission>; // e.g. { A: { time: "0:02:59", attempts: -1, status: "solved" } }
};

export type ProblemHeader = {
  id: string;
  title?: string;
  solved: number;
  total: number;
};

export type LeaderboardPayload = {
  mode: "live" | "static";
  updatedAt: string;
  problems: ProblemHeader[];
  rows: LeaderboardRow[];
};

// ================= Helpers =================

function ProblemCell({ submission, compact = false }: { submission?: ProblemSubmission; compact?: boolean }) {
  if (!submission || submission.status === "not_attempted") {
    return <div className={cn("h-full w-full bg-[#1a2840]", compact ? "min-h-[44px]" : "min-h-[60px]")} />;
  }

  // VJudge uses a consistent bright green for solved problems
  const bgColor = submission.status === "solved"
    ? "bg-[#2d7738]"
    : "bg-[#4a5568]";

  return (
    <div className={cn("h-full w-full flex flex-col items-center justify-center transition-colors", compact ? "min-h-[44px] py-2" : "min-h-[60px] py-3", bgColor)}>
      <span className={cn("font-medium text-white", compact ? "text-xs" : "text-sm")}>{submission.time}</span>
      {submission.attempts !== 0 && (
        <span className="text-xs text-red-300 font-medium">({submission.attempts})</span>
      )}
    </div>
  );
}

// ================= Component =================

export default function LeaderboardPage({ data, compact = false }: { data: LeaderboardPayload; compact?: boolean }) {
  const problems = data.problems;
  const rows = data.rows;

  return (
    <div className={cn("w-full", compact ? "px-0 py-0" : "max-w-7xl mx-auto px-4 py-6")}>
      <div className={cn(
        "flex flex-col gap-1 text-gray-200 sm:flex-row sm:items-end sm:justify-between",
        compact ? "border-b border-[#1e3a5f] bg-[#0f1f36] px-3 py-2" : "mb-4"
      )}>
        <div>
          <div className="flex items-center gap-2">
            <h1 className={cn("font-semibold", compact ? "text-sm" : "text-2xl")}>Leaderboard</h1>
            {data.mode === "live" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                </span>
                Live
              </span>
            )}
          </div>
          <p className={cn("text-gray-400", compact ? "text-xs" : "text-sm")}>
            {data.mode === "live" ? "Updates as submissions finish." : "Final frozen standings."}
          </p>
        </div>
        <p className="flex items-center gap-1 text-xs text-gray-400">
          {data.mode === "live" && <Radio className="h-3 w-3 text-emerald-300" />}
          Updated {new Date(data.updatedAt).toLocaleString()}
        </p>
      </div>
      <div className={cn(
        "overflow-x-auto border border-[#1e3a5f] bg-[#0f1f36]",
        compact ? "rounded-none border-x-0 border-t-0" : "rounded-lg"
      )}>
        <table className="w-full border-collapse text-sm">
          {/* Header */}
          <thead>
            <tr className="border-b border-[#1e3a5f] bg-[#1a2f4a]">
              <th className={cn("border-r border-[#1e3a5f] text-left font-semibold text-gray-200", compact ? "min-w-[60px] px-3 py-2" : "min-w-[80px] px-6 py-3")}>
                Rank
              </th>
              <th className={cn("border-r border-[#1e3a5f] text-left font-semibold text-gray-200", compact ? "min-w-[150px] px-3 py-2" : "min-w-[200px] px-6 py-3")}>
                Team
              </th>
              <th className={cn("border-r border-[#1e3a5f] text-center font-semibold text-gray-200", compact ? "min-w-[70px] px-3 py-2" : "min-w-[80px] px-6 py-3")}>
                Score
              </th>
              <th className={cn("border-r border-[#1e3a5f] text-center font-semibold text-gray-200", compact ? "min-w-[80px] px-3 py-2" : "min-w-[100px] px-6 py-3")}>
                Penalty
              </th>
              {problems.map((problem) => (
                <th
                  key={problem.id}
                  className={cn("border-r border-[#1e3a5f] text-center font-semibold text-gray-200 last:border-r-0", compact ? "min-w-[90px] px-3 py-2" : "min-w-[120px] px-4 py-3")}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className={cn("font-bold", compact ? "text-sm" : "text-base")}>{problem.id}</span>
                    {problem.title && <span className={cn("truncate text-xs font-normal text-gray-300", compact ? "max-w-16" : "max-w-24")}>{problem.title}</span>}
                    <span className="text-xs font-normal text-gray-400">
                      {problem.solved} / {problem.total}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4 + problems.length} className="px-6 py-10 text-center text-gray-400">
                  No submissions yet.
                </td>
              </tr>
            )}
            {rows.map((row, idx) => (
              <tr
                key={row.rank}
                className={cn(
                  "border-b border-[#1e3a5f] transition-colors hover:bg-[#1a2f4a]/50",
                  idx % 2 === 0 ? "bg-[#152840]" : "bg-[#0f1f36]"
                )}
              >
                {/* Rank */}
                <td className={cn("border-r border-[#1e3a5f] text-center font-semibold text-gray-200", compact ? "px-3 py-2" : "px-6 py-3")}>
                  {row.rank}
                </td>

                {/* Team/Username */}
                <td className={cn("border-r border-[#1e3a5f]", compact ? "px-3 py-2" : "px-6 py-3")}>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-gray-400" />
                    {row.avatar && (
                      <img
                        src={row.avatar}
                        alt={row.username}
                        className="h-6 w-6 rounded-full"
                      />
                    )}
                    <span className="text-gray-200 font-medium">{row.username}</span>
                  </div>
                </td>

                {/* Score */}
                <td className={cn("border-r border-[#1e3a5f] text-center font-semibold text-gray-200", compact ? "px-3 py-2" : "px-6 py-3")}>
                  {row.score}
                </td>

                {/* Penalty */}
                <td className={cn("border-r border-[#1e3a5f] text-center font-semibold text-gray-200", compact ? "px-3 py-2" : "px-6 py-3")}>
                  {row.penalty}
                </td>

                {/* Problem cells */}
                {problems.map((problem) => (
                  <td
                    key={problem.id}
                    className="border-r border-[#1e3a5f] p-0 last:border-r-0"
                  >
                    <ProblemCell submission={row.problems[problem.id]} compact={compact} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className={cn("flex flex-wrap text-sm text-gray-300", compact ? "gap-3 border-t border-[#1e3a5f] bg-[#0f1f36] px-3 py-3" : "mt-6 gap-6")}>
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 rounded bg-[#2d7738]" />
          <span>Solved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 rounded bg-[#4a5568]" />
          <span>Attempted (Failed)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 rounded bg-[#1a2840]" />
          <span>Not Attempted</span>
        </div>
      </div>
    </div>
  );
}
