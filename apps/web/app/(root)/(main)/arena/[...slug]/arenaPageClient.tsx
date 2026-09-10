"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useTheme } from "next-themes";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { NotionRenderer } from "react-notion-x";

type RecordMap = React.ComponentProps<typeof NotionRenderer>["recordMap"];
import { Loader, GripVertical, GitBranch, Copy, Terminal, PanelLeft, PanelLeftClose, Maximize2, Minimize2, SquareTerminal, Code2, FolderUp } from "lucide-react";
import dynamic from 'next/dynamic'
import axios from "axios";
import { BASE_URL, confirmFileSent, sendZippedFile } from "@/app/config/utils";
import { ArenaDropzoneLoader } from "@/app/components/arenaDropzoneLoader";
import { ArenaFolderUpload } from "@/app/components/arenaFolderUpload";
import { useNavBarActions } from "@/app/components/navBarActions";
import { CodeWorkspace } from "@/app/components/codeWorkspace";
import { useCodeWorkspace } from "@/app/hooks/useCodeWorkspace";
import type { WorkspaceEntry } from "@/app/hooks/useCodeWorkspace";

const Code = dynamic(() =>
  import('react-notion-x/build/third-party/code').then((m) => m.Code)
)
const Equation = dynamic(() =>
  import('react-notion-x/build/third-party/equation').then((m) => m.Equation)
)

type ArenaPageProps = {
  recordMap: RecordMap;
  challengeId: string;
  baseGithubUrl?: string;
  contestId: string;
  title?: string;
};

