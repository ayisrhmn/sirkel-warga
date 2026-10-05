import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { RichTextEditor } from "./rich-text-editor";

describe("RichTextEditor on the server", () => {
  test("renders without a browser and carries the starting document in the hidden field", () => {
    const html = renderToStaticMarkup(
      <RichTextEditor name="bodyDoc" label="Isi" defaultValue="" legacyText={"baris satu\nbaris dua"} syncKey={{}} />,
    );
    expect(html).toContain('type="hidden"');
    expect(html).toContain('name="bodyDoc"');
    // Old plain text becomes two paragraphs, so saving without edits keeps it.
    expect(html).toContain("baris satu");
    expect(html.match(/&quot;type&quot;:&quot;paragraph&quot;/g)?.length).toBe(2);
  });

  test("an empty editor submits an empty document, which the server refuses for required fields", () => {
    const html = renderToStaticMarkup(<RichTextEditor name="x" label="Isi" defaultValue="" syncKey={{}} />);
    expect(html).toContain("&quot;content&quot;:[]");
  });
});
