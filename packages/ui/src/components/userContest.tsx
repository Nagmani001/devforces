"use client";
import { Clock, Play, Calendar } from "lucide-react";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";

export type ContestCardProps = {
  id?: string | number;
  title: string;
  subtitle?: string;
  duration?: string; // e.g. "2 hour" or "30 min"
  startTimeLabel?: string; // e.g. "Starts at 7:30 pm" or "Start now"
  isContestStarted?: boolean;
  isLive?: boolean;
  challengeCount?: number;
  onClick?: () => void;
  variant?: "default" | "outline" | "compact";
  rightText?: string; // any text to show on the right side
  className?: string;
};

/**
 * ContestCard
 *
 * Single reusable component to render contests in different states.
 * Uses shadcn/ui Card + Badge + Button and tailwind for layout.
 *
 * Props control appearance (started / live / compact) so the same component
 * can represent many contest types on the platform.
 */
export default function UserContest({
  id,
  title,
  subtitle,
  duration,
  startTimeLabel,
  isContestStarted = false,
  isLive = false,
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
              {isLive ? (
                <Badge className="rounded-full px-3 py-1">Live</Badge>
              ) : isContestStarted ? (
                <Badge className="rounded-full px-3 py-1">Started</Badge>
              ) : (
                <span className="text-sm text-muted-foreground whitespace-nowrap">{startTimeLabel}</span>
              )}

              {rightText && (
                <div className="text-sm font-medium text-muted-foreground">{rightText}</div>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            {renderMeta()}

            <div className="flex items-center gap-2">
              {/* action button — style depends on started state */}
              <Button size="sm" variant={isContestStarted || isLive ? "ghost" : "default"} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
                {isContestStarted || isLive ? (
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    <span>Enter</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>View</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/*
Usage examples (copy into any React page):

<ContestCard
  id={1}
  title="build a http backend for a quiz platform"
  subtitle="2 hour"
  duration="2 hour"
  startTimeLabel="Starts at 7:30 pm"
  isContestStarted={false}
  challengeCount={4}
  onClick={() => console.log('open contest')}
/>

<ContestCard
  id={2}
  title="build a websocket server for chat app"
  duration="2 hour"
  startTimeLabel="Start now"
  isContestStarted={true}
  isLive={true}
  challengeCount={6}
/>
*/
