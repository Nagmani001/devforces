"use client";

import React, { useState } from "react";
import { X, Trash, AlertTriangle } from "lucide-react";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

interface DeleteContestDialogProps {
  contestName: string;
  trigger?: React.ReactNode; // optional trigger element
  onDelete?: () => Promise<void> | void;
}

// Default export a React component as required by the canvas preview
export default function DeleteContestDialog({
  contestName,
  trigger,
  onDelete,
}: DeleteContestDialogProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  console.log("inside deleteContestDislogue", contestName);

  const matches = value.trim() == contestName;

  async function handleDelete() {
    if (!matches) return;
    try {
      setIsDeleting(true);
      await onDelete?.();
      setOpen(false);
      setValue("");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="destructive" className="gap-2">
            <Trash size={16} /> Delete
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[520px] rounded-2xl border-2 border-white/20 bg-slate-900 text-slate-50 p-6 shadow-lg">
        {/* top-right close */}


        <div className="flex gap-4 items-start">
          <div className="rounded-full bg-red-700/10 p-2 text-red-400">
            <AlertTriangle size={20} />
          </div>

          <div className="flex-1">
            <DialogHeader className="p-0">
              <DialogTitle className="text-lg font-semibold">
                Are you sure you want to delete this contest?
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-slate-300">
                This action will permanently delete the contest <span className="font-medium text-slate-50">{contestName}</span> and all its data. This cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5">
              <Label className="mb-2 text-sm">Type the name of the contest to confirm</Label>
              <div className="flex gap-3">
                <Input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={contestName}
                  className="flex-1 rounded-md border border-white/10 bg-transparent text-slate-50 placeholder:text-slate-400"
                  aria-label="Confirm contest name"
                />
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={!matches || isDeleting}
                  className="whitespace-nowrap"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>

              <p className="mt-2 text-xs text-slate-400">
                To confirm, type <span className="font-mono text-slate-200">{contestName}</span> exactly. This helps prevent accidental deletions.
              </p>
            </div>
          </div>
        </div>


      </DialogContent>
    </Dialog>
  );
}

/*
Usage example:

import DeleteContestDialog from "./DeleteContestDialog";

<DeleteContestDialog
  contestName={"my-contest"}
  onDelete={async () => { await api.deleteContest(); }}
  trigger={<Button variant="outline">Open delete dialog</Button>}
/>

Notes:
- The dialog mirrors the "type the repo name to confirm" pattern used on GitHub.
- It disables the destructive action until the exact contest name is entered.
- Modify styles or text to match your app theme (dark/light). 
*/
