"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { useUserInfo } from "@/app/hooks/useUser";
import { BASE_URL } from "@/app/config/utils";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  MapPin,
  Calendar,
  Pencil,
  Trophy,
  Target,
  TrendingUp,
  Award,
} from "lucide-react";

type ProfileData = {
  user: {
    id: string;
    username: string;
    email: string;
    imageUrl: string | null;
    isAdmin: boolean;
    description: string;
    location: string;
    skills: string[];
    joinedAt: string;
  };
  stats: {
    contestsAttended: number;
    challengesSolved: number;
    globalRank: number;
  };
  streak: {
    currentStreak: number;
    longestStreak: number;
    activity: { date: string; count: number }[];
  };
  recentActivity: {
    type: string;
    challenge: string;
    contest: string;
    createdAt: string;
  }[];
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

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

function heatColor(count: number) {
  if (count === 0) return "bg-muted";
  if (count <= 2) return "bg-emerald-200 dark:bg-emerald-900";
  if (count <= 5) return "bg-emerald-400 dark:bg-emerald-700";
  if (count <= 9) return "bg-emerald-500 dark:bg-emerald-600";
  return "bg-emerald-600 dark:bg-emerald-400";
}

function buildWeeks(activity: { date: string; count: number }[]) {
  const byDate = new Map(activity.map((a) => [a.date, a.count]));
  const weeks: { date: string; count: number }[][] = [];
  const today = new Date();
  const totalWeeks = 52;
  const days = [];

  const start = new Date(today);
  start.setDate(start.getDate() - totalWeeks * 7 + 6 - ((start.getDay() + 6) % 7));

  for (let i = 0; i < totalWeeks * 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    if (d > today) break;
    days.push({ date: toDateKey(d), count: byDate.get(toDateKey(d)) ?? 0 });
  }

  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export default function ProfilePage() {
  const user = useUserInfo();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/profile/me`, { withCredentials: true });
      setProfile(res.data);
    } catch (err) {
      console.error("failed to load profile", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const username = profile?.user.username ?? user.data?.username ?? "you";
  const joinedAt = profile?.user.joinedAt ? new Date(profile.user.joinedAt) : null;

  const stats = [
    { label: "Contests Attended", value: profile?.stats.contestsAttended ?? 0, icon: Trophy },
    { label: "Challenges Solved", value: profile?.stats.challengesSolved ?? 0, icon: Target },
    { label: "Global Rank", value: profile?.stats.globalRank ? `#${profile.stats.globalRank}` : "—", icon: TrendingUp },
  ];

  const weeks = profile ? buildWeeks(profile.streak.activity) : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-muted text-foreground font-bold text-3xl shrink-0 ring-4 ring-background border border-border">
              {profile?.user.imageUrl ? (
                <img
                  src={profile.user.imageUrl}
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
                {profile?.user.isAdmin && (
                  <Badge variant="default" className="gap-1">
                    <Award className="h-3 w-3" /> Admin
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
                {profile?.user.description || "No description yet."}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {profile?.user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {profile.user.location}
                  </span>
                )}
                {joinedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Joined {MONTHS[joinedAt.getMonth()]}{" "}
                    {joinedAt.getFullYear()}
                  </span>
                )}
              </div>
              {profile?.user.skills.length ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {profile.user.skills.map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
            <Button variant="outline" size="sm" className="self-start gap-2" asChild>
              <a href="/settings">
                <Pencil className="h-4 w-4" /> Edit Profile
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
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
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading activity...</div>
          ) : (
            <>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-muted-foreground">
                  Current streak:{" "}
                  <span className="font-semibold text-foreground">
                    {profile?.streak.currentStreak ?? 0} day{(profile?.streak.currentStreak ?? 0) === 1 ? "" : "s"}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  Longest streak:{" "}
                  <span className="font-semibold text-foreground">
                    {profile?.streak.longestStreak ?? 0} day{(profile?.streak.longestStreak ?? 0) === 1 ? "" : "s"}
                  </span>
                </span>
              </div>
              <div className="flex gap-1 overflow-x-auto pb-2">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-1 shrink-0">
                    {week.map((day) => (
                      <div
                        key={day.date}
                        title={`${day.count} submission${day.count === 1 ? "" : "s"} on ${day.date}`}
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
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {loading ? (
            <div className="text-sm text-muted-foreground py-4">Loading activity...</div>
          ) : profile?.recentActivity.length ? (
            profile.recentActivity.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-3 border-b last:border-0"
              >
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                  <Target className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground">
                    Submitted{" "}
                    <span className="font-medium text-primary">{item.challenge}</span> in{" "}
                    {item.contest}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelative(item.createdAt)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground py-4">
              No recent activity yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
