"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  AlertTriangle,
  CheckCircle,
  CloudUpload,
  Copy,
  GitBranch,
  Terminal,
  X,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { ArenaDropzoneLoader } from "@/app/components/arenaDropzoneLoader";

const IGNORED_SEGMENTS = ["node_modules", ".git", "dist"];

type LocalFile = File & { webkitRelativePath?: string; path?: string };

function fileRelPath(file: LocalFile): string {
  return file.webkitRelativePath || file.path || file.name;
}

function isIgnored(file: LocalFile): boolean {
  const segments = fileRelPath(file).split("/");
  return segments.some((s) => IGNORED_SEGMENTS.includes(s));
}

export function ArenaFolderUpload({
  isSubmitting,
  files,
  baseGithubUrl,
  onFilesChange,
}: {
  isSubmitting: boolean;
  files: LocalFile[];
  baseGithubUrl?: string;
  onFilesChange: (files: LocalFile[]) => void;
}) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const incoming = (acceptedFiles as LocalFile[])
        .filter((f) => !isIgnored(f))
        .filter((f, index, arr) => arr.findIndex((x) => fileRelPath(x) === fileRelPath(f)) === index);
      onFilesChange([...files, ...incoming]);
    },
    [files, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: false,
    noKeyboard: true,
    multiple: true,
  });

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {isSubmitting ? (
        <ArenaDropzoneLoader />
      ) : (
        <>
          {/* Clone instructions */}
          {baseGithubUrl && (
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-3 py-2 text-xs">
              <span className="flex shrink-0 items-center gap-1.5 font-semibold text-primary">
                <GitBranch className="h-3.5 w-3.5" /> Starter Code
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 font-mono text-muted-foreground">
                <Terminal className="h-3 w-3 shrink-0" />
                <code className="truncate">git clone {baseGithubUrl}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-5 w-5 shrink-0"
                  title="Copy git clone command"
                  onClick={() => navigator.clipboard.writeText(`git clone ${baseGithubUrl}`)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </span>
            </div>
          )}

          {/* Warning strip */}
          <div className="flex items-center gap-2 border-b border-border bg-amber-500/5 px-3 py-1 text-[11px] text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            <span className="truncate">
              Do NOT modify <code className="rounded bg-muted px-1 font-mono">Dockerfile</code>,{" "}
              <code className="rounded bg-muted px-1 font-mono">docker-compose.yml</code>, or health check.
            </span>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col">
            <div
              {...getRootProps()}
              className={
                "flex min-h-0 flex-1 cursor-pointer flex-col items-center justify-center border-2 border-dashed p-6 transition-all " +
                (isDragActive
                  ? "border-primary bg-primary/10"
                  : "border-muted-foreground/25 bg-muted/50 hover:bg-muted/80")
              }
            >
              <input
                {...getInputProps()}
                {...({ webkitdirectory: "", directory: "" } as unknown as React.InputHTMLAttributes<HTMLInputElement>)}
              />

              {files.length > 0 ? (
                <div className="flex flex-col items-center text-center">
                  <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
                  <h3 className="text-xl font-semibold tracking-tight">Ready to submit</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {files.length} file{files.length === 1 ? "" : "s"} staged. Drop again to add more, or click to
                    re-select a folder.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <CloudUpload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-xl font-semibold tracking-tight">Drop your folder here</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Drag &amp; drop your cloned folder, or click to select it.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    (node_modules, .git and dist are filtered out)
                  </p>
                </div>
              )}
            </div>

            {files.length > 0 && (
              <div className="shrink-0 border-t border-border bg-background p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {files.length} file{files.length === 1 ? "" : "s"} ready
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] text-muted-foreground"
                    onClick={() => onFilesChange([])}
                  >
                    <X className="mr-1 h-3 w-3" /> Clear
                  </Button>
                </div>
                <div className="flex max-h-28 flex-wrap gap-1 overflow-auto">
                  {files.slice(0, 50).map((file) => (
                    <span
                      key={fileRelPath(file)}
                      title={fileRelPath(file)}
                      className="max-w-[240px] truncate rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                    >
                      {fileRelPath(file)}
                    </span>
                  ))}
                  {files.length > 50 && (
                    <span className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      +{files.length - 50} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}