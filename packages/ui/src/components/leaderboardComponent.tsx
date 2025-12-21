
"use client";

import { cn } from "../lib/utils";
import { Star } from "lucide-react";

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
  solved: number;
  total: number;
};

// ================= Helpers =================

function ProblemCell({ submission }: { submission?: ProblemSubmission }) {
  if (!submission || submission.status === "not_attempted") {
    return <div className="h-full w-full bg-[#1a2840] min-h-[60px]" />;
  }

  // VJudge uses a consistent bright green for solved problems
  const bgColor = submission.status === "solved"
    ? "bg-[#2d7738]"
    : "bg-[#4a5568]";

  return (
    <div className={cn("h-full w-full flex flex-col items-center justify-center py-3 min-h-[60px] transition-colors", bgColor)}>
      <span className="text-sm font-medium text-white">{submission.time}</span>
      {submission.attempts !== 0 && (
        <span className="text-xs text-red-300 font-medium">({submission.attempts})</span>
      )}
    </div>
  );
}

// ================= Component =================

export default function LeaderboardPage() {
  const problems: ProblemHeader[] = [
    { id: "A", solved: 15, total: 29 },
    { id: "B", solved: 15, total: 24 },
    { id: "C", solved: 8, total: 10 },
    { id: "D", solved: 5, total: 12 },
    { id: "E", solved: 5, total: 12 },
  ];

  const data: LeaderboardRow[] = [
    {
      rank: 1,
      username: "prsweet",
      score: 5,
      penalty: 187,
      problems: {
        A: { time: "0:02:59", attempts: -1, status: "solved" },
        B: { time: "0:19:10", attempts: -2, status: "solved" },
        C: { time: "0:12:36", attempts: 0, status: "solved" },
        D: { time: "0:24:10", attempts: -1, status: "solved" },
        E: { time: "0:28:28", attempts: -1, status: "solved" },
      },
    },
    {
      rank: 2,
      username: "Deep_",
      score: 5,
      penalty: 350,
      problems: {
        A: { time: "0:49:40", attempts: -1, status: "solved" },
        B: { time: "0:49:53", attempts: -1, status: "solved" },
        C: { time: "0:50:02", attempts: -1, status: "solved" },
        D: { time: "0:53:10", attempts: 0, status: "solved" },
        E: { time: "1:27:52", attempts: 0, status: "solved" },
      },
    },
    {
      rank: 3,
      username: "aeron_agarwal",
      score: 5,
      penalty: 1605,
      problems: {
        A: { time: "0:44:42", attempts: -1, status: "solved" },
        B: { time: "0:49:50", attempts: 0, status: "solved" },
        C: { time: "7:09:34", attempts: 0, status: "solved" },
        D: { time: "8:30:29", attempts: -1, status: "solved" },
        E: { time: "8:50:33", attempts: 0, status: "solved" },
      },
    },
    {
      rank: 4,
      username: "niteshyadav14",
      score: 5,
      penalty: 2349,
      problems: {
        A: { time: "7:09:31", attempts: 0, status: "solved" },
        B: { time: "7:09:50", attempts: 0, status: "solved" },
        C: { time: "7:10:06", attempts: 0, status: "solved" },
        D: { time: "7:44:35", attempts: -1, status: "solved" },
        E: { time: "8:35:21", attempts: -3, status: "solved" },
      },
    },
    {
      rank: 5,
      username: "Warrior07A",
      score: 4,
      penalty: 3317,
      problems: {
        A: { time: "17:05:44", attempts: -1, status: "solved" },
        B: { time: "0:47:54", attempts: 0, status: "solved" },
        C: { time: "17:03:09", attempts: 0, status: "solved" },
        D: { time: "", attempts: -1, status: "attempted" },
        E: { time: "20:00:29", attempts: 0, status: "solved" },
      },
    },
    {
      rank: 6,
      username: "mr_mango",
      score: 3,
      penalty: 599,
      problems: {
        A: { time: "0:13:33", attempts: -2, status: "solved" },
        B: { time: "0:10:31", attempts: 0, status: "solved" },
        C: { time: "8:55:37", attempts: 0, status: "solved" },
        D: { time: "", attempts: -2, status: "attempted" },
        E: { time: "", attempts: -3, status: "attempted" },
      },
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      <div className="overflow-x-auto rounded-lg border border-[#1e3a5f] bg-[#0f1f36]">
        <table className="w-full border-collapse text-sm">
          {/* Header */}
          <thead>
            <tr className="border-b border-[#1e3a5f] bg-[#1a2f4a]">
              <th className="border-r border-[#1e3a5f] px-6 py-3 text-left font-semibold text-gray-200 min-w-[80px]">
                Rank
              </th>
              <th className="border-r border-[#1e3a5f] px-6 py-3 text-left font-semibold text-gray-200 min-w-[200px]">
                Team
              </th>
              <th className="border-r border-[#1e3a5f] px-6 py-3 text-center font-semibold text-gray-200 min-w-[80px]">
                Score
              </th>
              <th className="border-r border-[#1e3a5f] px-6 py-3 text-center font-semibold text-gray-200 min-w-[100px]">
                Penalty
              </th>
              {problems.map((problem) => (
                <th
                  key={problem.id}
                  className="border-r border-[#1e3a5f] px-4 py-3 text-center font-semibold text-gray-200 last:border-r-0 min-w-[120px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-base font-bold">{problem.id}</span>
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
            {data.map((row, idx) => (
              <tr
                key={row.rank}
                className={cn(
                  "border-b border-[#1e3a5f] transition-colors hover:bg-[#1a2f4a]/50",
                  idx % 2 === 0 ? "bg-[#152840]" : "bg-[#0f1f36]"
                )}
              >
                {/* Rank */}
                <td className="border-r border-[#1e3a5f] px-6 py-3 text-center font-semibold text-gray-200">
                  {row.rank}
                </td>

                {/* Team/Username */}
                <td className="border-r border-[#1e3a5f] px-6 py-3">
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
                <td className="border-r border-[#1e3a5f] px-6 py-3 text-center font-semibold text-gray-200">
                  {row.score}
                </td>

                {/* Penalty */}
                <td className="border-r border-[#1e3a5f] px-6 py-3 text-center font-semibold text-gray-200">
                  {row.penalty}
                </td>

                {/* Problem cells */}
                {problems.map((problem) => (
                  <td
                    key={problem.id}
                    className="border-r border-[#1e3a5f] p-0 last:border-r-0"
                  >
                    <ProblemCell submission={row.problems[problem.id]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-300">
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
