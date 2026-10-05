import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { RichText } from "@/components/rich-text";
import { docOf, excerpt, parseRichDoc, safeHref, textToDoc } from "./rich-text";

const opts = { maxText: 5000 };
const p = (...content: object[]) => ({ type: "paragraph", content });
const text = (value: string, marks?: object[]) => ({ type: "text", text: value, ...(marks ? { marks } : {}) });
const doc = (...content: object[]) => ({ type: "doc", content });

describe("parseRichDoc", () => {
  test("keeps what the editor makes and gives back the plain text", () => {
    const result = parseRichDoc(
      doc(
        { type: "heading", attrs: { level: 2 }, content: [text("Rapat")] },
        p(text("Bawa ", [{ type: "bold" }]), text("senter", [{ type: "italic" }]), text("!", [{ type: "underline" }])),
        { type: "bulletList", content: [{ type: "listItem", content: [p(text("kursi"))] }, { type: "listItem", content: [p(text("tikar"))] }] },
        { type: "orderedList", content: [{ type: "listItem", content: [p(text("satu"))] }] },
        { type: "blockquote", content: [p(text("kutipan"))] },
      ),
      opts,
    );
    expect("doc" in result && result.text).toBe("Rapat\nBawa senter!\n• kursi\n• tikar\n1. satu\nkutipan");
  });

  test("accepts the JSON string a form submits", () => {
    const result = parseRichDoc(JSON.stringify(doc(p(text("halo")))), opts);
    expect("doc" in result && result.text).toBe("halo");
  });

  test("anything outside the allow-list is dropped, never stored", () => {
    const result = parseRichDoc(
      doc(
        { type: "image", attrs: { src: "https://x/y.png" } },
        { type: "codeBlock", content: [text("rm -rf")] },
        { type: "heading", attrs: { level: 1, onclick: "x()" }, content: [text("H")] },
        p(
          text("a", [{ type: "link", attrs: { href: "javascript:alert(1)" } }]),
          text("b", [{ type: "link", attrs: { href: "data:text/html,<script>1</script>" } }]),
          text("c", [{ type: "link", attrs: { href: "https://ok.example/path", onclick: "x()" } }]),
          text("d", [{ type: "strike" }, { type: "textStyle", attrs: { color: "red" } }]),
          { type: "text", text: "e", marks: [{ type: "bold" }], onclick: "x()", attrs: { id: "x" } },
          { type: "script", content: [text("alert(1)")] },
        ),
      ),
      opts,
    );
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    const json = JSON.stringify(result.doc);
    for (const bad of ["image", "codeBlock", "javascript", "data:", "onclick", "strike", "textStyle", "script", "alert"])
      expect(json).not.toContain(bad);
    expect(json).toContain('"level":2'); // level 1 is not offered: falls back to 2
    expect(json).toContain("https://ok.example/path");
    expect(result.text).toBe("H\nabcde");
  });

  test("refuses nonsense, empty content, and too much", () => {
    expect("error" in parseRichDoc("not json", opts)).toBe(true);
    expect("error" in parseRichDoc(null, opts)).toBe(true);
    expect("error" in parseRichDoc({ type: "paragraph" }, opts)).toBe(true);
    expect("error" in parseRichDoc(doc({ type: "paragraph" }), opts)).toBe(true); // empty editor
    expect("error" in parseRichDoc(doc(p(text("x".repeat(51)))), { maxText: 50 })).toBe(true);
    expect("error" in parseRichDoc("x".repeat(70_000), opts)).toBe(true);
    expect("error" in parseRichDoc(doc({ type: "paragraph" }), { ...opts, allowEmpty: true })).toBe(false);
  });

  test("deep nesting is cut off", () => {
    let node: object = p(text("dalam"));
    for (let i = 0; i < 20; i++) node = { type: "blockquote", content: [node] };
    const result = parseRichDoc(doc(node), { ...opts, allowEmpty: true });
    expect("doc" in result && result.text).toBe("");
  });
});

describe("safeHref", () => {
  test("only web, mail, and phone links", () => {
    expect(safeHref("https://a.example/x?y=1")).toBe("https://a.example/x?y=1");
    expect(safeHref("mailto:rt@example.com")).toBe("mailto:rt@example.com");
    expect(safeHref("tel:+62812")).toBe("tel:+62812");
    for (const bad of ["javascript:alert(1)", " JaVaScRiPt:alert(1)", "data:text/html,x", "/relatif", "www.example.com", "", 5, null])
      expect(safeHref(bad)).toBeNull();
  });
});

describe("RichText", () => {
  test("renders the elements the editor makes, with escaped text and safe links", () => {
    const html = renderToStaticMarkup(
      <RichText
        text={null}
        doc={doc(
          { type: "heading", attrs: { level: 3 }, content: [text("<b>Judul</b>")] },
          p(text("klik", [{ type: "bold" }, { type: "link", attrs: { href: "https://a.example" } }]), { type: "hardBreak" }, text("baris dua", [{ type: "underline" }])),
          { type: "bulletList", content: [{ type: "listItem", content: [p(text("poin"))] }] },
        )}
      />,
    );
    expect(html).toContain("<h3><span>&lt;b&gt;Judul&lt;/b&gt;</span></h3>");
    expect(html).toContain('<a href="https://a.example/" target="_blank" rel="noopener noreferrer nofollow"><strong>klik</strong></a>');
    expect(html).toContain("<br/>");
    expect(html).toContain("<u>baris dua</u>");
    expect(html).toContain("<ul><li><p><span>poin</span></p></li></ul>");
  });

  test("a document that was not cleaned on the way in is still harmless", () => {
    const html = renderToStaticMarkup(
      <RichText
        text={null}
        doc={doc(
          p(text("x", [{ type: "link", attrs: { href: "javascript:alert(1)" } }])),
          { type: "script", content: [text("alert(1)")] },
        )}
      />,
    );
    expect(html).not.toContain("javascript");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<a ");
  });

  test("rows from before the editor render their plain text as paragraphs", () => {
    const html = renderToStaticMarkup(<RichText doc={null} text={"Minggu pagi\nbawa sapu\n\nsampai jumpa"} />);
    expect(html).toBe(
      '<div class="rich-text"><p><span>Minggu pagi</span></p><p><span>bawa sapu</span></p><p><span>sampai jumpa</span></p></div>',
    );
    expect(docOf(null, null).content).toEqual([]);
    expect(textToDoc("a\nb").content.length).toBe(2);
  });
});

describe("excerpt", () => {
  test("flattens lines and cuts long text at a word", () => {
    expect(excerpt("satu\ndua\n\ntiga")).toBe("satu dua tiga");
    expect(excerpt(null)).toBe("");
    const long = excerpt("kata ".repeat(100), 50);
    expect(long.length).toBeLessThanOrEqual(51);
    expect(long.endsWith("…")).toBe(true);
    expect(long).not.toContain("kat…"); // not cut inside a word
  });
});
