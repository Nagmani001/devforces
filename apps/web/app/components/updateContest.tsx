"use client"
//TODO: make sure user is not giving you date time of an old event , you validate that and show it to user 
//TODO: optimize this page , use mutation , invalidate query for getting contest
//TODO: get rid of unncecessay rerenders 
//TODO: i don't think there is any next js specific optimizations but consider that as well 

import { DatePicker } from "@repo/ui/components/datePicker";
import { Challenge } from "@repo/common/typescript-types";
import { useEffect, useState } from "react";
import LabelWithInput from "@repo/ui/components/labbledInput";
import { Plus, Trash2, FileText, Clock } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import TimePicker from "@repo/ui/components/timePicker";
import { BASE_URL_CLIENT, buildISTDate, calculateDiffOfContest, emptyChallenge, getContestForUpdate, getHourAndMinutesFromduration, getTimeInNumbers } from "../config/utils";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";


export default function UpdateContest({ contestId }: {
  contestId: string
}) {
  const [contestTitle, setContestTitle] = useState("");
  const [contestSubtitle, setContestSubtitle] = useState("");
  const [totalTimeHours, setTotalTimeHours] = useState<number>(0);
  const [totalTimeMinutes, setTotalTimeMinutes] = useState<number>(0);
  const [challenges, setChallenges] = useState<Challenge[]>([emptyChallenge()]);
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [time, setTime] = useState("");
  const router = useRouter();

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

  useEffect(() => {
    const fetchContestDetails = async () => {
      //@ts-ignore
      const contests = await getContestForUpdate(contestId, localStorage.getItem("token"));
      const actualContest = contests.contests?.data.contests;

      const { hour, minutes } = getHourAndMinutesFromduration(actualContest.duration);
      setContestTitle(actualContest.title);
      setContestSubtitle(actualContest.subtitle);
      setTotalTimeHours(hour);
      setTotalTimeMinutes(minutes);
      setChallenges(actualContest.challenges.map((x: any) => {
        return {
          id: x.id,
          title: x.title,
          notionLink: x.notionLink,
          baseGithubUrl: x.baseGithubUrl,
          testFile: x.testFile,
          totalTestCases: x.totalTestCases,
        }
      }));

      let date = new Date(actualContest.startsAt);
      setDate(date);
      setTime(`${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`)
    }
    fetchContestDetails();
  }, []);
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
      const data = {
        title: payload.title,
        subtitle: payload.subTitle,
        duration: payload.duration, // seconds
        startsAt: payload.startsAt,
        challenges: payload.challenges.map(x => {
          return {
            id: x.id,
            title: x.title,
            notionLink: x.notionLink,
            baseGithubUrl: x.baseGithubUrl,
            testFile: x.testFile,
            totalTestCases: x.totalTestCases,
          }
        })
      }
      calculateDiffOfContest(data, data);
      await axios.put(`${BASE_URL_CLIENT}/api/admin/contest/update/${contestId}`, {
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
      toast.success("updated Contest successfully");
      router.push("/contests/1");

    } catch (err) {
      toast.error("Error while updating contest");
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-foreground mb-1">Update Contest</h1>
          <p className="text-sm text-muted-foreground">Set up a new coding contest with challenges and configurations</p>
        </div>

        {/* Basic Info Card */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
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
              <label className="block text-sm font-medium text-foreground mb-2">
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
                  className="w-20 text-center rounded-lg border border-input px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring transition-all bg-background text-foreground"
                  placeholder="0"
                />
                <span className="text-sm text-muted-foreground">h</span>
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
                  className="w-20 text-center rounded-lg border border-input px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring transition-all bg-background text-foreground"
                  placeholder="0"
                />
                <span className="text-sm text-muted-foreground">m</span>
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
            <TimePicker
              value={time}
              onChange={(e: any) => {
                setTime(e.target.value);
              }} />
          </div>
        </div>

        {/* Challenges Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Challenges</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{challenges.length} challenge{challenges.length !== 1 ? 's' : ''} configured</p>
            </div>
            <button
              type="button"
              onClick={addChallenge}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Challenge
            </button>
          </div>

          <div className="space-y-6">
            {challenges.map((ch, idx) => (
              <div
                key={ch.id}
                className="relative border border-border rounded-lg p-6 bg-muted/50"
              >
                {/* Remove button */}
                {challenges.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeChallenge(ch.id)}
                    className="absolute cursor-pointer right-4 top-4 text-muted-foreground hover:text-destructive transition-colors"
                    title="Remove challenge"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}

                {/* Challenge number badge */}
                <div className="mb-5">
                  <span className="inline-block bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-medium">
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
                        value={ch.testFile}
                        onChange={(e) => updateChallenge(ch.id, "testFile", e.target.value)}
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

                    <div className="md:col-span-3">
                      <LabelWithInput
                        label="Base Github Url"
                        value={ch.baseGithubUrl}
                        onChange={(e) => updateChallenge(ch.id, "baseGithubUrl", e.target.value)}
                        placeholder="https://github.com/Nagmani001"
                      />
                    </div>

                    <div className="md:col-span-3 mt-2 bg-primary/5 border border-primary/20 rounded-xl p-6">
                      <h3 className="flex items-center gap-2 text-primary font-semibold text-base mb-5">
                        <div className="bg-primary/10 p-1.5 rounded-lg">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        Repository Requirements
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex gap-4 bg-background/60 backdrop-blur-sm rounded-lg p-4 border border-border">
                          <div className="bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                          <div>
                            <span className="font-semibold text-foreground block mb-1">Base Repository</span>
                            <p className="text-sm text-muted-foreground leading-relaxed">Create a public GitHub repository containing your challenge code.</p>
                          </div>
                        </div>
                        <div className="flex gap-4 bg-background/60 backdrop-blur-sm rounded-lg p-4 border border-border">
                          <div className="bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                          <div>
                            <span className="font-semibold text-foreground block mb-1">Docker Configuration</span>
                            <p className="text-sm text-muted-foreground leading-relaxed">Include a <code className="bg-muted px-1.5 py-0.5 rounded text-foreground text-xs font-medium">Dockerfile</code> and <code className="bg-muted px-1.5 py-0.5 rounded text-foreground text-xs font-medium">docker-compose.yml</code>.</p>
                          </div>
                        </div>
                        <div className="flex gap-4 bg-background/60 backdrop-blur-sm rounded-lg p-4 border border-border">
                          <div className="bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                          <div>
                            <span className="font-semibold text-foreground block mb-1">Health Check</span>
                            <p className="text-sm text-muted-foreground leading-relaxed">Expose a <code className="bg-muted px-1.5 py-0.5 rounded text-foreground text-xs font-medium">GET /</code> endpoint returning 200 OK.</p>
                          </div>
                        </div>
                        <div className="flex gap-4 bg-background/60 backdrop-blur-sm rounded-lg p-4 border border-border">
                          <div className="bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                          <div>
                            <span className="font-semibold text-foreground block mb-1">Tests</span>
                            <p className="text-sm text-muted-foreground leading-relaxed">Paste test code in the <strong className="text-foreground">Test File</strong> field above.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-card border border-border rounded-lg p-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Ready to update <strong className="text-foreground">{challenges.length}</strong> challenge{challenges.length !== 1 ? 's' : ''}
          </div>

          <div className="flex gap-3">
            <Button variant="secondary"
              type="button"
              onClick={addChallenge}
            >
              Add Another Challenge
            </Button>

            <Button
              type="submit"
            >
              Update Contest
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
