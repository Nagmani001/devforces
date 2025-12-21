"use client";

import React from "react";
import { Clock, Play, Calendar } from "lucide-react";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";


export type ContestCardProps = {
  id?: string | number;
  title: string;
  subtitle?: string;
  duration?: string;
  startTimeLabel?: string;
  isContestEnded?: boolean;
  isLive?: boolean;
  challengeCount?: number;
  onClick?: () => void;
  variant?: "default" | "outline" | "compact";
  className?: string;
  actions?: React.ReactNode;
};

export function ContestCard({
  title,
  subtitle,
  duration,
  startTimeLabel,
  isContestEnded,
  isLive,
  challengeCount,
  onClick,
  variant = "default",
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
                <p className="mt-1 text-sm text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              {isLive ? (
                <Badge className="rounded-full px-3 py-1">Live</Badge>
              ) : isContestEnded ? (
                <Badge className="rounded-full px-3 py-1">Ended</Badge>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {startTimeLabel}
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
                  variant={isContestEnded || isLive ? "ghost" : "default"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick?.();
                  }}
                >
                  {isContestEnded || isLive ? (
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
  status?: "upcoming" | "running" | "ended" | "draft";
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
    draft: (
      <>
        <Button size="sm" variant="default" onClick={onUpdate}>
          Publish
        </Button>
        <Button size="sm" variant="outline" onClick={onUpdate}>
          Edit
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
  };

  return (
    <ContestCard
      {...rest}
      actions={actionsMap[status]}
      startTimeLabel={
        status === "upcoming" ? rest.startTimeLabel ?? "Upcoming" : status
      }
      isContestEnded={status !== "upcoming"}
    />
  );
}
