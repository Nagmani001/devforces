import * as k8s from "@kubernetes/client-node";
import { spawn } from "child_process";
import { Readable, Writable } from "stream";
import { StringDecoder } from "string_decoder";

let kc: k8s.KubeConfig | undefined;
let coreV1: k8s.CoreV1Api | undefined;

function getKc(): k8s.KubeConfig {
  if (!kc) {
    kc = new k8s.KubeConfig();
    kc.loadFromDefault();
  }
  return kc;
}

function api(): k8s.CoreV1Api {
  if (!coreV1) {
    coreV1 = getKc().makeApiClient(k8s.CoreV1Api);
  }
  return coreV1;
}

export const NAMESPACE = process.env.K8S_NAMESPACE || "devforces";
export const ROLE_LABEL = "devforces.io/role";
export const CHALLENGE_LABEL = "challenge";
export const STATUS_LABEL = "status";
export const APP_CONTAINER = "app";
export const TESTER_CONTAINER = "tester";

export const IMAGE_REGISTRY =
  process.env.IMAGE_REGISTRY || "ghcr.io/nagmani001/devforces";
export const CHALLENGE_BASE_IMAGE = (challengeId: string) =>
  `${IMAGE_REGISTRY}/challenge-base:${challengeId}`;
export const TEST_RUNNER_IMAGE =
  process.env.TEST_RUNNER_IMAGE || `${IMAGE_REGISTRY}/test-runner:latest`;

export function sandboxSelector(challengeId: string) {
  return `${ROLE_LABEL}=sandbox,${CHALLENGE_LABEL}=${challengeId}`;
}

export function patchStatus(name: string, status: "free" | "busy") {
  return api().patchNamespacedPod({
    name,
    namespace: NAMESPACE,
    body: [
      { op: "add", path: `/metadata/labels/${STATUS_LABEL}`, value: status },
    ],
  });
}

export async function listSandboxPods(challengeId: string, status?: string) {
  const labelSelector = status
    ? `${sandboxSelector(challengeId)},${STATUS_LABEL}=${status}`
    : sandboxSelector(challengeId);
  const res = await api().listNamespacedPod({
    namespace: NAMESPACE,
    labelSelector,
  });
  return (res.items || []).filter((p) => !p.metadata?.deletionTimestamp);
}

export async function claimFreePod(challengeId: string): Promise<k8s.V1Pod> {
  const pods = await listSandboxPods(challengeId, "free");
  for (const pod of pods) {
    if (pod.status?.phase !== "Running") continue;
    try {
      await patchStatus(pod.metadata!.name!, "busy");
      return pod;
    } catch {}
  }
  throw new Error(`No free sandbox pod for challenge ${challengeId}`);
}

export async function createWarmPod(challengeId: string): Promise<k8s.V1Pod> {
  return api().createNamespacedPod({
    namespace: NAMESPACE,
    body: {
      metadata: {
        generateName: `warmpool-${challengeId}-`,
        labels: {
          [ROLE_LABEL]: "sandbox",
          [CHALLENGE_LABEL]: challengeId,
          [STATUS_LABEL]: "free",
        },
      },
      spec: {
        runtimeClassName: "gvisor",
        automountServiceAccountToken: false,
        nodeSelector: { "devforces.io/pool": "sandbox" },
        tolerations: [
          {
            key: "devforces.io/sandbox",
            operator: "Exists",
            effect: "NoSchedule",
          },
        ],
        containers: [
          {
            name: APP_CONTAINER,
            image: CHALLENGE_BASE_IMAGE(challengeId),
            ports: [{ containerPort: 8000 }],
            securityContext: {
              runAsNonRoot: true,
              allowPrivilegeEscalation: false,
              capabilities: { drop: ["ALL"] },
            },
            resources: { limits: { cpu: "1", memory: "1Gi" } },
            volumeMounts: [{ name: "code", mountPath: "/app/code" }],
          },
          {
            name: TESTER_CONTAINER,
            image: TEST_RUNNER_IMAGE,
            command: ["/bin/sh", "-c", "sleep infinity"],
            volumeMounts: [{ name: "code", mountPath: "/app/code" }],
          },
        ],
        volumes: [{ name: "code", emptyDir: {} }],
      },
    } as k8s.V1Pod,
  });
}

