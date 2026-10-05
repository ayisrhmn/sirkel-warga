"use client";

import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { docOf } from "@/lib/rich-text";

// What the editor offers matches what `parseRichDoc` accepts and `RichText`
// renders; everything else is switched off.
const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    code: false,
    codeBlock: false,
    strike: false,
    horizontalRule: false,
    link: { openOnClick: false, autolink: true, defaultProtocol: "https", protocols: ["mailto", "tel"] },
  }),
];

const toParsed = (value: string) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

function Toolbar({ editor }: { editor: Editor }) {
  // Re-render the buttons when the selection (and so the active marks) changes.
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  function setLink() {
    const current = editor.getAttributes("link").href as string | undefined;
    const input = window.prompt("Alamat tautan (https://..., kosongkan untuk menghapus)", current ?? "https://");
    if (input === null) return;
    const href = input.trim();
    if (href === "" || href === "https://") editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }

  const buttons = [
    { label: "Tebal", icon: Bold, on: active.bold, run: () => editor.chain().focus().toggleBold().run() },
    { label: "Miring", icon: Italic, on: active.italic, run: () => editor.chain().focus().toggleItalic().run() },
    { label: "Garis bawah", icon: UnderlineIcon, on: active.underline, run: () => editor.chain().focus().toggleUnderline().run() },
    { label: "Judul besar", icon: Heading2, on: active.h2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "Judul kecil", icon: Heading3, on: active.h3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: "Daftar poin", icon: List, on: active.bullet, run: () => editor.chain().focus().toggleBulletList().run() },
    { label: "Daftar angka", icon: ListOrdered, on: active.ordered, run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: "Kutipan", icon: Quote, on: active.quote, run: () => editor.chain().focus().toggleBlockquote().run() },
    { label: "Tautan", icon: LinkIcon, on: active.link, run: setLink },
    { label: "Urungkan", icon: Undo2, on: false, disabled: !active.canUndo, run: () => editor.chain().focus().undo().run() },
    { label: "Ulangi", icon: Redo2, on: false, disabled: !active.canRedo, run: () => editor.chain().focus().redo().run() },
  ];

  return (
    <div role="toolbar" aria-label="Format teks" className="flex flex-wrap gap-1 border-b border-line bg-zebra p-1.5">
      {buttons.map(({ label, icon: Icon, on, disabled, run }) => (
        <button
          key={label}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={on}
          disabled={disabled}
          onClick={run}
          className={`flex size-10 cursor-pointer items-center justify-center rounded-lg disabled:opacity-40 ${on ? "bg-primary text-white" : "hover:bg-primary-tint"}`}
        >
          <Icon aria-hidden="true" size={18} />
        </button>
      ))}
    </div>
  );
}

// A WYSIWYG field inside a normal <form>: the document travels as JSON in a
// hidden input named `name`. `defaultValue` is the JSON string (or "") to start
// from; when `syncKey` changes after a submit (a new action result) the editor
// is set to `defaultValue` again, because React only resets plain inputs.
export function RichTextEditor({
  name,
  defaultValue,
  legacyText,
  syncKey,
  label,
}: {
  name: string;
  defaultValue: string;
  // Plain text from before the editor existed, used when there is no document.
  legacyText?: string;
  syncKey: unknown;
  label: string;
}) {
  const startContent = () => docOf(toParsed(defaultValue), legacyText ?? "");
  const [json, setJson] = useState(() => JSON.stringify(startContent()));
  const editor = useEditor({
    extensions,
    content: startContent(),
    immediatelyRender: false, // the page is server rendered
    editorProps: {
      attributes: {
        class: "rich-text min-h-40 p-4 text-base outline-none",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": label,
      },
    },
    onUpdate: ({ editor: e }) => setJson(JSON.stringify(e.getJSON())),
  });

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!editor) return;
    editor.commands.setContent(startContent(), { emitUpdate: true }); // onUpdate refreshes the hidden field
    // Only a new result of the form's action resets the content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncKey]);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[15px] font-semibold">{label}</span>
      <div className="overflow-hidden rounded-xl border-[1.5px] border-line-strong bg-surface focus-within:border-primary">
        {editor && <Toolbar editor={editor} />}
        <EditorContent editor={editor} />
      </div>
      <input type="hidden" name={name} value={json} />
    </div>
  );
}
