import prisma from "@repo/db/client";
import { createWarmPod, deletePod, listSandboxPods } from "./k8s";

const WARM_PODS_PER_CHALLENGE = Number(
  process.env.WARM_PODS_PER_CHALLENGE || 5,
);
const RECONCILE_INTERVAL_MS = Number(
  process.env.RECONCILE_INTERVAL_MS || 30_000,
);

export async function reconcileWarmPool(): Promise<void> {
  const contests = await prisma.contest.findMany({
    where: { isDeleted: false, startsAt: { lte: new Date() } },
    select: { challenges: { select: { id: true } } },
  });
  const challengeIds = [
    ...new Set(contests.flatMap((c) => c.challenges.map((ch) => ch.id))),
  ];

  for (const challengeId of challengeIds) {
    const free = await listSandboxPods(challengeId, "free");
    const healthy = free.filter((p) => p.status?.phase === "Running");
    const missing = WARM_PODS_PER_CHALLENGE - healthy.length;
    for (let i = 0; i < missing; i++) {
      try {
        await createWarmPod(challengeId);
      } catch (err) {
        console.error(
          `reconcile: failed to create warm pod for ${challengeId}`,
          err,
        );
      }
    }

    const all = await listSandboxPods(challengeId);
    for (const p of all) {
      const phase = p.status?.phase;
      if (phase === "Failed" || phase === "Succeeded") {
        try {
          await deletePod(p.metadata!.name!);
        } catch {}
      }
    }
  }
}

export function startPoolReconciliation(): void {
  reconcileWarmPool().catch(console.error);
  setInterval(
    () => reconcileWarmPool().catch(console.error),
    RECONCILE_INTERVAL_MS,
  );
}
