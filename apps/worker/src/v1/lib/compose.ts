import util from "util";
import { exec as execCb } from "child_process";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { LogsManager } from "./logsManager";

const exec = util.promisify(execCb);

export function projectName(id: string) {
  return `devforces-${id}`;
}

export async function sanitizeComposeFile(projectPath: string): Promise<void> {
  const composePath = path.join(projectPath, "docker-compose.yml");
  const composeContent = await readFile(composePath, "utf-8");
  const sanitizedCompose = composeContent
    .replace(/^\s*container_name:.*$/gm, "")
    .replace(/^\s*version:.*$/gm, "")
    .replace(/(-\s*["']?)(\d+):(\d+)(["']?)/g, "$1$3$4");
  await writeFile(composePath, sanitizedCompose);
}

async function streamExecOutput(
  command: string,
  logsManager: LogsManager,
): Promise<void> {
  const result = await exec(command);
  const output = result.stdout || result.stderr || "";
  for (const line of output.split("\n").filter((l: string) => l.trim())) {
    await logsManager.addLog(`   ${line.trim()}`);
  }
}

export async function buildImage(
  projectPath: string,
  project: string,
  logsManager: LogsManager,
): Promise<void> {
  await streamExecOutput(
    `cd "${projectPath}" && docker compose -p "${project}" build --no-cache`,
    logsManager,
  );
}

export async function startContainers(
  projectPath: string,
  project: string,
  logsManager: LogsManager,
): Promise<void> {
  await streamExecOutput(
    `cd "${projectPath}" && docker compose -p "${project}" up -d`,
    logsManager,
  );
}

export async function lookupBackendPort(
  projectPath: string,
  project: string,
): Promise<string> {
  const portLookup = await exec(
    `cd "${projectPath}" && docker compose -p "${project}" port backend 8000`,
  );
  const portMatch = (portLookup.stdout || "").trim().match(/:(\d+)$/);
  if (!portMatch) {
    throw new Error(
      `Could not determine host port for backend service. Got: ${portLookup.stdout}`,
    );
  }
  return portMatch[1]!;
}

export async function stopAndRemoveContainers(
  projectPath: string,
  project: string,
): Promise<void> {
  await exec(
    `cd "${projectPath}" && docker compose -p "${project}" down --rmi all`,
  );
}
