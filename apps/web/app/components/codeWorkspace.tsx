"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode, InputHTMLAttributes } from "react";
import Editor from "@monaco-editor/react";
import { loader } from "@monaco-editor/react";
import {
  Download,
  FolderUp,
  RotateCcw,
  PanelLeftClose,
  PanelLeft,
  Binary,
  CircleDot,
} from "lucide-react";
import { WorkspaceEntry, WorkspaceLoadStatus } from "@/app/hooks/useCodeWorkspace";
import { FileTree } from "@/app/components/workspaceFileTree";
import { Button } from "@repo/ui/components/button";
import { AlertTriangle } from "lucide-react";

loader.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.56.0/min/vs" } });

const LANG_BY_EXT: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  mts: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  jsonc: "json",
  yaml: "yaml",
  yml: "yaml",
  css: "css",
  scss: "scss",
  less: "less",
  html: "html",
  htm: "html",
  md: "markdown",
  mdx: "markdown",
  sql: "sql",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  dockerfile: "dockerfile",
  py: "python",
  go: "go",
  rs: "rust",
  java: "java",
  c: "c",
  h: "c",
  cpp: "cpp",
  hpp: "cpp",
  cs: "csharp",
  prisma: "plaintext",
  env: "plaintext",
  gitignore: "plaintext",
  dockerignore: "plaintext",
  lock: "plaintext",
  toml: "ini",
  ini: "ini",
  xml: "xml",
  svg: "xml",
  graphql: "graphql",
  gql: "graphql",
};

function languageForPath(path: string): string {
  const name = path.split("/").pop() ?? path;
  const lower = name.toLowerCase();
  if (lower === "dockerfile") return "dockerfile";
  const ext = lower.split(".").pop() ?? "";
  return LANG_BY_EXT[ext] ?? "plaintext";
}

function isBinary(entry?: WorkspaceEntry): boolean {
  return !!entry && entry.blob !== undefined;
}

