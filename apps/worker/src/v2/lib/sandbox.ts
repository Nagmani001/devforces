import axios from "axios";
import { LogsManager } from "./logsManager";
import {
  claimFreePod,
  copyDirToPod,
  createWarmPod,
  execInPod,
  patchStatus,
  waitForPodRunning,
  APP_CONTAINER,
} from "./k8s";

const APP_PORT = Number(process.env.APP_PORT || 8000);
const APP_HEALTH_PATH = process.env.APP_HEALTH_PATH || "/health";

export async function claimOrCreateSandbox(
  challengeId: string,
  logsManager: LogsManager,
) {
  try {
    return await claimFreePod(challengeId);
  } catch {
    await logsManager.addLog(" No free pod — creating warm pod on demand...");
    const created = await createWarmPod(challengeId);
    await waitForPodRunning(created.metadata!.name!);
    return claimFreePod(challengeId);
  }
}

export async function injectCode(podName: string, projectPath: string) {
  await copyDirToPod(podName, APP_CONTAINER, projectPath, "/app/code");
}

export async function restartApp(podName: string) {
  await execInPod(
    podName,
    APP_CONTAINER,
    "pkill -f '[n]ode .*src/index.js' || true; sleep 1",
  );
}

export async function waitForAppHealth(
  podIp: string,
  logsManager: LogsManager,
) {
  let healthCheckAttempts = 0;
  const maxHealthCheckAttempts = 30;

  while (true) {
    try {
      await axios.get(`http://${podIp}:${APP_PORT}${APP_HEALTH_PATH}`, {
        timeout: 2000,
      });
      await logsManager.addLog(
        healthCheckAttempts > 0
          ? ` Service is healthy (after ${healthCheckAttempts} attempt${healthCheckAttempts > 1 ? "s" : ""})`
          : " Service is ready",
      );
      await logsManager.addLog(" Starting test execution...");
      return;
    } catch {
      healthCheckAttempts++;
      if (healthCheckAttempts >= maxHealthCheckAttempts) {
        throw new Error("Service failed to become healthy");
      }
      if (healthCheckAttempts % 5 === 0) {
        await logsManager.addLog(
          ` Still waiting for service... (attempt ${healthCheckAttempts}/${maxHealthCheckAttempts})`,
        );
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

export async function releaseSandbox(podName: string) {
  await execInPod(
    podName,
    APP_CONTAINER,
    "rm -rf /app/code/* 2>/dev/null || true",
  );
  await patchStatus(podName, "free");
}