export async function deletePod(name: string) {
  return api().deleteNamespacedPod({ name, namespace: NAMESPACE });
}

export async function waitForPodRunning(
  name: string,
  timeoutMs = 120_000,
): Promise<k8s.V1Pod> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await api().readNamespacedPod({ name, namespace: NAMESPACE });
    if (res.status?.phase === "Running") return res;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`Pod ${name} did not become Running within ${timeoutMs}ms`);
}

export interface ExecResult {
  code: number;
  output: string;
}

function extractExitCode(output: string, statusMessage?: string): number {
  const m = output.match(/__EXIT_CODE__=(\d+)\s*$/m);
  if (m) return parseInt(m[1]!, 10);
  if (statusMessage) {
    const n = statusMessage.match(/exit code[: ]+(\d+)/i);
    if (n) return parseInt(n[1]!, 10);
  }
  return 0;
}

function makeSink(onData?: (chunk: string) => void): {
  writable: Writable;
  read: () => string;
} {
  let output = "";
  const decoder = new StringDecoder("utf-8");
  const writable = new Writable({
    write(chunk, _enc, cb) {
      const text = decoder.write(chunk);
      output += text;
      if (onData) onData(text);
      cb();
    },
  });
  return { writable, read: () => output };
}

export function execInPod(
  podName: string,
  container: string,
  command: string,
  onData?: (chunk: string) => void,
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const sink = makeSink(onData);
    const stdin = new Readable({ read() {} });
    const wrapped = `${command}; printf '\\n__EXIT_CODE__=%s\\n' "$?"`;
    new k8s.Exec(getKc())
      .exec(
        NAMESPACE,
        podName,
        container,
        ["/bin/sh", "-c", wrapped],
        sink.writable,
        sink.writable,
        stdin,
        false,
        (status) => {
          const msg = status.message || "";
          if (status.status === "Failure" && !/exit code/i.test(msg)) {
            reject(new Error(msg || "exec failed"));
            return;
          }
          setTimeout(
            () =>
              resolve({
                code: extractExitCode(sink.read(), msg),
                output: sink.read(),
              }),
            150,
          );
        },
      )
      .catch(reject);
  });
}

export function copyDirToPod(
  podName: string,
  container: string,
  localDir: string,
  remoteDir: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const sink = makeSink();
    const tar = spawn("tar", ["-C", localDir, "-czf", "-", "."]);
    const cmd = `rm -rf ${remoteDir} && mkdir -p ${remoteDir} && tar -xzf - -C ${remoteDir}`;
    let settled = false;
    const done = (err?: Error) => {
      if (settled) return;
      settled = true;
      err ? reject(err) : resolve();
    };
    new k8s.Exec(getKc())
      .exec(
        NAMESPACE,
        podName,
        container,
        ["/bin/sh", "-c", cmd],
        sink.writable,
        sink.writable,
        tar.stdout,
        false,
        (status) => {
          if (status.status === "Failure")
            done(new Error(status.message || "code injection failed"));
          else done();
        },
      )
      .catch(done);
    tar.on("error", done);
  });
}

export function writeFileToPod(
  podName: string,
  container: string,
  remotePath: string,
  content: string | Buffer,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const sink = makeSink();
    const input = Readable.from([content]);
    new k8s.Exec(getKc())
      .exec(
        NAMESPACE,
        podName,
        container,
        ["/bin/sh", "-c", `cat > ${remotePath}`],
        sink.writable,
        sink.writable,
        input,
        false,
        (status) => {
          if (status.status === "Failure")
            reject(new Error(status.message || "write to pod failed"));
          else resolve();
        },
      )
      .catch(reject);
  });
}
