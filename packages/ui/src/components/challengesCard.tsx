
"use client";

import React from "react";
import { Clock, Play, Calendar } from "lucide-react";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";

// ================= Base Contest Card =================

export type ContestCardProps = {
  id?: string | number;
  title: string;
  subtitle: string;
  duration?: string;
  startTimeLabel?: string;
  isContestStarted?: boolean;
  isLive?: boolean;
  challengeCount?: number;
  onClick?: () => void;
  variant?: "default" | "outline" | "compact";
  rightText?: string;
  className?: string;
  /** extra actions rendered on the right (admin mode) */
  actions?: React.ReactNode;
};

export function ContestCard({
  title,
  subtitle,
  duration,
  startTimeLabel,
  isContestStarted = false,
  isLive = false,
  challengeCount,
  onClick,
  variant = "default",
  rightText,
  className = "",
  actions,
}: ContestCardProps) {
  const rootClasses = [
    "w-full",
    "rounded-2xl",
    "border",
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
    rootClasses.push("bg-white/3", "backdrop-blur-sm", "p-4");
  }

  const renderMeta = () => (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      {duration && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{duration}</span>
        </div>
      )}

      {typeof challengeCount === "number" && (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>
            {challengeCount} challenge{challengeCount === 1 ? "" : "s"}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <Card className={rootClasses.join(" ")} onClick={onClick}>
      <CardContent className="flex w-full items-center gap-4 p-0">
        <div className="flex flex-1 flex-col gap-1 px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col">
              <h3 className="text-lg font-medium leading-tight">{title}</h3>
              {subtitle && (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              {isLive ? (
                <Badge className="rounded-full px-3 py-1">Live</Badge>
              ) : isContestStarted ? (
                <Badge className="rounded-full px-3 py-1">Ended</Badge>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {startTimeLabel}
                </span>
              )}

              {rightText && (
                <span className="text-sm font-medium text-muted-foreground">
                  {rightText}
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            {renderMeta()}

            <div className="flex items-center gap-2">
              {actions ?? (
                <Button
                  size="sm"
                  variant={isContestStarted || isLive ? "ghost" : "default"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick?.();
                  }}
                >
                  {isContestStarted || isLive ? (
                    <span className="flex items-center gap-2">
                      <Play className="h-4 w-4" /> Enter
                    </span>
                  ) : (
                    "View"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ================= Admin / Owner Variant =================

export type AdminContestCardProps = Omit<ContestCardProps, "actions"> & {
  status?: "upcoming" | "running" | "ended";
  onUpdate?: () => void;
  onDelete?: () => void;
  onSeeResult?: () => void;
  deleteDialogTrigger?: React.ReactNode; // Custom delete button trigger for dialog
};

export function AdminContestCard({
  status = "upcoming",
  onUpdate,
  onDelete,
  onSeeResult,
  deleteDialogTrigger,
  ...rest
}: AdminContestCardProps) {
  const actionsMap: Record<NonNullable<AdminContestCardProps["status"]>, React.ReactNode> = {
    upcoming: (
      <>
        <Button size="sm" variant="outline" onClick={onUpdate}>
          Update
        </Button>
        {deleteDialogTrigger ? (
          deleteDialogTrigger
        ) : (
          <Button size="sm" variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        )}
      </>
    ),
    running: (
      <Button size="sm" onClick={onSeeResult}>
        See Live Result
      </Button>
    ),
    ended: (
      <Button size="sm" variant="secondary" onClick={onSeeResult}>
        See Result
      </Button>
    ),
  };

  return (
    <ContestCard
      {...rest}
      actions={actionsMap[status]}
      startTimeLabel={
        status === "upcoming" ? rest.startTimeLabel ?? "Upcoming" : status
      }
      isContestStarted={status !== "upcoming"}
    />
  );
}

// ================= Challenge / Problem Card =================

export type ChallengeCardProps = {
  id?: string | number;
  title: string;
  totalTestCases?: number;
  passedTestCases?: number;
  attempted?: boolean;
  submitted?: boolean;
  onStart?: () => void;
  onView?: () => void;
  className?: string;
  variant?: "default" | "compact";
};

export function ChallengeCard({
  title,
  totalTestCases = 0,
  passedTestCases = 0,
  attempted = false,
  submitted = false,
  onStart,
  onView,
  className = "",
  variant = "default",
}: ChallengeCardProps) {
  const root = [
    "w-full",
    "rounded-2xl",
    "border",
    "flex",
    "items-center",
    "justify-between",
    "transition-shadow",
    "hover:shadow-lg",
    className,
  ];

  if (variant === "compact") {
    root.push("p-3");
  } else {
    root.push("p-4", "bg-white/3", "backdrop-blur-sm");
  }

  const rightText = `${passedTestCases}/${totalTestCases} test case${totalTestCases === 1 ? "" : "s"} passed`;

  return (
    <Card className={root.join(" ")}>
      <CardContent className="flex w-full items-center gap-4 p-0">
        <div className="flex flex-1 flex-col gap-1 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h4 className="text-lg font-medium">{title}</h4>
            </div>

          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="whitespace-nowrap">total test cases : {totalTestCases}</span>
              <span className="whitespace-nowrap">{attempted ? "Attempted" : "Not attempted"}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{rightText}</span>

              {!attempted && !submitted ? (
                <Button size="sm" variant="default" onClick={onStart}>
                  Start
                </Button>
              ) : (attempted && !submitted) ?
                <Button size="sm" variant="default" onClick={onStart}>
                  Submit
                </Button>
                : (
                  <Button size="sm" variant="outline" onClick={onView}>
                    View
                  </Button>
                )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* Usage examples (already in canvas):

<ChallengeCard
  title="complete authentication"
  totalTestCases={10}
  passedTestCases={5}
  submitted={true}
  onView={() => {}}
/>

<ChallengeCard
  title="complete endpoints for managing quiz"
  totalTestCases={12}
  passedTestCases={8}
  submitted={true}
  onView={() => {}}
/>

<ChallengeCard
  title="complete endpoints for interacting with quiz"
  totalTestCases={10}
  attempted={true}
  onStart={() => {}}
/>

<ChallengeCard
  title="final leaderboard endpoints"
  totalTestCases={20}
  attempted={false}
  onStart={() => {}}
/>
*/
