"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FilePlus, Folder as FolderIcon, FolderPlus, Pencil, Trash2 } from "lucide-react";
import { useActionState } from "react";
import { cn } from "@/lib/utils";
import { statusBadgeClasses } from "@/lib/domain/formatField";
import {
  createFolderAction,
  deleteFolderAction,
  moveItemToFolderAction,
  renameFolderAction,
  type FolderFormState,
} from "./folder-actions";

type FolderNode = { id: string; name: string };
type FlatFolder = { id: string; name: string; depth: number };
type ItemNode = { id: string; humanCode: string; title: string; status: string };

function NewFolderForm({
  action,
  onDone,
}: {
  action: (prevState: FolderFormState, formData: FormData) => Promise<FolderFormState>;
  onDone: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(async (prev: FolderFormState, fd: FormData) => {
    const result = await action(prev, fd);
    if (!result.error) {
      router.refresh();
      onDone();
    }
    return result;
  }, {});

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input
        name="name"
        autoFocus
        required
        placeholder="Folder name"
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {pending ? "Creating…" : "Create"}
      </button>
      <button type="button" onClick={onDone} className="text-sm text-neutral-500 hover:underline">
        Cancel
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

function FolderCard({
  slug,
  currentFolderId,
  folder,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  slug: string;
  currentFolderId: string | null;
  folder: FolderNode;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);

  if (renaming) {
    return (
      <form
        action={async (fd) => {
          await renameFolderAction(fd);
          router.refresh();
          setRenaming(false);
        }}
        className="flex items-center gap-1 rounded-lg border border-neutral-300 p-2 dark:border-neutral-700"
      >
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="folderId" value={folder.id} />
        <input
          name="name"
          defaultValue={folder.name}
          autoFocus
          required
          className="min-w-0 flex-1 rounded-md border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button type="submit" className="text-xs text-neutral-600 hover:underline dark:text-neutral-400">
          Save
        </button>
        <button type="button" onClick={() => setRenaming(false)} className="text-xs text-neutral-500 hover:underline">
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg border p-2.5 transition-colors",
        isDragOver
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
          : "border-neutral-200 dark:border-neutral-800"
      )}
    >
      <Link
        href={`/items/${slug}?folder=${folder.id}`}
        className="flex min-w-0 flex-1 items-center gap-2 text-sm"
      >
        <FolderIcon className="h-4 w-4 shrink-0 text-amber-500" />
        <span className="truncate">{folder.name}</span>
      </Link>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setRenaming(true)}
          aria-label={`Rename ${folder.name}`}
          className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <form
          action={async (fd) => {
            await deleteFolderAction(fd);
          }}
        >
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="folderId" value={folder.id} />
          <input type="hidden" name="currentFolderId" value={currentFolderId ?? ""} />
          <button
            type="submit"
            aria-label={`Delete ${folder.name}`}
            className="text-neutral-400 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}

export function FolderBrowser({
  slug,
  itemLabel,
  pluralLabel,
  currentFolderId,
  folderPath,
  subfolders,
  items,
  allFoldersFlat,
}: {
  slug: string;
  itemLabel: string;
  pluralLabel: string;
  currentFolderId: string | null;
  folderPath: FolderNode[];
  subfolders: FolderNode[];
  items: ItemNode[];
  allFoldersFlat: FlatFolder[];
}) {
  const router = useRouter();
  const [dragOverTarget, setDragOverTarget] = useState<string | "root" | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function moveItem(itemId: string, targetFolderId: string | null) {
    setError(null);
    const result = await moveItemToFolderAction(slug, itemId, targetFolderId);
    if (result?.error) setError(result.error);
    router.refresh();
  }

  function dropHandlers(targetKey: string | "root", targetFolderId: string | null) {
    return {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverTarget(targetKey);
      },
      onDragLeave: () => setDragOverTarget((t) => (t === targetKey ? null : t)),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverTarget(null);
        const itemId = e.dataTransfer.getData("text/plain");
        if (itemId) moveItem(itemId, targetFolderId);
      },
    };
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          <span
            {...dropHandlers("root", null)}
            className={cn(
              "rounded px-1.5 py-0.5",
              dragOverTarget === "root" && "bg-blue-50 ring-1 ring-blue-400 dark:bg-blue-950/40"
            )}
          >
            <Link href={`/items/${slug}`} className="hover:underline">
              All {pluralLabel}
            </Link>
          </span>
          {folderPath.map((f, i) => {
            const isLast = i === folderPath.length - 1;
            const crumb = (
              <span
                {...(!isLast ? dropHandlers(f.id, f.id) : {})}
                className={cn(
                  "rounded px-1.5 py-0.5",
                  !isLast && dragOverTarget === f.id && "bg-blue-50 ring-1 ring-blue-400 dark:bg-blue-950/40",
                  isLast && "font-medium"
                )}
              >
                {isLast ? f.name : <Link href={`/items/${slug}?folder=${f.id}`} className="hover:underline">{f.name}</Link>}
              </span>
            );
            return (
              <span key={f.id} className="flex items-center gap-1">
                <span className="text-neutral-400">/</span>
                {crumb}
              </span>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={
              currentFolderId
                ? `/items/${slug}/new?folder=${currentFolderId}`
                : `/items/${slug}/new`
            }
            className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            <FilePlus className="h-4 w-4" />
            New {itemLabel}
          </Link>
          <button
            type="button"
            onClick={() => setShowNewFolder((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
          >
            <FolderPlus className="h-4 w-4" />
            New folder
          </button>
        </div>
      </div>

      {showNewFolder && (
        <NewFolderForm
          action={createFolderAction.bind(null, slug, currentFolderId)}
          onDone={() => setShowNewFolder(false)}
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {subfolders.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {subfolders.map((folder) => (
            <FolderCard
              key={folder.id}
              slug={slug}
              currentFolderId={currentFolderId}
              folder={folder}
              isDragOver={dragOverTarget === folder.id}
              {...dropHandlers(folder.id, folder.id)}
            />
          ))}
        </div>
      )}

      {items.length === 0 && subfolders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700">
          No {itemLabel.toLowerCase()} here yet.{" "}
          <Link
            href={
              currentFolderId
                ? `/items/${slug}/new?folder=${currentFolderId}`
                : `/items/${slug}/new`
            }
            className="underline"
          >
            Create one
          </Link>{" "}
          or drag one in from another folder.
        </p>
      ) : items.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
              <tr>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Folder</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
                  className="cursor-move border-b border-neutral-100 last:border-0 hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900"
                  title="Drag onto a folder or breadcrumb to file it"
                >
                  <td className="px-3 py-2 font-mono text-xs">
                    <Link href={`/items/${slug}/${item.id}`} className="hover:underline">
                      {item.humanCode}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/items/${slug}/${item.id}`} className="hover:underline">
                      {item.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeClasses(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={currentFolderId ?? ""}
                      onChange={(e) => moveItem(item.id, e.target.value || null)}
                      className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                    >
                      <option value="">— Root / Unfiled —</option>
                      {allFoldersFlat.map((f) => (
                        <option key={f.id} value={f.id}>
                          {"  ".repeat(f.depth)}
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
