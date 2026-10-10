/**
 * Textarea-kind fields (see FieldConfig.kind in itemTypes.ts) store rich HTML
 * now, not plain text — produced by components/rich-text-editor.tsx, which
 * constrains output to a fixed schema (paragraphs, bold/italic, lists,
 * tables — no script/style/event-handler content is reachable through its
 * toolbar or its paste handling, which is schema-constrained by ProseMirror).
 *
 * Every record created before this feature stored plain text in these same
 * columns, so both representations have to coexist without a migration:
 * these helpers are the single place that decides which is which and
 * converts between them, used identically by the editor (to load existing
 * content) and the detail page (to display it).
 */

const HTML_START_PATTERN = /^\s*<(p|table|ul|ol|h[1-6]|blockquote|div)[\s>]/i;

/** Heuristic: does this look like HTML our own editor produced, as opposed
 * to a plain-text value saved before this feature existed? Legitimate plain
 * text essentially never starts with one of these exact tag openings. */
export function looksLikeHtml(value: string): boolean {
  return HTML_START_PATTERN.test(value);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Plain-text legacy value -> safe HTML paragraphs (one per blank-line-
 * separated block, preserving single line breaks within a block). */
function plainTextToHtml(text: string): string {
  const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  if (blocks.length === 0) return "";
  return blocks
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** Normalizes a stored field value into HTML safe to feed into the editor's
 * `content` prop or to render via dangerouslySetInnerHTML. Already-HTML
 * values pass through untouched; legacy plain text gets escaped and wrapped. */
export function toEditableHtml(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  const text = typeof raw === "string" ? raw : String(raw);
  if (!text.trim()) return "";
  return looksLikeHtml(text) ? text : plainTextToHtml(text);
}

/** Strips tags down to plain text — for contexts that were built for plain
 * strings and shouldn't suddenly show raw markup: list/link-picker previews,
 * history, exports, and deriving a TraceItem's title from a textarea field. */
export function stripHtmlToText(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  const text = typeof raw === "string" ? raw : String(raw);
  if (!text.trim() || !looksLikeHtml(text)) return text;

  return text
    .replace(/<(p|div|h[1-6]|tr|li)[^>]*>/gi, "")
    .replace(/<\/(p|div|h[1-6]|tr)>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<(td|th)[^>]*>/gi, "")
    .replace(/<\/(td|th)>/gi, "\t")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
