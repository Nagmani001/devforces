"use client"
//TODO: make sure user is not giving you date time of an old event , you validate that and show it to user 
//TODO: optimize this page , use mutation , invalidate query for getting contest
//TODO: get rid of unncecessay rerenders 
//TODO: i don't think there is any next js specific optimizations but consider that as well 

import { DatePicker } from "@repo/ui/components/datePicker";
import { useState } from "react";
import LabelWithInput from "@repo/ui/components/labbledInput";
import { Plus, Trash2, FileText, Clock } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import TimePicker from "@repo/ui/components/timePicker";
import { Challenge } from "../config/types";
import { BASE_URL, buildISTDate, emptyChallenge, getTimeInNumbers } from "../config/utils";
import axios from "axios";


export default function CreateContest() {
  const [contestTitle, setContestTitle] = useState("");
  const [contestSubtitle, setContestSubtitle] = useState("");
  const [totalTimeHours, setTotalTimeHours] = useState<number>(0);
  const [totalTimeMinutes, setTotalTimeMinutes] = useState<number>(0);
  const [challenges, setChallenges] = useState<Challenge[]>([emptyChallenge()]);
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [time, setTime] = useState("");

  const year = date?.getFullYear()!;
  const monthIndex = date?.getMonth()!;
  const day = date?.getDate()!;
  const actualTime = getTimeInNumbers(time);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualTime?.hour || !actualTime.minute || !actualTime.second) {
      alert('hi')
    }

    //@ts-ignore
    const date = buildISTDate(year, monthIndex, day, actualTime.hour, actualTime.minute, actualTime.second);
    const payload = {
      title: contestTitle,
      subTitle: contestSubtitle,
      duration: (totalTimeHours * 60 * 60) + (totalTimeMinutes * 60),
      //      startsAt: new Date(year, monthIndex, day, actualTime?.hour, actualTime?.minute, actualTime?.second),
      startsAt: date,
      challenges,
    };
    try {
      await axios.post(`${BASE_URL}/api/admin/contest/create`, {
        title: payload.title,
        subtitle: payload.subTitle,
        duration: payload.duration, // seconds
        startsAt: payload.startsAt,
        challenges: payload.challenges.map(x => {
          return {
            title: x.title,
            notionLink: x.notionLink,
            baseGithubUrl: x.baseGithubUrl,
            testFile: x.testFile,
            totalTestCases: x.totalTestCases,
          }
        })
      }, {
        headers: {
          Authorization: localStorage.getItem("token"),
        }
      });
      alert("Success");
    } catch (err) {
      alert("something went wrong");
      console.log(err);

    }
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
          <div className="flex items-start gap-6">
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
            <div className="w-52 flex-shrink-0">
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
                      Number(e.target.value)
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
                      Number(e.target.value)
                    )
                  }
                  className="w-20 text-center rounded-lg border border-slate-300 px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all bg-white"
                  placeholder="0"
                />
                <span className="text-sm text-slate-600">m</span>
              </div>
            </div>
          </div>

          <LabelWithInput
            label="Contest Description"
            type="textarea"
            value={contestSubtitle}
            onChange={(e) => setContestSubtitle(e.target.value)}
            placeholder="Enter a brief description of the contest..."
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DatePicker date={date} setDate={setDate} />
            <TimePicker onChange={(e: any) => {
              setTime(e.target.value);
            }} />
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
                    className="absolute cursor-pointer right-4 top-4 text-slate-400 hover:text-red-600 transition-colors"
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
                        label="Test File"
                        type="textarea"
                        value={ch.testFile}
                        onChange={(e) => updateChallenge(ch.id, "testFile", e.target.value)}
                        placeholder="e.g. tests/index.test.ts"
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
                    label="Base Github Url"
                    value={ch.baseGithubUrl}
                    onChange={(e) => updateChallenge(ch.id, "baseGithubUrl", e.target.value)}
                    placeholder="https://github.com/Nagmani001"
                  />

                  <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-5">
                    <h3 className="flex items-center gap-2 text-blue-900 font-semibold text-sm mb-4">
                      <FileText className="w-4 h-4" />
                      Repository Requirements
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex gap-3 text-sm text-blue-900/80">
                        <div className="bg-blue-100/50 p-1 rounded-md h-fit">
                          <span className="w-4 h-4 block font-bold text-center leading-4 text-blue-700">1</span>
                        </div>
                        <div>
                          <span className="font-semibold text-blue-900 block mb-0.5">Base Repository</span>
                          Create a public GitHub repository containing your challenge code.
                        </div>
                      </li>
                      <li className="flex gap-3 text-sm text-blue-900/80">
                        <div className="bg-blue-100/50 p-1 rounded-md h-fit">
                          <span className="w-4 h-4 block font-bold text-center leading-4 text-blue-700">2</span>
                        </div>
                        <div>
                          <span className="font-semibold text-blue-900 block mb-0.5">Docker Configuration</span>
                          Include a <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-800 text-xs">Dockerfile</code> for your service and a <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-800 text-xs">docker-compose.yml</code> that defines the service and any dependencies.
                        </div>
                      </li>
                      <li className="flex gap-3 text-sm text-blue-900/80">
                        <div className="bg-blue-100/50 p-1 rounded-md h-fit">
                          <span className="w-4 h-4 block font-bold text-center leading-4 text-blue-700">3</span>
                        </div>
                        <div>
                          <span className="font-semibold text-blue-900 block mb-0.5">Health Check</span>
                          Expose a <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-800 text-xs">GET /</code> endpoint that returns a 200 OK status to verify service health.
                        </div>
                      </li>
                      <li className="flex gap-3 text-sm text-blue-900/80">
                        <div className="bg-blue-100/50 p-1 rounded-md h-fit">
                          <span className="w-4 h-4 block font-bold text-center leading-4 text-blue-700">4</span>
                        </div>
                        <div>
                          <span className="font-semibold text-blue-900 block mb-0.5">Tests</span>
                          Paste your test code in the <strong>Test File</strong> field above. Do not rely on tests inside the repository.
                        </div>
                      </li>
                    </ul>
                  </div>
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
            <Button variant="secondary"
              type="button"
              onClick={addChallenge}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Add Another Challenge
            </Button>

            <Button
              type="submit"
            >
              Create Contest
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
