"use client";
import { Clock, Play, Calendar } from "lucide-react";
import { Card, CardContent } from "./card";
import { LIVE, NOT_STARTED, ENDED } from "@repo/common/consts";
import { Badge } from "./badge";
import { Button } from "./button";

export type ContestCardProps = {
  id?: string | number;
  title: string;
  subtitle?: string;
  duration?: string;
  challengeCount?: number;
  status: string;
  startTimeLabel?: string;
  rightText?: string;

  onClick?: () => void;
  variant?: "default" | "outline" | "compact";
  className?: string;
};

export default function UserContest({
  id,
  title,
  subtitle,
  duration,
  status,
  startTimeLabel,
  challengeCount = 0,
  onClick,
  variant = "default",
  rightText,
  className = "",
}: ContestCardProps) {
  const rootClasses = [
    "w-full",
    "rounded-2xl",
    "border",
    "p-4",
    "transition-shadow",
    "hover:shadow-lg",
    "flex",
    "items-center",
    "justify-between",
    className,
  ];

  if (variant === "outline") {
    rootClasses.push("bg-transparent", "border-neutral-300/40");
  } else if (variant === "compact") {
    rootClasses.push("p-3", "rounded-xl");
  } else {
    // default
    rootClasses.push("bg-white/3", "backdrop-blur-sm");
  }

  // small helpers
  const renderMeta = () => (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      {duration && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="whitespace-nowrap">{duration}</span>
        </div>
      )}

      {typeof challengeCount === "number" && (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="whitespace-nowrap">{challengeCount} challenge{challengeCount === 1 ? '' : 's'}</span>
        </div>
      )}
    </div>
  );

  return (
    <Card className={rootClasses.join(" ")} onClick={onClick}>
      <CardContent className="flex w-full items-center gap-4 p-0">
        {/* Left column: title + meta */}
        <div className="flex flex-1 flex-col gap-1 px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col">
              <h3 className="text-lg font-medium leading-tight">{title}</h3>
              {subtitle && (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>

            {/* Right side: status / start time */}
            <div className="flex flex-col items-end justify-center gap-2">
              {status == LIVE ?
                <Badge className="rounded-full px-3 py-1">Live</Badge>
                : status == NOT_STARTED ?
                  <span className="text-sm text-muted-foreground whitespace-nowrap">{startTimeLabel}</span>
                  :
                  <Badge className="rounded-full px-3 py-1">Ended</Badge>
              }

              {rightText && (
                <div className="text-sm font-medium text-muted-foreground">{rightText}</div>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            {renderMeta()}

            <div className="flex items-center gap-2">
              {/* action button — style depends on started state */}
              <Button size="sm" variant={status == LIVE ? "ghost" : "default"} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
                {status == LIVE ?

                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    <span>Enter</span>
                  </div>
                  : status == NOT_STARTED ?
                    <div className="flex items-center gap-2">
                      <span>Notify</span>
                    </div>
                    :
                    <div className="flex items-center gap-2">
                      <span>See Leaderboard</span>
                    </div>
                }


              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

