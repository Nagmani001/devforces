"use client";

import { useMemo, useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { WorkspaceEntry } from "@/app/hooks/useCodeWorkspace";

type TreeNode = {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
  file?: WorkspaceEntry;
};

function isBinary(entry?: WorkspaceEntry): boolean {
  return !!entry && entry.blob !== undefined;
}

function buildTree(entries: WorkspaceEntry[]): TreeNode[] {
  const root: TreeNode[] = [];
  const byPath = new Map<string, TreeNode>();
  const addChild = (parent: TreeNode[], node: TreeNode) => {
    parent.push(node);
    parent.sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1));
    return node;
  };

  for (const entry of entries) {
    const segments = entry.path.split("/").filter(Boolean);
    let current = root;
    let acc = "";
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      acc = acc ? `${acc}/${seg}` : seg;
      const isLast = i === segments.length - 1;
      const isDir = entry.path.endsWith("/") && isLast;
      const existing = byPath.get(isDir ? `${acc}/` : acc);
      if (existing) {
        current = existing.children;
        continue;
      }
      const node: TreeNode = {
        name: seg,
        path: isDir ? `${acc}/` : acc,
        isDir: isDir || !isLast,
        children: [],
        file: isLast && !isDir ? entry : undefined,
      };
      byPath.set(node.path, node);
      if (isDir) byPath.set(`${acc}/`, node);
      const created = addChild(current, node);
      current = created.children;
    }
  }
  return root;
}

export function FileTree({
  entries,
  dirtyPaths,
  activePath,
  onSelect,
  onAddFile,
  onAddFolder,
  onRename,
  onDelete,
}: {
  entries: WorkspaceEntry[];
  dirtyPaths: Set<string>;
  activePath: string | null;
  onSelect: (entry: WorkspaceEntry) => void;
  onAddFile: (path: string) => void;
  onAddFolder: (path: string) => void;
  onRename: (oldPath: string, newPath: string) => void;
  onDelete: (path: string) => void;
}) {
  const tree = useMemo(() => buildTree(entries), [entries]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState<"file" | "folder" | null>(null);
  const [addValue, setAddValue] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [hoverPath, setHoverPath] = useState<string | null>(null);

  const toggleCollapsed = (path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const submitAdd = () => {
    const value = addValue.trim();
    if (value) {
      if (adding === "file") onAddFile(value);
      else onAddFolder(value);
    }
    setAdding(null);
    setAddValue("");
  };

  const submitRename = () => {
    const value = renameValue.trim();
    if (renaming && value && value !== renaming) onRename(renaming, value);
    setRenaming(null);
    setRenameValue("");
  };

  const renderNodes = (nodes: TreeNode[], depth: number) => {
    return nodes.map((node) => {
      const isCollapsed = collapsed.has(node.path);
      const isActive = node.path === activePath;
      const isHovered = hoverPath === node.path;
      const isRenaming = renaming === node.path;
      const canRename = !node.isDir || node.children.length === 0;

      if (isRenaming) {
        return (
          <div key={node.path} style={{ paddingLeft: depth * 12 }} className="flex items-center gap-1 pr-2 py-0.5">
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRename();
                if (e.key === "Escape") setRenaming(null);
              }}
              onBlur={submitRename}
              className="h-5 w-full min-w-0 rounded border border-border bg-background px-1.5 text-xs font-mono outline-none"
            />
          </div>
        );
      }

      return (
        <div key={node.path}>
          <div
            style={{ paddingLeft: depth * 12 }}
            className={`group flex items-center gap-1.5 pr-2 py-1 text-[13px] rounded cursor-pointer select-none ${
              isActive ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted/60"
            }`}
            onClick={() => {
              if (node.isDir) toggleCollapsed(node.path);
              else if (node.file) onSelect(node.file);
            }}
            onMouseEnter={() => setHoverPath(node.path)}
            onMouseLeave={() => setHoverPath(null)}
          >
            {node.isDir ? (
              <span className="shrink-0 text-muted-foreground">
                {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </span>
            ) : (
              <span className="w-3.5 shrink-0" />
            )}
            {node.isDir ? (
              isCollapsed ? (
                <Folder className="h-4 w-4 shrink-0 text-sky-500" />
              ) : (
                <FolderOpen className="h-4 w-4 shrink-0 text-sky-500" />
              )
            ) : isBinary(node.file) ? (
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <FileCode2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className={`truncate ${node.isDir ? "font-medium" : "font-mono"}`}>
              {node.name}
              {!node.isDir && node.file && dirtyPaths.has(node.path) && (
                <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-yellow-400 align-middle" />
              )}
            </span>

            {!node.isDir && (isHovered || isActive) && (
              <span className="ml-auto hidden shrink-0 items-center gap-0.5 group-hover:flex">
                {canRename && (
                  <button
                    className="rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
                    title="Rename"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenaming(node.path);
                      setRenameValue(node.path);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
                <button
                  className="rounded p-0.5 text-muted-foreground hover:bg-background hover:text-red-500"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete "${node.path}"?`)) onDelete(node.path);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
          {node.isDir && !isCollapsed && (
            <div>{renderNodes(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
        <button
          className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => {
            setAdding("file");
            setAddValue("");
          }}
          title="New file"
        >
          <FileCode2 className="h-3.5 w-3.5" /> New File
        </button>
        <button
          className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => {
            setAdding("folder");
            setAddValue("");
          }}
          title="New folder"
        >
          <Folder className="h-3.5 w-3.5" /> New Folder
        </button>
      </div>

      {adding && (
        <div className="flex items-center gap-1 border-b border-border px-2 py-1">
          <input
            autoFocus
            placeholder={adding === "file" ? "path/to/file.ext" : "folder-name"}
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitAdd();
              if (e.key === "Escape") {
                setAdding(null);
                setAddValue("");
              }
            }}
            onBlur={submitAdd}
            className="h-5 w-full min-w-0 rounded border border-border bg-background px-1.5 text-xs font-mono outline-none"
          />
          <button className="text-muted-foreground hover:text-foreground" onClick={submitAdd}>
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              setAdding(null);
              setAddValue("");
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-1.5">{renderNodes(tree, 0)}</div>
    </div>
  );
}
