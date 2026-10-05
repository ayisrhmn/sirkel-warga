import type { ReactNode } from "react";
import { docOf, safeHref, type RichNode } from "@/lib/rich-text";

function inline(node: RichNode, key: number): ReactNode {
  if (node.type === "hardBreak") return <br key={key} />;
  let out: ReactNode = node.text;
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") out = <strong>{out}</strong>;
    else if (mark.type === "italic") out = <em>{out}</em>;
    else if (mark.type === "underline") out = <u>{out}</u>;
    else if (mark.type === "link") {
      const href = safeHref(mark.attrs.href); // checked again at render time
      if (href)
        out = (
          <a href={href} target="_blank" rel="noopener noreferrer nofollow">
            {out}
          </a>
        );
    }
  }
  return <span key={key}>{out}</span>;
}

function block(node: RichNode, key: number): ReactNode {
  const children = (node.content ?? []).map((child, i) =>
    node.type === "paragraph" || node.type === "heading" ? inline(child, i) : block(child, i),
  );
  switch (node.type) {
    case "paragraph":
      return <p key={key}>{children}</p>;
    case "heading":
      return node.attrs?.level === 3 ? <h3 key={key}>{children}</h3> : <h2 key={key}>{children}</h2>;
    case "bulletList":
      return <ul key={key}>{children}</ul>;
    case "orderedList":
      return <ol key={key}>{children}</ol>;
    case "listItem":
      return <li key={key}>{children}</li>;
    case "blockquote":
      return <blockquote key={key}>{children}</blockquote>;
    default:
      return null;
  }
}

// Renders the stored document (or old plain text) as React elements. Unknown
// nodes render nothing; text is always escaped by React.
export function RichText({ doc, text }: { doc: unknown; text: string | null }) {
  return <div className="rich-text">{docOf(doc, text).content.map(block)}</div>;
}
