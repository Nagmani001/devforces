import { LogsManager } from "./logsManager";
import { execInPod, writeFileToPod, TESTER_CONTAINER } from "./k8s";

export interface TestRunOutcome {
  result: { passed: number; total: number; failed: number };
  executionExitedNonZero: boolean;
}

function createVitestStreamer(logsManager: LogsManager) {
  let buffer = "";
  return (chunk: string) => {
    buffer += chunk.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      if (/^(✓|✗|×|PASS|FAIL)\s/.test(t)) logsManager.addLog(t);
      if (/^(Test Files|Tests|Start at|Duration|Snapshots)\s/.test(t))
        logsManager.addLog(t);
    }
  };
}

export async function runTests(
  podName: string,
  id: string,
  testFile: string,
  totalTestCases: number,
  logsManager: LogsManager,
): Promise<TestRunOutcome> {
  await logsManager.addLog(` Executing ${totalTestCases} test cases...`);

  const testFileName = `${id}.test.ts`;
  const resultsJsonPath = `/app/code/vitest-${id}.json`;
  await writeFileToPod(
    podName,
    TESTER_CONTAINER,
    `/app/code/${testFileName}`,
    testFile,
  );
  await logsManager.addLog(" Test file written to sandbox");

  const { code: vitestExitCode } = await execInPod(
    podName,
    TESTER_CONTAINER,
    `cd /app/code && vitest run ${testFileName} --reporter=default --reporter=json --outputFile.json=${resultsJsonPath}`,
    createVitestStreamer(logsManager),
  );
  const executionExitedNonZero = vitestExitCode !== 0;

  let parsed: any = null;
  const { output: jsonText } = await execInPod(
    podName,
    TESTER_CONTAINER,
    `cat ${resultsJsonPath}`,
  );
  try {
    parsed = JSON.parse(jsonText);
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
    for (const n of failNames) {
      await logsManager.addLog(`   x ${n}`, "error");
    }
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
