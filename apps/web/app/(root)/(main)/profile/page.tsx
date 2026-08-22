"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { useUserInfo } from "@/app/hooks/useUser";
import {
  MapPin,
  Calendar,
  Pencil,
  Trophy,
  Target,
  Zap,
  Code2,
  Star,
  Award,
  TrendingUp,
} from "lucide-react";

const TECH_INTERESTS = [
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Rust",
  "Go",
  "PostgreSQL",
  "Docker",
  "AWS",
  "GraphQL",
];

const STATS = [
  { label: "Rating", value: "1842", icon: Zap },
  { label: "Global Rank", value: "#127", icon: TrendingUp },
  { label: "Contests", value: "42", icon: Trophy },
  { label: "Problems Solved", value: "318", icon: Target },
];

const ACTIVITY = [
  {
    icon: Target,
    text: "Solved",
    highlight: "Merge Two Sorted Lists",
    meta: "2 hours ago · Easy · 2 submissions",
  },
  {
    icon: Trophy,
    text: "Ranked #3 in",
    highlight: "Weekly Contest #58",
    meta: "Yesterday · 4/4 problems · +58 rating",
  },
  {
    icon: Code2,
    text: "Solved",
    highlight: "LRU Cache",
    meta: "2 days ago · Medium · 1 submission",
  },
  {
    icon: Star,
    text: "Earned badge",
    highlight: "Speed Demon",
    meta: "3 days ago · solved a problem in under 5 minutes",
  },
  {
    icon: Trophy,
    text: "Joined",
    highlight: "Devforces Arena #12",
    meta: "5 days ago · finished 8th of 64",
  },
];

function seededCount(i: number) {
  const x = Math.sin(i + 1) * 10000;
  return x - Math.floor(x);
}

function generateHeatmap() {
  const weeks: { count: number; date: string }[][] = [];
  const today = new Date();
  const totalWeeks = 37;
  const days = [];

  const start = new Date(today);
  start.setDate(start.getDate() - totalWeeks * 7 + 6 - ((start.getDay() + 6) % 7));

  for (let i = 0; i < totalWeeks * 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    if (d > today) break;
    const r = seededCount(i);
    const streakBoost = Math.floor(i / 40) * 0.15;
    const count =
      r < 0.28 - streakBoost * 0.2
        ? 0
        : r < 0.55
          ? Math.floor(r * 5)
          : Math.floor(r * 14);
    days.push({ count, date: d.toDateString() });
  }

  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

function heatColor(count: number) {
  if (count === 0) return "bg-muted";
  if (count <= 2) return "bg-emerald-200 dark:bg-emerald-900";
  if (count <= 5) return "bg-emerald-400 dark:bg-emerald-700";
  if (count <= 9) return "bg-emerald-500 dark:bg-emerald-600";
  return "bg-emerald-600 dark:bg-emerald-400";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ProfilePage() {
  const user = useUserInfo();
  const heatmap = generateHeatmap();
  const username = user.data?.username ?? "you";
  const joinYear = 2024;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-muted text-foreground font-bold text-3xl shrink-0 ring-4 ring-background border border-border">
              {user.data?.imageUrl ? (
                <img
                  src={user.data.imageUrl}
                  alt={username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{username.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{username}</h1>
                {user.data?.isAdmin && (
                  <Badge variant="default" className="gap-1">
                    <Award className="h-3 w-3" /> Admin
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
                Full-stack developer who loves competitive programming. Currently
                grinding graph problems and building side projects with Rust and
                TypeScript. Open to contests any time.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> Bengaluru, India
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Joined {MONTHS[2]} {joinYear}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {TECH_INTERESTS.map((tech) => (
                  <Badge key={tech} variant="secondary">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
            <Button variant="outline" size="sm" className="self-start gap-2">
              <Pencil className="h-4 w-4" /> Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-1 overflow-x-auto pb-2">
            {heatmap.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1 shrink-0">
                {week.map((day) => (
                  <div
                    key={day.date}
                    title={`${day.count} submissions on ${day.date}`}
                    className={`h-3 w-3 rounded-sm ${heatColor(day.count)}`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="h-3 w-3 rounded-sm bg-muted" />
            <div className="h-3 w-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
            <div className="h-3 w-3 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
            <div className="h-3 w-3 rounded-sm bg-emerald-500 dark:bg-emerald-600" />
            <div className="h-3 w-3 rounded-sm bg-emerald-600 dark:bg-emerald-400" />
            <span>More</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {ACTIVITY.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 py-3 border-b last:border-0"
            >
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                <item.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-foreground">
                  {item.text}{" "}
                  <span className="font-medium text-primary">
                    {item.highlight}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">{item.meta}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