export default function ArenaPage({ recordMap, challengeId, baseGithubUrl, contestId, title }: ArenaPageProps) {
  const [leftWidth, setLeftWidth] = useState<number>(520);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [showProblem, setShowProblem] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [codeFocus, setCodeFocus] = useState(false);
  const [mode, setMode] = useState<"browser" | "local">("browser");
  const [localFiles, setLocalFiles] = useState<(File & { webkitRelativePath?: string; path?: string })[]>([]);
  const [testResult, setTestResult] = useState({
    passed: 0,
    total: 0,
    failed: 0
  });
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const { setActions } = useNavBarActions();

  const workspaceKey = useMemo(() => `${contestId}:${challengeId}`, [contestId, challengeId]);

  const workspace = useCodeWorkspace({
    storageKey: workspaceKey,
    baseGithubUrl: baseGithubUrl ?? "",
    enabled: mounted,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const { status: workspaceStatus, entries: workspaceEntries } = workspace;

  const handleSubmit = useCallback(async () => {
    if (mode === "local") {
      if (localFiles.length < 1) {
        return alert("No files selected. Drop or pick a folder first.");
      }
    } else if (workspaceEntries.length < 1) {
      return alert("Your workspace is empty. Add or import files before submitting.");
    }

    setIsSubmitting(true);
    setLogs([]);
    setTestResult({ passed: 0, total: 0, failed: 0 });
    setShowTerminal(true);

    let eventSource: EventSource | null = null;

    try {
      const getPresignedUrl = await axios.get(`${BASE_URL}/api/submissions/preSignedUrl/${challengeId}?contestId=${contestId}`, {
        withCredentials: true
      });

      const { preSignedUrl, method, fields, headers, submissionToken } = getPresignedUrl.data;

      if (!submissionToken) {
        throw new Error("No submission token received");
      }

      eventSource = new EventSource(`${BASE_URL}/api/live/sse/${submissionToken}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "log") {
            setLogs(prev => [...prev, data.data.message]);
          } else if (data.type === "result") {
            const result = JSON.parse(data.data.message);
            setTestResult(result);
            if (eventSource) {
              eventSource.close();
            }
            setIsSubmitting(false);
          } else if (data.type === "connected") {
            setLogs(prev => [...prev, data.message]);
          }

        } catch (err) {
          console.error("Error parsing SSE message:", err);
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE error:", err);
        setLogs(prev => [...prev, "Connection error occurred"]);
        if (eventSource) {
          eventSource.close();
        }
        setIsSubmitting(false);
      };

      let zipFile: Blob;
      if (mode === "local") {
        const { default: JSZip } = await import("jszip");
        const zip = new JSZip();
        for (const file of localFiles) {
          const relPath = file.webkitRelativePath || file.path || file.name;
          zip.file(relPath, file);
        }
        zipFile = await zip.generateAsync({ type: "blob" });
      } else {
        zipFile = await workspace.getZip();
      }

      await sendZippedFile(preSignedUrl, method, fields, headers, zipFile);

      await confirmFileSent(challengeId, contestId, submissionToken);

      if (mode === "local") {
        setLocalFiles([]);
      }

    } catch (e) {
      console.error(e);
      alert("Error submitting file");
      if (eventSource) {
        eventSource.close();
      }
      setIsSubmitting(false);
    }
  }, [challengeId, contestId, mode, localFiles, workspaceEntries.length, workspace]);

  const navActions = useMemo(
    () => (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/60 p-0.5">
          <button
            type="button"
            title="Code in the browser editor"
            onClick={() => setMode("browser")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              mode === "browser"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" /> Browser
          </button>
          <button
            type="button"
            title="Clone the repo, code in your IDE, then upload the folder"
            onClick={() => setMode("local")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              mode === "local"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderUp className="h-3.5 w-3.5" /> Local IDE
          </button>
        </div>
        <Button onClick={handleSubmit} variant="secondary" size="sm" className="rounded-md h-8" disabled={isSubmitting || (mode === "browser" && workspaceStatus === "loading")}>
          Submit
        </Button>
      </div>
    ),
    [handleSubmit, isSubmitting, workspaceStatus, mode]
  );

  useEffect(() => {
    setActions(navActions);
    return () => setActions(null);
  }, [navActions, setActions]);

  const handleTerminalScroll = () => {
    const el = terminalRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsPinnedToBottom(distanceFromBottom < 20);
  };

  useEffect(() => {
    const el = terminalRef.current;
    if (el && isPinnedToBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [logs, isPinnedToBottom]);

  const selectEntry = useCallback((entry: WorkspaceEntry) => {
    setActivePath(entry.path);
  }, []);

  const handleDownload = useCallback(async () => {
    const zipFile = await workspace.getZip();
    const url = URL.createObjectURL(zipFile);
    const link = document.createElement("a");
    link.href = url;
    link.download = `solution-${challengeId}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  }, [workspace, challengeId]);

  const importFolderResult = useCallback(async (files: FileList) => {
    return workspace.importLocalFiles(files);
  }, [workspace]);

  const toggleCodeFocus = () => {
    setCodeFocus((v) => {
      const next = !v;
      if (next) {
        setShowProblem(false);
        setShowTerminal(false);
      }
      return next;
    });
  };

  const handleToggleProblem = () => {
    setShowProblem((v) => {
      const next = !v;
      if (next) setCodeFocus(false);
      return next;
    });
  };

  const handleToggleTerminal = () => {
    setShowTerminal((v) => {
      const next = !v;
      if (next) setCodeFocus(false);
      return next;
    });
  };

  const workspaceExtraActions = (
    <div className="flex items-center gap-0.5">
      <Button variant="ghost" size="icon" className="h-6 w-6" title={showProblem ? "Hide problem statement" : "Show problem statement"} onClick={handleToggleProblem}>
        {showProblem ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeft className="h-3.5 w-3.5" />}
      </Button>
      <Button variant="ghost" size="icon" className="h-6 w-6" title={codeFocus ? "Exit fullscreen code" : "Fullscreen code"} onClick={toggleCodeFocus}>
        {codeFocus ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
      </Button>
      <Button variant="ghost" size="icon" className="h-6 w-6" title={showTerminal ? "Hide test results" : "Show test results"} onClick={handleToggleTerminal}>
        <SquareTerminal className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  return (
    <div className="h-[calc(100vh-3.5rem)] bg-background text-foreground flex flex-col w-full overflow-hidden">
      <main className="flex-1 flex gap-4 overflow-hidden h-full p-4 pb-2">
        {showProblem && (
          <ResizableBox
            className="relative shadow-sm rounded-lg overflow-hidden border bg-card shrink-0"
            width={leftWidth}
            height={Infinity}
            minConstraints={[320, Infinity]}
            maxConstraints={[1100, Infinity]}
            axis="x"
            resizeHandles={["e"]}
            handle={
              <div className="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize flex items-center justify-center hover:bg-accent/50 transition-colors z-50">
                <GripVertical className="h-6 w-6 text-muted-foreground" />
              </div>
            }
            onResizeStop={(_e: Event, data: { size: { width: number } }) => setLeftWidth(data.size.width)}
          >
            <Card className="h-full">
              <CardContent className="h-full min-h-0 overflow-auto p-2">
                <div className="flex items-start justify-between gap-2 px-4 pt-4">
                  {title && (
                    <h1 className="truncate text-xl font-bold" title={title}>
                      {title}
                    </h1>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" title="Hide problem statement" onClick={() => setShowProblem(false)}>
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </div>
                <style jsx global>{`
                  .arena-notion .notion {
                    width: 100%;
                  }
                  .arena-notion .notion-page {
                    max-width: none;
                    width: 100%;
                    padding: 16px;
                  }
                `}</style>
                {!mounted ? (
                  <div className="flex items-center gap-3">
                    <Loader className="animate-spin" />
                    <span>Loading notion page...</span>
                  </div>
                ) : recordMap ? (
                  <div className="arena-notion">
                    <NotionRenderer
                      recordMap={recordMap}
                      darkMode={isDarkMode}
                      fullPage={false}
                      components={{
                        Code,
                        Equation,
                      }}
                    />
                  </div>
                ) : (
                  <div className="prose prose-invert">
                    <h2>Question title (placeholder)</h2>
                    <p>
                      This area is a placeholder for the Notion content. Hook up your server-side fetch
                      to create a recordMap for react-notion-x and pass it into <code>NotionRenderer</code>.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </ResizableBox>
        )}

        <div className="flex-1 flex flex-col gap-3 h-full min-w-0">
          {!showProblem && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
              <button
                className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 font-medium hover:bg-muted/60"
                onClick={handleToggleProblem}
              >
                <PanelLeft className="h-3.5 w-3.5" /> Show problem
              </button>
              <div className="flex items-center gap-2 ml-auto">
                <GitBranch className="h-3.5 w-3.5" />
                <code className="font-mono text-[11px] text-muted-foreground">git clone {baseGithubUrl}</code>
                <button
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Copy git clone command"
                  onClick={() => navigator.clipboard.writeText(`git clone ${baseGithubUrl}`)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 rounded-lg overflow-hidden border bg-card relative flex flex-col">
            {isSubmitting ? (
              <ArenaDropzoneLoader />
            ) : mode === "local" ? (
              <ArenaFolderUpload
                isSubmitting={isSubmitting}
                files={localFiles}
                baseGithubUrl={baseGithubUrl}
                onFilesChange={setLocalFiles}
              />
            ) : (
              <CodeWorkspace
                status={workspace.status}
                error={workspace.error}
                entries={workspace.entries}
                activePath={activePath}
                dirtyPaths={workspace.dirtyPaths}
                isDark={isDarkMode}
                baseGithubUrl={baseGithubUrl ?? ""}
                extraActions={workspaceExtraActions}
                onSelectEntry={selectEntry}
                onCreateFile={workspace.createFile}
                onCreateFolder={workspace.createFolder}
                onRenameEntry={workspace.renameEntry}
                onDeleteEntry={workspace.deleteEntry}
                onUpdateFile={workspace.updateFile}
                onImportFolder={importFolderResult}
                onDownload={handleDownload}
                onResetToBase={workspace.resetToBase}
              />
            )}
          </div>

          {showTerminal && (
            <div className="shrink-0 rounded-lg overflow-hidden border bg-[#1e1e1e] font-mono text-sm shadow-lg flex flex-col h-56">
              <div className="bg-[#2d2d2d] px-4 py-2 flex items-center gap-2 border-b border-[#3e3e3e] shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <div className="flex-1 text-center text-xs text-gray-400 font-sans">
                  test_results.log
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-400 hover:text-gray-200 hover:bg-white/10"
                  title="Hide test results"
                  onClick={() => setShowTerminal(false)}
                >
                  <Terminal className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div ref={terminalRef} onScroll={handleTerminalScroll} className="flex-1 p-4 text-gray-300 overflow-auto font-mono">
                {isSubmitting ? (
                  <div className="flex flex-col gap-1">
                    <div className="text-blue-400">
                      <span className="mr-2">$</span>
                      <span className="text-white">deploy_and_test.sh</span>
                    </div>
                    {logs.map((log, index) => (
                      <div key={index} className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
                        <span className="mr-2 text-gray-600">[{new Date().toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}]</span>
                        {log}
                      </div>
                    ))}
                    <div className="mt-2 text-green-500 animate-pulse">
                      <span className="mr-2">$</span>
                      <span className="inline-block w-2 h-4 bg-green-500 align-middle"></span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="text-green-500">
                      <span className="mr-2">$</span>
                      <span className="text-white">verify_submission</span>
                    </div>

                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400">ℹ</span>
                        <span>Total test cases found:</span>
                        <span className="text-white font-bold">{testResult.total}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✔</span>
                        <span>Passed test cases:</span>
                        <span className="text-green-400 font-bold">{testResult.passed}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-red-500">✘</span>
                        <span>Failed test cases:</span>
                        <span className="text-red-400 font-bold">{testResult.failed}</span>
                      </div>
                    </div>

                    {testResult.total > 0 && (
                      <div className="mt-4">
                        {testResult.failed === 0 ? (
                          <span className="text-green-500 font-bold">SUCCESS: All tests passed.</span>
                        ) : (
                          <span className="text-red-500 font-bold">FAILURE: Some tests failed.</span>
                        )}
                      </div>
                    )}

                    <div className="mt-2 text-green-500 animate-pulse">
                      <span className="mr-2">$</span>
                      <span className="inline-block w-2 h-4 bg-green-500 align-middle"></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!showTerminal && (
            <button
              className="shrink-0 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/60 self-start"
              onClick={() => setShowTerminal(true)}
            >
              <Terminal className="h-3.5 w-3.5" /> Open test results
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
