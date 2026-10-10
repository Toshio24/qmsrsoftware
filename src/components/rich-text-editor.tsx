"use client";

import { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table/kit";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Table as TableIcon,
  Rows3,
  Columns3,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const toolbarButtonClass =
  "flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-xs text-neutral-600 hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-30 dark:text-neutral-300 dark:hover:bg-neutral-800";
const toolbarButtonActiveClass = "bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-50";

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(toolbarButtonClass, active && toolbarButtonActiveClass)}
    >
      {children}
    </button>
  );
}

/** Small inline "M × N" prompt for inserting a table — appears in place of
 * the toolbar's Table button rather than a browser prompt(), so it fits the
 * rest of the form's styling. */
function InsertTablePopover({
  onInsert,
  onCancel,
}: {
  onInsert: (rows: number, cols: number) => void;
  onCancel: () => void;
}) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  return (
    <div className="flex items-center gap-1.5 rounded border border-neutral-300 bg-white px-1.5 py-0.5 dark:border-neutral-600 dark:bg-neutral-900">
      <input
        type="number"
        min={1}
        max={30}
        value={rows}
        onChange={(e) => setRows(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
        aria-label="Rows"
        className="w-10 rounded border border-neutral-300 bg-white px-1 py-0.5 text-xs dark:border-neutral-700 dark:bg-neutral-900"
      />
      <span className="text-xs text-neutral-400">×</span>
      <input
        type="number"
        min={1}
        max={20}
        value={cols}
        onChange={(e) => setCols(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
        aria-label="Columns"
        className="w-10 rounded border border-neutral-300 bg-white px-1 py-0.5 text-xs dark:border-neutral-700 dark:bg-neutral-900"
      />
      <button
        type="button"
        onClick={() => onInsert(rows, cols)}
        className="rounded bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
      >
        Insert
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-1 text-xs text-neutral-500 hover:underline"
      >
        Cancel
      </button>
    </div>
  );
}

export function RichTextEditor({
  id,
  name,
  defaultValue,
  required,
}: {
  /** Set on the editable surface itself (not the hidden input, which can't
   * receive focus) so a <label htmlFor={id}> click correctly focuses it. */
  id?: string;
  name: string;
  defaultValue: string;
  required?: boolean;
}) {
  const [html, setHtml] = useState(defaultValue);
  const [showTableDialog, setShowTableDialog] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, TableKit.configure({ table: { resizable: true } })],
    content: defaultValue,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class: "rich-content min-h-[6rem] px-3 py-2 text-sm focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      setHtml(editor.isEmpty ? "" : editor.getHTML());
    },
  });

  if (!editor) {
    // SSR/first-paint placeholder — immediatelyRender:false means `editor`
    // is null until the client mounts it, which otherwise blanks the field
    // out as if nothing happened yet.
    return (
      <div className="min-h-[9.5rem] animate-pulse rounded-md border border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900" />
    );
  }

  const inTable = editor.isActive("table");

  return (
    <div className="rounded-md border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900">
      <input type="hidden" name={name} value={html} required={required} />

      <div className="flex flex-wrap items-center gap-0.5 border-b border-neutral-200 p-1 dark:border-neutral-800">
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />

        {showTableDialog ? (
          <InsertTablePopover
            onInsert={(rows, cols) => {
              editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
              // A table with nothing after it leaves no normal cursor
              // position below it to click/type into — guarantee a
              // trailing paragraph exists so "type after the table" always
              // works, rather than relying on gap-cursor edge-case behavior.
              if (editor.state.doc.lastChild?.type.name === "table") {
                editor.chain().insertContentAt(editor.state.doc.content.size, { type: "paragraph" }).run();
              }
              setShowTableDialog(false);
            }}
            onCancel={() => setShowTableDialog(false)}
          />
        ) : (
          <ToolbarButton label="Insert table" onClick={() => setShowTableDialog(true)}>
            <TableIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
        )}

        {inTable && (
          <>
            <span className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
            <ToolbarButton
              label="Add row below"
              onClick={() => editor.chain().focus().addRowAfter().run()}
            >
              <Rows3 className="h-3.5 w-3.5" />
              <span className="ml-1">+</span>
            </ToolbarButton>
            <ToolbarButton
              label="Delete row"
              onClick={() => editor.chain().focus().deleteRow().run()}
            >
              <Rows3 className="h-3.5 w-3.5" />
              <span className="ml-1">−</span>
            </ToolbarButton>
            <ToolbarButton
              label="Add column right"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
            >
              <Columns3 className="h-3.5 w-3.5" />
              <span className="ml-1">+</span>
            </ToolbarButton>
            <ToolbarButton
              label="Delete column"
              onClick={() => editor.chain().focus().deleteColumn().run()}
            >
              <Columns3 className="h-3.5 w-3.5" />
              <span className="ml-1">−</span>
            </ToolbarButton>
            <ToolbarButton
              label="Delete table"
              onClick={() => editor.chain().focus().deleteTable().run()}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </ToolbarButton>
          </>
        )}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
