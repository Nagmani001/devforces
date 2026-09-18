import path from "path";
import util from "util";
import { exec as execCb, spawn } from "child_process";
import { access, mkdir, readFile, stat, writeFile } from "fs/promises";
import axios from "axios";
import { LogsManager } from "./logsManager";
import { WORK_DIR } from "./utils";

const exec = util.promisify(execCb);

export const WORKER_PKG_DIR = path.resolve(__dirname, "..", "..", "..");
export const TEST_DIR = path.join(WORKER_PKG_DIR, "work");

export async function prepareTestFile(
  id: string,
  testFile: string,
  backendHostPort: string,
): Promise<string> {
  await mkdir(TEST_DIR, { recursive: true });
  const testFilePath = path.join(TEST_DIR, `${id}.test.ts`);
  const rewrittenTestFile = testFile.replace(
    /(localhost|127\.0\.0\.1):8000/g,
    `localhost:${backendHostPort}`,
  );
  await writeFile(testFilePath, rewrittenTestFile);
  return testFilePath;
}

export async function waitForHealth(
  backendHostPort: string,
  logsManager: LogsManager,
): Promise<number> {
  let healthCheckAttempts = 0;
  let numberOfErrors = 0;
  const maxHealthCheckAttempts = 30;

  while (true) {
    try {
      await axios.get(`http://localhost:${backendHostPort}/health`, {
        timeout: 2000,
      });
      if (healthCheckAttempts > 0) {
        await logsManager.addLog(
          ` Service is healthy (after ${healthCheckAttempts} attempt${healthCheckAttempts > 1 ? "s" : ""})`,
        );
      } else {
        await logsManager.addLog(" Service is ready");
      }
      await logsManager.addLog(" Starting test execution...");
      return numberOfErrors;
    } catch {
      numberOfErrors++;
      healthCheckAttempts++;

      if (healthCheckAttempts >= maxHealthCheckAttempts) {
        await logsManager.addLog(
          ` Service health check failed after ${maxHealthCheckAttempts} attempts`,
          "error",
        );
        throw new Error("Service failed to become healthy");
      }

      if (healthCheckAttempts % 5 === 0) {
        await logsManager.addLog(
          ` Still waiting for service... (attempt ${healthCheckAttempts}/${maxHealthCheckAttempts})`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

export interface TestRunOutcome {
  result: { passed: number; total: number; failed: number };
  executionExitedNonZero: boolean;
}

export async function runTests(
  testFilePath: string,
  resultsJsonPath: string,
  totalTestCases: number,
  logsManager: LogsManager,
): Promise<TestRunOutcome> {
  await logsManager.addLog(` Executing ${totalTestCases} test cases...`);

  console.log("[DIAG] process.cwd", process.cwd());
  console.log("[DIAG] __dirname", __dirname);
  console.log("[DIAG] node version", process.version);
  console.log("[DIAG] platform", process.platform, process.arch);
  console.log("[DIAG] testFilePath", testFilePath);
  console.log("[DIAG] resultsJsonPath", resultsJsonPath);
  console.log("[DIAG] WORK_DIR", WORK_DIR);
  console.log("[DIAG] PATH", process.env.PATH);
  try {
    const statResult = await stat(testFilePath);
    console.log("[DIAG] testFile size", statResult.size);
  } catch (e: any) {
    console.log("[DIAG] testFile stat ERROR", e?.message);
  }
  try {
    const which = await exec(
      "which npx && which vitest 2>/dev/null; npx --version; node --version",
    );
    console.log("[DIAG] which", which.stdout, which.stderr);
  } catch (e: any) {
    console.log("[DIAG] which ERROR", e?.message);
  }
  try {
    const ls = await exec(
      "ls -la node_modules/.bin/vitest 2>&1; ls -la /app/node_modules/.bin/vitest 2>&1",
    );
    console.log("[DIAG] vitest bin", ls.stdout);
  } catch (e: any) {
    console.log("[DIAG] vitest bin ERROR", e?.message);
  }

  const vitestCandidates = [
    path.join(WORKER_PKG_DIR, "node_modules", ".bin", "vitest"),
    path.resolve(WORKER_PKG_DIR, "..", "..", "node_modules", ".bin", "vitest"),
    "/app/node_modules/.bin/vitest",
  ];
  let vitestBin: string | null = null;
  for (const c of vitestCandidates) {
    try {
      await access(c);
      vitestBin = c;
      break;
    } catch {}
  }
  console.log("[DIAG] resolved vitest bin", vitestBin);

  const vitestExitCode: number = await new Promise<number>((resolve) => {
    console.log("[DIAG] spawning vitest...");
    const args = [
      "run",
      testFilePath,
      "--reporter=default",
      "--reporter=json",
      `--outputFile.json=${resultsJsonPath}`,
    ];
    const env = { ...process.env, FORCE_COLOR: "0", CI: "true" };
    const child = vitestBin
      ? spawn(vitestBin, args, { cwd: WORKER_PKG_DIR, env })
      : spawn("npx", ["vitest", ...args], { cwd: WORKER_PKG_DIR, env });
    console.log("[DIAG] spawn pid", child.pid);

    let buffer = "";
    const collect = (buf: Buffer) => {
      const chunk = buf.toString("utf-8");
      process.stdout.write("[VITEST RAW] " + chunk);
      buffer += chunk.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");
    };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);

    const emitSummary = async () => {
      const summaryRe = /^\s*(Test Files|Tests|Start at|Duration|Snapshots)\s/;
      const testLineRe = /^\s*(✓|✗|×|PASS|FAIL)\s/;
      const lines = buffer.split("\n");
      for (const l of lines) {
        if (testLineRe.test(l)) await logsManager.addLog(l.trim());
      }
      for (const l of lines) {
        if (summaryRe.test(l)) await logsManager.addLog(l.trim());
      }
    };
    child.on("close", async (code: number | null) => {
      await emitSummary();
      resolve(code ?? 1);
    });
    child.on("error", async () => {
      await emitSummary();
      resolve(1);
    });
  });

  console.log("[DIAG] vitest exit code", vitestExitCode);
  try {
    const jstat = await stat(resultsJsonPath);
    console.log("[DIAG] json file size", jstat.size);
  } catch (e: any) {
    console.log("[DIAG] json file MISSING", e?.message);
  }

  const executionExitedNonZero = vitestExitCode !== 0;

  let parsed: any = null;
  try {
    parsed = JSON.parse(await readFile(resultsJsonPath, "utf-8"));
  } catch {
    await logsManager.addLog(
      " Could not read vitest results — test file failed to load (server crash, import error, syntax error)",
      "error",
    );
  }

  let numberOfPassedTestCases = 0;
  let numberOfFailedTestCases = totalTestCases;
  if (parsed && typeof parsed.numPassedTests === "number") {
    numberOfPassedTestCases = parsed.numPassedTests;
    numberOfFailedTestCases =
      (parsed.numFailedTests || 0) + (parsed.numPendingTests || 0);
    const failNames: string[] = [];
    for (const tr of parsed.testResults || []) {
      for (const a of tr.assertionResults || []) {
        if (a.status === "failed" && failNames.length < 5) {
          failNames.push(a.fullName || a.title);
        }
      }
    }
    for (const n of failNames) await logsManager.addLog(`   x ${n}`, "error");
  } else {
    numberOfPassedTestCases = 0;
    numberOfFailedTestCases = totalTestCases;
  }

  const result = {
    passed: numberOfPassedTestCases,
    total: totalTestCases,
    failed: numberOfFailedTestCases,
  };

  if (
    !executionExitedNonZero &&
    numberOfPassedTestCases === totalTestCases &&
    numberOfFailedTestCases === 0
  ) {
    await logsManager.addLog(
      ` All tests passed! (${numberOfPassedTestCases}/${totalTestCases})`,
    );
  } else {
    await logsManager.addLog(
      `  Tests completed: ${numberOfPassedTestCases} passed, ${numberOfFailedTestCases} failed (${totalTestCases} total)`,
      "error",
    );
  }

  return { result, executionExitedNonZero };
}
