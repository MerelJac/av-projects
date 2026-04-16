"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered } from "lucide-react";

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? "Start typing…" }),
    ],
    content: value || "",
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "min-h-[160px] px-5 py-4 text-sm text-[#111] focus:outline-none rich-text",
      },
    },
  });

  if (!editor) return null;

  const btn = (active: boolean) =>
    `p-1.5 rounded-lg transition-colors ${active ? "bg-[#111] text-white" : "text-[#888] hover:bg-[#F0EEE9] hover:text-[#111]"}`;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-[#F0EEE9]">
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
          className={btn(editor.isActive("bold"))}
          title="Bold"
        >
          <Bold size={13} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
          className={btn(editor.isActive("italic"))}
          title="Italic"
        >
          <Italic size={13} />
        </button>
        <div className="w-px h-4 bg-[#E5E3DE] mx-1" />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
          className={btn(editor.isActive("bulletList"))}
          title="Bullet list"
        >
          <List size={13} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
          className={btn(editor.isActive("orderedList"))}
          title="Numbered list"
        >
          <ListOrdered size={13} />
        </button>
        <div className="w-px h-4 bg-[#E5E3DE] mx-1" />
        {(["h2", "h3"] as const).map((level) => (
          <button
            key={level}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              editor.chain().focus().toggleHeading({ level: level === "h2" ? 2 : 3 }).run();
            }}
            className={`${btn(editor.isActive("heading", { level: level === "h2" ? 2 : 3 }))} text-[11px] font-bold px-2`}
            title={level === "h2" ? "Heading" : "Subheading"}
          >
            {level === "h2" ? "H2" : "H3"}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