export function CodeWorkspace({
  status,
  error,
  entries,
  activePath,
  dirtyPaths,
  isDark,
  baseGithubUrl,
  extraActions,
  onSelectEntry,
  onCreateFile,
  onCreateFolder,
  onRenameEntry,
  onDeleteEntry,
  onUpdateFile,
  onImportFolder,
  onDownload,
  onResetToBase,
}: {
  status: WorkspaceLoadStatus;
  error: string | null;
  entries: WorkspaceEntry[];
  activePath: string | null;
  dirtyPaths: Set<string>;
  isDark: boolean;
  baseGithubUrl: string;
  extraActions?: ReactNode;
  onSelectEntry: (entry: WorkspaceEntry) => void;
  onCreateFile: (path: string) => void;
  onCreateFolder: (path: string) => void;
  onRenameEntry: (oldPath: string, newPath: string) => void;
  onDeleteEntry: (path: string) => void;
  onUpdateFile: (path: string, text: string) => void;
  onImportFolder: (files: FileList) => Promise<{ imported: number; skipped: number }>;
  onDownload: () => void;
  onResetToBase: () => void;
}) {
  const [showTree, setShowTree] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeEntry = useMemo(
    () => entries.find((e) => e.path === activePath && e.blob === undefined && !e.path.endsWith("/")),
    [entries, activePath]
  );
  const activeBinary = useMemo(() => entries.find((e) => e.path === activePath), [entries, activePath]);

  const ensureActiveFile = useCallback(() => {
    if (status !== "ready" || entries.length === 0) return;
    if (activeEntry) return;
    const candidates = ["package.json", "README.md", "src/index.ts", "index.ts", "docker-compose.yml", "Dockerfile"];
    for (const candidate of candidates) {
      const entry = entries.find((e) => e.path === candidate && e.blob === undefined);
      if (entry) {
        onSelectEntry(entry);
        return;
      }
    }
    const firstText = entries.find((e) => !e.path.endsWith("/") && e.blob === undefined);
    if (firstText) {
      onSelectEntry(firstText);
    }
  }, [entries, activeEntry, onSelectEntry, status]);

  useEffect(() => {
    ensureActiveFile();
  }, [ensureActiveFile]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        {...({ webkitdirectory: "", directory: "" } as unknown as InputHTMLAttributes<HTMLInputElement>)}
        onChange={async (e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            await onImportFolder(files);
          }
          e.target.value = "";
        }}
      />

      {/* Header bar */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-2 py-1.5">
        <button
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          title={showTree ? "Hide file explorer" : "Show file explorer"}
          onClick={() => setShowTree((v) => !v)}
        >
          {showTree ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
        </button>

        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <CircleDot className="h-3 w-3" />
          <span className="max-w-[220px] truncate font-mono">{baseGithubUrl ? baseGithubUrl.replace(/^https?:\/\//, "") : "local workspace"}</span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          {extraActions}
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" title="Import folder" onClick={() => fileInputRef.current?.click()}>
            <FolderUp className="h-3.5 w-3.5 mr-1" /> Import folder
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" title="Download as zip" onClick={onDownload}>
            <Download className="h-3.5 w-3.5 mr-1" /> Download
          </Button>
          {baseGithubUrl && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" title="Reset workspace to starter repo" onClick={onResetToBase}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* Warning strip */}
      {baseGithubUrl && (
        <div className="flex items-center gap-2 border-b border-border bg-amber-500/5 px-3 py-1 text-[11px] text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span className="truncate">
            Do NOT modify <code className="rounded bg-muted px-1 font-mono">Dockerfile</code>,{" "}
            <code className="rounded bg-muted px-1 font-mono">docker-compose.yml</code>, or health check.
          </span>
        </div>
      )}

      {(status === "idle" || status === "loading") && (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Loading starter repository…
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="text-sm text-red-500">Could not load starter repo</div>
          <div className="max-w-md text-xs text-muted-foreground">{error}</div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              Import a local folder instead
            </Button>
            {baseGithubUrl && (
              <Button variant="ghost" size="sm" onClick={onResetToBase}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Retry
              </Button>
            )}
          </div>
        </div>
      )}

      {status === "ready" && (
        <div className="flex min-h-0 flex-1">
          {showTree && entries.length > 0 && (
            <div className="w-56 shrink-0 border-r border-border">
              <FileTree
                entries={entries}
                dirtyPaths={dirtyPaths}
                activePath={activePath}
                onSelect={onSelectEntry}
                onAddFile={onCreateFile}
                onAddFolder={onCreateFolder}
                onRename={onRenameEntry}
                onDelete={onDeleteEntry}
              />
            </div>
          )}

          <div className="flex min-h-0 flex-1 flex-col">
            {activePath && activeBinary && isBinary(activeBinary) ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
                <Binary className="h-8 w-8" />
                <p className="text-sm font-mono">{activeBinary.path}</p>
                <p className="text-xs">This is a binary file and cannot be edited in the browser.</p>
              </div>
            ) : activeEntry ? (
              <>
                <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-1">
                  <span className="flex items-center gap-2 font-mono text-xs text-foreground/80">
                    {languageForPath(activeEntry.path) !== "plaintext" && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                        {languageForPath(activeEntry.path)}
                      </span>
                    )}
                    <span className="truncate">{activeEntry.path}</span>
                    {dirtyPaths.has(activeEntry.path) && (
                      <span className="text-yellow-500" title="Unsaved edits (saved locally in your browser)">
                        ●
                      </span>
                    )}
                  </span>
                </div>
                <div className="min-h-0 flex-1">
                  <Editor
                    key={activeEntry.path}
                    height="100%"
                    theme={isDark ? "vs-dark" : "light"}
                    language={languageForPath(activeEntry.path)}
                    value={activeEntry.text ?? ""}
                    onChange={(value) => onUpdateFile(activeEntry.path, value ?? "")}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      wordWrap: "on",
                      padding: { top: 12 },
                      smoothScrolling: true,
                      cursorBlinking: "smooth",
                      renderWhitespace: "selection",
                      bracketPairColorization: { enabled: true },
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
                <p className="text-sm">Select a file to start editing, or create a new one.</p>
                {entries.length === 0 && (
                  <>
                    <p className="text-xs">Your workspace is empty.</p>
                    <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                      <FolderUp className="mr-1 h-3.5 w-3.5" /> Import a folder to begin
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
