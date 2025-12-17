"use client"

import { useState } from "react";
import LabelWithInput from "@repo/ui/components/labbledInput";
import { Plus, Trash2, FileText, Clock, Calendar, GitBranch } from "lucide-react";

type Challenge = {
  id: string;
  title: string;
  notionLink: string;
  testFileName: string;
  totalTestCases: number | "";
  dockerCompose: string;
  startupScript: string;
};

const emptyChallenge = (): Challenge => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
  title: "",
  notionLink: "",
  testFileName: "",
  totalTestCases: "",
  dockerCompose:
    `version: "3.8"
services:
  db:
    image: postgres
    restart: always
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    ports:
      - "5432:5432"`,
  startupScript: `# Example startup script
# 1. Start services
# 2. Run migrations
# 3. Run tests
`,
});

export default function CreateContest() {
  const [contestTitle, setContestTitle] = useState("");
  const [totalTimeHours, setTotalTimeHours] = useState<number | "">("");
  const [totalTimeMinutes, setTotalTimeMinutes] = useState<number | "">("");
  const [startsAt, setStartsAt] = useState("");
  const [baseRepo, setBaseRepo] = useState("");
  const [challenges, setChallenges] = useState<Challenge[]>([emptyChallenge()]);

  // Add / remove challenges
  const addChallenge = () => setChallenges((s) => [...s, emptyChallenge()]);
  const removeChallenge = (id: string) =>
    setChallenges((s) => s.filter((c) => c.id !== id));

  // Update single challenge field
  const updateChallenge = <K extends keyof Challenge>(
    id: string,
    field: K,
    value: Challenge[K]
  ) =>
    setChallenges((s) =>
      s.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // final payload shape (example)
    const payload = {
      title: contestTitle,
      totalTime: {
        hours: totalTimeHours || 0,
        minutes: totalTimeMinutes || 0,
      },
      startsAt,
      baseRepo,
      challenges,
    };
    console.log("Submit contest payload:", payload);
    // user-specified: implement submission later
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-slate-900 mb-1">Create Contest</h1>
          <p className="text-sm text-slate-600">Set up a new coding contest with challenges and configurations</p>
        </div>

        {/* Basic Info Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
          <div className="flex items-start justify-between gap-6">
            <LabelWithInput
              label="Contest Title"
              value={contestTitle}
              onChange={(e) => setContestTitle(e.target.value)}
              placeholder="Enter contest title"
              icon={<FileText className="w-5 h-5" />}
              required
              className="flex-1"
            />

            {/* Total time box */}
            <div className="w-52">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Total Duration
                </div>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={totalTimeHours}
                  onChange={(e) =>
                    setTotalTimeHours(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-20 text-center rounded-lg border border-slate-300 px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all bg-white"
                  placeholder="0"
                />
                <span className="text-sm text-slate-600">h</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={totalTimeMinutes}
                  onChange={(e) =>
                    setTotalTimeMinutes(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-20 text-center rounded-lg border border-slate-300 px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all bg-white"
                  placeholder="0"
                />
                <span className="text-sm text-slate-600">m</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LabelWithInput
              label="Start Time"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              placeholder="e.g. 2025-12-24T10:00"
              icon={<Calendar className="w-5 h-5" />}
            />

            <LabelWithInput
              label="Base Repository"
              value={baseRepo}
              onChange={(e) => setBaseRepo(e.target.value)}
              placeholder="git@github.com:org/repo or https://..."
              icon={<GitBranch className="w-5 h-5" />}
            />
          </div>
        </div>

        {/* Challenges Section */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Challenges</h2>
              <p className="text-sm text-slate-600 mt-0.5">{challenges.length} challenge{challenges.length !== 1 ? 's' : ''} configured</p>
            </div>
            <button
              type="button"
              onClick={addChallenge}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Challenge
            </button>
          </div>

          <div className="space-y-6">
            {challenges.map((ch, idx) => (
              <div
                key={ch.id}
                className="relative border border-slate-200 rounded-lg p-6 bg-slate-50"
              >
                {/* Remove button */}
                {challenges.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeChallenge(ch.id)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-red-600 transition-colors"
                    title="Remove challenge"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}

                {/* Challenge number badge */}
                <div className="mb-5">
                  <span className="inline-block bg-slate-900 text-white px-3 py-1 rounded-md text-sm font-medium">
                    Challenge {idx + 1}
                  </span>
                </div>

                {/* Challenge fields */}
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <LabelWithInput
                      label="Challenge Title"
                      value={ch.title}
                      onChange={(e) => updateChallenge(ch.id, "title", e.target.value)}
                      placeholder="e.g. Sorting Algorithm"
                    />

                    <LabelWithInput
                      label="Notion Documentation Link"
                      value={ch.notionLink}
                      onChange={(e) => updateChallenge(ch.id, "notionLink", e.target.value)}
                      placeholder="https://www.notion.so/..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-2">
                      <LabelWithInput
                        label="Test File Path"
                        value={ch.testFileName}
                        onChange={(e) => updateChallenge(ch.id, "testFileName", e.target.value)}
                        placeholder="e.g. tests/test_example.py"
                      />
                    </div>

                    <LabelWithInput
                      label="Total Test Cases"
                      type="number"
                      value={ch.totalTestCases}
                      onChange={(e) =>
                        updateChallenge(
                          ch.id,
                          "totalTestCases",
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      placeholder="0"
                      min={0}
                    />
                  </div>

                  <LabelWithInput
                    label="Docker Compose Configuration"
                    type="textarea"
                    value={ch.dockerCompose}
                    onChange={(e) => updateChallenge(ch.id, "dockerCompose", e.target.value)}
                    rows={8}
                  />

                  <LabelWithInput
                    label="Test Startup Script"
                    type="textarea"
                    value={ch.startupScript}
                    onChange={(e) => updateChallenge(ch.id, "startupScript", e.target.value)}
                    rows={6}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Ready to create <strong className="text-slate-900">{challenges.length}</strong> challenge{challenges.length !== 1 ? 's' : ''}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={addChallenge}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Add Another Challenge
            </button>

            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
            >
              Create Contest
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
