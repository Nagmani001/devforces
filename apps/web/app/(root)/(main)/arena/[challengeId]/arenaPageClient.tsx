"use client"

import { useState, useCallback } from "react";
// @ts-ignore
import { ResizableBox } from "react-resizable";
import JSZip from "jszip";
import "react-resizable/css/styles.css";
import { useDropzone } from "react-dropzone";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Badge } from "@repo/ui/components/badge";
import { NotionRenderer } from "react-notion-x";
import { CloudUpload, Play, Loader, Check, GripVertical } from "lucide-react";
import dynamic from 'next/dynamic'
import axios from "axios";
import { BASE_URL, confirmFileSent, sendZippedFile } from "@/app/config/utils";

const Code = dynamic(() =>
  import('react-notion-x/build/third-party/code').then((m) => m.Code)
)
const Equation = dynamic(() =>
  import('react-notion-x/build/third-party/equation').then((m) => m.Equation)
)

export default function ArenaPage({ recordMap, challengeId }: any) {
  const [leftWidth, setLeftWidth] = useState<number>(760);
  const [loadingNotion, setLoadingNotion] = useState<boolean>(false);
  const [files, setFiles] = useState<File[]>([]);
  const [testResult, setTestResult] = useState({
    passed: 0,
    total: 0,
    failed: 0
  });

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
    const getPresignedUrl = await axios.get(`${BASE_URL}/api/submissions/preSignedUrl/${challengeId}`, {
      headers: {
        Authorization: localStorage.getItem("token")
      }
    });

    const { preSignedUrl, fields } = getPresignedUrl.data;
    //    new Promise(r => setTimeout(r, 1000));

    const zip = new JSZip();

    for (const file of files) {
      // INFO: can also add name of file here , useful in worker after unzipint

      //@ts-ignore
      zip.file(file.path, file);
    }

    const zipFile = await zip.generateAsync({ type: "blob" });
    await sendZippedFile(preSignedUrl, fields, zipFile);

    const response = await confirmFileSent(challengeId);
    const parsedValue = JSON.parse(response);
    setTestResult(parsedValue);
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
        <div className="flex-1 flex flex-col gap-6">
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
            <Card className="h-full flex flex-col justify-center items-center">
              <CardContent className="h-full w-full flex flex-col items-center justify-center p-10">
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
                    <CloudUpload className="mx-auto mb-4" size={48} />
                    <h3 className="text-2xl font-handwriting">Drop zone</h3>
                    <p className="mt-2 text-sm opacity-80">Drop a folder here or click to select a folder</p>
                    <p className="mt-1 text-xs opacity-60">(node_modules will be filtered out)</p>

                    {files.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 gap-2">
                        {files.map((f, idx) => (
                          <div
                            key={idx}
                            className="text-sm bg-muted/50 border px-3 py-2 rounded-md flex items-center justify-between"
                          >
                            <span className="truncate max-w-[220px] font-medium">{f.name}</span>
                            <span className="text-xs text-muted-foreground">{Math.round(f.size / 1024)} KB</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </ResizableBox>

          {/* Bottom stats card */}
          <Card className="h-[260px]">
            <CardHeader>
              <CardTitle className="text-lg">Test results</CardTitle>
            </CardHeader>
            <CardContent className="h-full p-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>Total tests :</div>
                  <div className="font-medium">{testResult.total}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div>Tests passed :</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="inline-flex items-center gap-2">
                      <Check size={14} /> {testResult.passed}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>Failed tests :</div>
                  <div className="font-medium text-rose-400">{testResult.failed}</div>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
