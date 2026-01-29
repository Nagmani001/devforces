"use client"

import { useState, useCallback } from "react";
// @ts-ignore
import { ResizableBox } from "react-resizable";
import JSZip from "jszip";
import "react-resizable/css/styles.css";
import { useDropzone } from "react-dropzone";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { NotionRenderer } from "react-notion-x";
import { CloudUpload, Play, Loader, GripVertical, CheckCircle, Copy, GitBranch, AlertTriangle, Terminal } from "lucide-react";
import dynamic from 'next/dynamic'
import axios from "axios";
import { BASE_URL_CLIENT, confirmFileSent, sendZippedFile } from "@/app/config/utils";
import { ArenaDropzoneLoader } from "@/app/components/arenaDropzoneLoader";

const Code = dynamic(() =>
  import('react-notion-x/build/third-party/code').then((m) => m.Code)
)
const Equation = dynamic(() =>
  import('react-notion-x/build/third-party/equation').then((m) => m.Equation)
)

export default function ArenaPage({ recordMap, challengeId, baseGithubUrl, contestId }: any) {
  const [leftWidth, setLeftWidth] = useState<number>(760);
  const [loadingNotion, setLoadingNotion] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [files, setFiles] = useState<File[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [testResult, setTestResult] = useState({
    passed: 0,
    total: 0,
    failed: 0
  });


  // SSE connection will be handled in handleSubmit

  const onDrop = useCallback((acceptedFiles: File[]) => {
    //@ts-ignore

    const actualFiles = acceptedFiles.filter((x: File) => {
      //@ts-ignore
      if (x.path.includes("/node_modules/") || x.path.includes("/.git/") || x.path.includes("/dist/")) {
        return false
      } else {
        return true
      }
    });


    actualFiles.forEach(x => {
      //@ts-ignore
      console.log(x.path)
    });

    setFiles((prev) => [...prev, ...actualFiles]);
  }, []);

  const handleSubmit = async () => {
    if (files.length < 1) {
      return alert("no files selected");
    }

    setIsSubmitting(true);
    setLogs([]);
    setTestResult({ passed: 0, total: 0, failed: 0 });

    let eventSource: EventSource | null = null;

    try {
      // Get pre-signed URL and submission token
      const getPresignedUrl = await axios.get(`${BASE_URL_CLIENT}/api/submissions/preSignedUrl/${challengeId}?contestId=${contestId}`, {
        headers: {
          Authorization: localStorage.getItem("token")
        }
      });

      const { preSignedUrl, fields, submissionToken } = getPresignedUrl.data;

      if (!submissionToken) {
        throw new Error("No submission token received");
      }

      // Set up SSE connection before submitting
      eventSource = new EventSource(`${BASE_URL_CLIENT}/api/live/sse/${submissionToken}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "log") {
            // Add log message to logs array
            setLogs(prev => [...prev, data.data.message]);
          } else if (data.type === "result") {
            // Handle result
            const result = JSON.parse(data.data.message);
            setTestResult(result);
            // Close SSE connection when result is received
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

      // Create and upload zip file
      const zip = new JSZip();

      for (const file of files) {
        // INFO: can also add name of file here , useful in worker after unzipping
        //@ts-ignore
        zip.file(file.path, file);
      }

      const zipFile = await zip.generateAsync({ type: "blob" });
      await sendZippedFile(preSignedUrl, fields, zipFile);

      // Confirm submission (this will trigger the worker to start processing)
      await confirmFileSent(challengeId, contestId, submissionToken);
      setFiles([]);

    } catch (e) {
      console.error(e);
      alert("Error submitting file");
      if (eventSource) {
        eventSource.close();
      }
      setIsSubmitting(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: false,
    noKeyboard: true,
    multiple: true,
  });

  return (
    <div className="h-[calc(100vh-4rem)] bg-background text-foreground flex flex-col p-4 w-full overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between mb-4 border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Arena Playground</h1>

        <div className="flex items-center gap-2">
          <Button onClick={handleSubmit} variant="secondary" className="rounded-md">
            Submit
          </Button>
          <Button className="rounded-md gap-2">
            <Play size={16} /> Run Code
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          Test Cases: <span className="font-medium text-foreground">30</span>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 flex gap-4 overflow-hidden h-full pb-2">
        {/* Left resizable column: Notion content */}
        <ResizableBox
          className="relative shadow-sm rounded-lg overflow-hidden border bg-card"
          width={leftWidth}
          height={Infinity}
          minConstraints={[420, Infinity]}
          maxConstraints={[1200, Infinity]}
          axis="x"
          resizeHandles={["e"]}
          handle={
            <div className="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize flex items-center justify-center hover:bg-accent/50 transition-colors z-50">
              <GripVertical className="h-6 w-6 text-muted-foreground" />
            </div>
          }
          onResizeStop={(e: any, data: any) => setLeftWidth(data.size.width)}
        >
          <Card className="h-full">
            <CardContent className="h-[640px] overflow-auto p-1">
              {loadingNotion ? (
                <div className="flex items-center gap-3">
                  <Loader className="animate-spin" />
                  <span>Loading notion page...</span>
                </div>
              ) : recordMap ? (
                <NotionRenderer recordMap={recordMap}
                  fullPage={false}
                  components={{
                    Code,
                    Equation,
                  }}
                />
              ) : (
                <div className="prose prose-invert">
                  <h2>Question title (placeholder)</h2>
                  <p>
                    This area is a placeholder for the Notion content. Hook up your server-side fetch
                    to create a recordMap for react-notion-x and pass it into <code>NotionRenderer</code>.
                  </p>

                  <p>
                    Example: add the problem statement, input/output format, constraints, and examples
                    here. You can also include code blocks and images in Notion and they will render.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </ResizableBox>

        {/* Right column */}
        <div className="flex-1 flex flex-col gap-6 h-full">
          {/* Top resizable box inside right column: Dropzone */}
          <ResizableBox
            className="rounded-lg overflow-hidden border bg-card relative"
            width={Infinity}
            height={420}
            minConstraints={[Infinity, 200]}
            maxConstraints={[Infinity, 800]}
            axis="y"
            resizeHandles={["s"]}
            handle={
              <div className="absolute bottom-0 left-0 right-0 h-4 cursor-row-resize flex items-center justify-center hover:bg-accent/50 transition-colors z-50">
                <GripVertical className="h-4 w-4 rotate-90 text-muted-foreground" />
              </div>
            }
          >

            <div className="h-full flex flex-col gap-2 p-1">
              <div className="shrink-0 p-3 border rounded-lg bg-blue-50/50 text-xs">
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-1.5 text-primary font-semibold shrink-0">
                    <GitBranch className="w-4 h-4" />
                    <span>Starter Code</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2 bg-background border px-3 py-1.5 rounded-md text-muted-foreground font-mono min-w-0">
                    <Terminal className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate text-xs flex-1">git clone {baseGithubUrl}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 shrink-0" onClick={() => navigator.clipboard.writeText(`git clone ${baseGithubUrl}`)}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 items-center text-amber-600">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span className="truncate">Do <span className="font-bold">NOT</span> modify <code>Dockerfile</code>, <code>docker-compose.yml</code>, or health check.</span>
                </div>
              </div>

              <Card className="flex-1 min-h-0 flex flex-col justify-center items-center relative overflow-hidden">
                <CardContent className="h-full w-full flex flex-col items-center justify-center p-6">
                  {isSubmitting ? (
                    <ArenaDropzoneLoader />
                  ) : (
                    <div
                      {...getRootProps()}
                      className={
                        "w-full h-full border-2 border-dashed rounded-lg flex items-center justify-center p-6 transition-all " +
                        (isDragActive
                          ? "border-primary bg-primary/10"
                          : "border-muted-foreground/25 bg-muted/50 hover:bg-muted/80")
                      }
                    >

                      <input {...getInputProps()}
                        //@ts-ignore
                        webkitdirectory=""
                        directory="" />

                      <div className="text-center select-none">
                        {files.length > 0 ? (
                          <div className="flex flex-col items-center">
                            <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
                            <h3 className="text-2xl font-handwriting">Ready to submit</h3>
                            <p className="mt-2 text-sm opacity-80">Proceed to submit your code</p>
                          </div>
                        ) : (
                          <>
                            <CloudUpload className="mx-auto mb-4" size={48} />
                            <h3 className="text-2xl font-handwriting">Drop zone</h3>
                            <p className="mt-2 text-sm opacity-80">Drop a folder here or click to select a folder</p>
                            <p className="mt-1 text-xs opacity-60">(node_modules will be filtered out)</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </ResizableBox>

          {/* Bottom stats card */}
          <div className="flex-1 rounded-lg overflow-hidden border bg-[#1e1e1e] font-mono text-sm shadow-lg flex flex-col min-h-[200px]">
            {/* Terminal Header */}
            <div className="bg-[#2d2d2d] px-4 py-2 flex items-center gap-2 border-b border-[#3e3e3e]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>
              <div className="flex-1 text-center text-xs text-gray-400 font-sans">
                test_results.log
              </div>
            </div>

            {/* Terminal Content */}
            <div className="flex-1 p-4 text-gray-300 overflow-auto font-mono">
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
        </div>
      </main>
    </div>
  );
}
