// Rich text for announcements and events. The editor (Tiptap) produces a JSON
// document; it is never stored or rendered as HTML. Instead every document is
// rebuilt here from an allow-list of nodes, marks, and link protocols, so
// whatever arrives from a browser, a backup file, or a crafted request can only
// become the small set of elements the renderer knows. No sanitizer needed,
// and no `dangerouslySetInnerHTML` anywhere.

export type RichMark = { type: "bold" | "italic" | "underline" } | { type: "link"; attrs: { href: string } };
export type RichNode = {
  type: string;
  attrs?: { level?: number };
  content?: RichNode[];
  text?: string;
  marks?: RichMark[];
};
export type RichDoc = { type: "doc"; content: RichNode[] };

const MAX_DEPTH = 6;
const MAX_NODES = 3000;
export const MAX_DOC_BYTES = 60_000;
const LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

// What may sit inside what: the same rules the editor itself follows.
const BLOCKS = ["paragraph", "heading", "bulletList", "orderedList", "blockquote"];
const CHILDREN: Record<string, readonly string[]> = {
  doc: BLOCKS,
  blockquote: BLOCKS,
  listItem: ["paragraph", "bulletList", "orderedList"],
  bulletList: ["listItem"],
  orderedList: ["listItem"],
  paragraph: ["text", "hardBreak"],
  heading: ["text", "hardBreak"],
};

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

// Only absolute links with a known protocol survive; anything else (including
// `javascript:`) drops the link and keeps the text.
export function safeHref(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2000) return null;
  try {
    const url = new URL(value.trim());
    return LINK_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function cleanMarks(value: unknown): RichMark[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const marks: RichMark[] = [];
  for (const mark of value) {
    if (!isObj(mark)) continue;
    if (mark.type === "bold" || mark.type === "italic" || mark.type === "underline") marks.push({ type: mark.type });
    else if (mark.type === "link" && isObj(mark.attrs)) {
      const href = safeHref(mark.attrs.href);
      if (href) marks.push({ type: "link", attrs: { href } });
    }
  }
  return marks.length > 0 ? marks : undefined;
}

// Rebuilds one node, or returns null when it is not allowed here.
function cleanNode(value: unknown, parent: string, depth: number, budget: { nodes: number }): RichNode | null {
  if (!isObj(value) || typeof value.type !== "string") return null;
  if (depth > MAX_DEPTH || ++budget.nodes > MAX_NODES) return null;
  const type = value.type;
  if (!CHILDREN[parent]?.includes(type)) return null;

  if (type === "text") {
    if (typeof value.text !== "string" || value.text === "") return null;
    const marks = cleanMarks(value.marks);
    return marks ? { type, text: value.text, marks } : { type, text: value.text };
  }
  if (type === "hardBreak") return { type };

  const node: RichNode = { type };
  if (type === "heading") {
    const level = isObj(value.attrs) ? value.attrs.level : undefined;
    node.attrs = { level: level === 3 ? 3 : 2 };
  }
  if (CHILDREN[type] && Array.isArray(value.content)) {
    const content = value.content
      .map((child) => cleanNode(child, type, depth + 1, budget))
      .filter((child): child is RichNode => child !== null);
    if (content.length > 0) node.content = content;
  }
  // A list or list item without content is not valid in the editor either.
  if ((type === "bulletList" || type === "orderedList" || type === "listItem") && !node.content) return null;
  return node;
}

// The text of a document, one line per paragraph, heading, or list item. Used
// for previews on the public page and as the stored plain-text copy.
export function docToText(doc: RichDoc): string {
  const lines: string[] = [];
  const inline = (node: RichNode): string =>
    node.type === "text" ? (node.text ?? "") : node.type === "hardBreak" ? "\n" : (node.content ?? []).map(inline).join("");
  const walk = (node: RichNode, prefix: string) => {
    if (node.type === "paragraph" || node.type === "heading") {
      lines.push(prefix + inline(node));
    } else if (node.type === "bulletList" || node.type === "orderedList") {
      (node.content ?? []).forEach((item, i) =>
        (item.content ?? []).forEach((child, j) =>
          walk(child, j === 0 ? (node.type === "bulletList" ? "• " : `${i + 1}. `) : ""),
        ),
      );
    } else {
      (node.content ?? []).forEach((child) => walk(child, prefix));
    }
  };
  doc.content.forEach((node) => walk(node, ""));
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// Plain text from before rich text existed: one paragraph per line.
export function textToDoc(text: string): RichDoc {
  const content = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .map((line): RichNode => ({ type: "paragraph", content: [{ type: "text", text: line }] }));
  return { type: "doc", content };
}

// The document to show: the stored one, or the legacy text turned into one.
export function docOf(stored: unknown, text: string | null): RichDoc {
  const parsed = parseRichDoc(stored, { maxText: Number.MAX_SAFE_INTEGER, allowEmpty: true });
  return "doc" in parsed && stored != null ? parsed.doc : textToDoc(text ?? "");
}

// Validates an editor document (an object, or the JSON string of one) and
// returns the cleaned copy plus its plain text. Errors are shown to the admin.
export function parseRichDoc(
  input: unknown,
  { maxText, allowEmpty = false }: { maxText: number; allowEmpty?: boolean },
): { doc: RichDoc; text: string } | { error: string } {
  let value = input;
  if (typeof input === "string") {
    if (input.length > MAX_DOC_BYTES) return { error: "Isi terlalu panjang." };
    try {
      value = JSON.parse(input);
    } catch {
      return { error: "Isi tidak valid." };
    }
  }
  if (!isObj(value) || value.type !== "doc" || !Array.isArray(value.content))
    return { error: "Isi tidak valid." };

  const budget = { nodes: 0 };
  const content = value.content
    .map((node) => cleanNode(node, "doc", 1, budget))
    .filter((node): node is RichNode => node !== null);
  const doc: RichDoc = { type: "doc", content };
  const text = docToText(doc);

  if (JSON.stringify(doc).length > MAX_DOC_BYTES) return { error: "Isi terlalu panjang." };
  if (text.length > maxText) return { error: `Isi maksimal ${maxText} karakter.` };
  if (!allowEmpty && text === "") return { error: "Isi tidak boleh kosong." };
  return { doc, text };
}

// A one-paragraph preview of a plain text, cut at a word boundary.
export function excerpt(text: string | null, max = 180): string {
  const flat = (text ?? "").replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max / 2))}…`;
}
