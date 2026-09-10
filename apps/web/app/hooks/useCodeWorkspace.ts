"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type WorkspaceEntry = {
  path: string;
  text?: string;
  blob?: Blob;
};

export type WorkspaceLoadStatus = "idle" | "loading" | "ready" | "error";

type PersistedWorkspace = {
  base: Record<string, string>;
  entries: WorkspaceEntry[];
  updatedAt: number;
};

const DB_NAME = "devforces-workspace";
const DB_STORE = "workspaces";
const SAVE_DEBOUNCE_MS = 600;
const IGNORED_SEGMENTS = ["node_modules", ".git", "dist"];
const MAX_FILE_BYTES = 2 * 1024 * 1024;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(DB_STORE)) {
        req.result.createObjectStore(DB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readonly");
    const req = tx.objectStore(DB_STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function isIgnoredPath(path: string): boolean {
  const segments = path.split("/");
  return segments.some((s) => IGNORED_SEGMENTS.includes(s));
}

function isBinaryBlob(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer);
  const sampleLength = Math.min(bytes.length, 8000);
  for (let i = 0; i < sampleLength; i++) {
    if (bytes[i] === 0) return true;
  }
  return false;
}

async function blobToText(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  return new TextDecoder("utf-8").decode(buffer);
}

function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

async function fetchWithTimeout(url: string, ms = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchBaseRepo(url: string): Promise<{ entries: WorkspaceEntry[]; base: Record<string, string> }> {
  const parsed = parseGithubUrl(url);
  if (!parsed) throw new Error("Invalid base repository URL");
  const owner = parsed.owner;
  const repo = parsed.repo;

  const metaRes = await fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}`);
  if (!metaRes.ok) {
    throw new Error(`Could not reach GitHub repo (${metaRes.status})`);
  }
  const meta = await metaRes.json();
  const branch: string = meta.default_branch ?? "main";

  const treeRes = await fetchWithTimeout(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
  );
  if (!treeRes.ok) {
    throw new Error(`Could not load repository tree (${treeRes.status})`);
  }
  const tree = await treeRes.json();
  const blobs: { path: string; size?: number }[] = (tree.tree ?? []).filter(
    (t: { type?: string; path?: string }) => t.type === "blob" && !!t.path && !isIgnoredPath(t.path!)
  );

  const entries: WorkspaceEntry[] = [];
  const base: Record<string, string> = {};
  let index = 0;

  async function worker() {
    while (index < blobs.length) {
      const blob = blobs[index++];
      if (!blob.path) continue;
      if ((blob.size ?? 0) > MAX_FILE_BYTES) continue;
      const rawRes = await fetchWithTimeout(
        `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${blob.path}`
      );
      if (!rawRes.ok) continue;
      const buffer = await rawRes.arrayBuffer();
      const text = new TextDecoder("utf-8").decode(buffer);
      entries.push({ path: blob.path, text });
      base[blob.path] = text;
    }
  }

  await Promise.all(Array.from({ length: 8 }, () => worker()));
  entries.sort((a, b) => a.path.localeCompare(b.path));
  return { entries, base };
}

async function filesToZip(entries: WorkspaceEntry[]): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const entry of entries) {
    if (entry.path.endsWith("/")) {
      zip.folder(entry.path.replace(/\/$/, ""));
      continue;
    }
    if (isIgnoredPath(entry.path)) continue;
    if (entry.text !== undefined) {
      zip.file(entry.path, entry.text);
    } else if (entry.blob !== undefined) {
      zip.file(entry.path, entry.blob);
    }
  }
  return zip.generateAsync({ type: "blob" });
}

function sortEntries(entries: WorkspaceEntry[]): WorkspaceEntry[] {
  return [...entries].sort((a, b) => {
    const aIsDir = a.path.endsWith("/");
    const bIsDir = b.path.endsWith("/");
    if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
    return a.path.localeCompare(b.path);
  });
}

export function useCodeWorkspace({
  storageKey,
  baseGithubUrl,
  enabled = true,
}: {
  storageKey: string;
  baseGithubUrl: string;
  enabled?: boolean;
}) {
  const [status, setStatus] = useState<WorkspaceLoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<WorkspaceEntry[]>([]);
  const [base, setBase] = useState<Record<string, string>>({});
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    async (nextEntries: WorkspaceEntry[], nextBase: Record<string, string>) => {
      if (!storageKey) return;
      const payload: PersistedWorkspace = {
        base: nextBase,
        entries: nextEntries,
        updatedAt: Date.now(),
      };
      await idbSet(storageKey, payload).catch(() => {});
    },
    [storageKey]
  );

  const scheduleSave = useCallback(
    (nextEntries: WorkspaceEntry[], nextBase: Record<string, string>) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => persist(nextEntries, nextBase), SAVE_DEBOUNCE_MS);
    },
    [persist]
  );

  const seedFromBase = useCallback(
    async (githubUrl: string) => {
      setStatus("loading");
      setError(null);
      try {
        const { entries: fetched, base: fetchedBase } = await fetchBaseRepo(githubUrl);
        setEntries(sortEntries(fetched));
        setBase(fetchedBase);
        await persist(fetched, fetchedBase);
        setStatus("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load starter repository");
        setStatus("error");
      }
    },
    [persist]
  );

  useEffect(() => {
    if (!enabled || !storageKey) return;

    let cancelled = false;
    (async () => {
      const existing = await idbGet<PersistedWorkspace>(storageKey).catch(() => undefined);
      if (cancelled) return;
      if (existing && existing.entries.length > 0) {
        setEntries(sortEntries(existing.entries));
        setBase(existing.base ?? {});
        setStatus("ready");
        return;
      }
      if (baseGithubUrl) {
        await seedFromBase(baseGithubUrl);
      } else {
        setStatus("ready");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, storageKey, baseGithubUrl, seedFromBase]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const dirtyPaths = useMemo(() => {
    const dirty = new Set<string>();
    for (const entry of entries) {
      if (entry.path.endsWith("/")) continue;
      if (entry.text === undefined) continue;
      const baseText = base[entry.path];
      if (baseText === undefined || baseText !== entry.text) {
        dirty.add(entry.path);
      }
    }
    return dirty;
  }, [entries, base]);

  const createFile = useCallback(
    (path: string) => {
      const cleanPath = path.trim().replace(/^\/+/, "");
      if (!cleanPath || cleanPath.endsWith("/")) return false;
      if (entries.some((e) => e.path === cleanPath)) return false;
      const next = sortEntries([...entries, { path: cleanPath, text: "" }]);
      setEntries(next);
      scheduleSave(next, base);
      return true;
    },
    [entries, base, scheduleSave]
  );

  const createFolder = useCallback(
    (folderPath: string) => {
      const cleanPath = folderPath.trim().replace(/^\/+/, "");
      if (!cleanPath) return false;
      const normalized = cleanPath.endsWith("/") ? cleanPath : `${cleanPath}/`;
      if (entries.some((e) => e.path === normalized)) return false;
      const next = sortEntries([...entries, { path: normalized }]);
      setEntries(next);
      scheduleSave(next, base);
      return true;
    },
    [entries, base, scheduleSave]
  );

  const updateFile = useCallback(
    (path: string, text: string) => {
      let found = false;
      const next = entries.map((entry) => {
        if (entry.path === path) {
          found = true;
          return { path, text };
        }
        return entry;
      });
      if (!found) {
        next.push({ path, text });
      }
      const sorted = sortEntries(next);
      setEntries(sorted);
      scheduleSave(sorted, base);
    },
    [entries, base, scheduleSave]
  );

  const renameEntry = useCallback(
    (oldPath: string, newPath: string) => {
      const cleanPath = newPath.trim().replace(/^\/+/, "");
      if (!cleanPath || oldPath === cleanPath) return false;
      if (entries.some((e) => e.path === cleanPath)) return false;

      const isDir = oldPath.endsWith("/");
      const normalizedNew = isDir ? (cleanPath.endsWith("/") ? cleanPath : `${cleanPath}/`) : cleanPath;

      const next: WorkspaceEntry[] = [];
      const nextBase = { ...base };
      for (const entry of entries) {
        if (entry.path === oldPath) {
          next.push({ ...entry, path: normalizedNew });
          const baseText = base[oldPath];
          if (baseText !== undefined) {
            delete nextBase[oldPath];
            if (!isDir) nextBase[normalizedNew] = baseText;
          }
        } else if (isDir && entry.path.startsWith(oldPath)) {
          const suffix = entry.path.slice(oldPath.length);
          next.push({ ...entry, path: `${normalizedNew}${suffix}` });
          const baseText = base[entry.path];
          if (baseText !== undefined) {
            delete nextBase[entry.path];
            nextBase[`${normalizedNew}${suffix}`] = baseText;
          }
        } else {
          next.push(entry);
        }
      }
      setEntries(sortEntries(next));
      setBase(nextBase);
      scheduleSave(next, nextBase);
      return true;
    },
    [entries, base, scheduleSave]
  );

  const deleteEntry = useCallback(
    (path: string) => {
      const isDir = path.endsWith("/");
      const next = entries.filter((entry) => entry.path !== path && !(isDir && entry.path.startsWith(path)));
      const nextBase = { ...base };
      for (const key of Object.keys(nextBase)) {
        if (key === path || (isDir && key.startsWith(path))) delete nextBase[key];
      }
      setEntries(sortEntries(next));
      setBase(nextBase);
      scheduleSave(next, nextBase);
      return true;
    },
    [entries, base, scheduleSave]
  );

  type LocalFileWithPath = File & { webkitRelativePath?: string; path?: string };

  const importLocalFiles = useCallback(
    async (fileList: FileList): Promise<{ imported: number; skipped: number }> => {
      const localFiles = Array.from(fileList).filter((file) => {
        const relPath = (file as LocalFileWithPath).webkitRelativePath || (file as LocalFileWithPath).path || file.name;
        return relPath && !isIgnoredPath(relPath);
      });

      const incoming: WorkspaceEntry[] = [];
      for (const file of localFiles) {
        const relPath = (file as LocalFileWithPath).webkitRelativePath || (file as LocalFileWithPath).path || file.name;
        if (file.size > MAX_FILE_BYTES) continue;
        const buffer = await file.arrayBuffer();
        if (isBinaryBlob(buffer)) {
          incoming.push({ path: relPath, blob: file });
        } else {
          incoming.push({ path: relPath, text: await blobToText(file) });
        }
      }

      // A locally cloned repo is dropped with its top-level folder name baked
      // into webkitRelativePath (e.g. "with-database/src/index.ts"). If every
      // imported file shares the same first path segment, strip it so the
      // workspace mirrors the repo root (matching the base-repo / editor shape).
      const firstSegments = new Set(incoming.map((entry) => entry.path.split("/")[0]));
      if (incoming.length > 1 && firstSegments.size === 1 && incoming[0].path.includes("/")) {
        const prefix = `${incoming[0].path.split("/")[0]}/`;
        for (const entry of incoming) entry.path = entry.path.replace(prefix, "");
      }

      const merged = new Map<string, WorkspaceEntry>();
      for (const entry of sortEntries(entries)) merged.set(entry.path, entry);
      for (const entry of incoming) merged.set(entry.path, entry);

      const next = sortEntries(Array.from(merged.values()));
      setEntries(next);
      await persist(next, base);
      return { imported: localFiles.length, skipped: localFiles.length - incoming.length };
    },
    [entries, base, persist]
  );

  const resetToBase = useCallback(async () => {
    if (baseGithubUrl) {
      await seedFromBase(baseGithubUrl);
    } else {
      setEntries([]);
      setBase({});
      await persist([], {});
      setStatus("ready");
    }
  }, [baseGithubUrl, persist, seedFromBase]);

  const getZip = useCallback(async () => filesToZip(entries), [entries]);

  return {
    status,
    error,
    entries,
    base,
    dirtyPaths,
    createFile,
    createFolder,
    updateFile,
    renameEntry,
    deleteEntry,
    importLocalFiles,
    resetToBase,
    getZip,
  };
}
