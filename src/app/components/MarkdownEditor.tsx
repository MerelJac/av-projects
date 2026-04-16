"use client";
import { useState, useEffect } from "react";
import { marked } from "marked";
import { Eye, EyeOff } from "lucide-react";

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  minRows = 8,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minRows?: number;
}) {
  const [preview, setPreview] = useState(false);
  const [html, setHtml] = useState("");

  useEffect(() => {
    if (preview) {
      setHtml(marked(value || "") as string);
    }
  }, [preview, value]);

  return (
    <div>
      <div className="flex items-center justify-end px-4 py-2 border-b border-[#F0EEE9]">
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className="flex items-center gap-1.5 text-xs text-[#888] hover:text-[#111] transition-colors"
        >
          {preview ? <EyeOff size={12} /> : <Eye size={12} />}
          {preview ? "Edit" : "Preview"}
        </button>
      </div>
      {preview ? (
        <div
          className="px-5 py-4 text-sm text-[#111] prose prose-sm max-w-none min-h-[120px]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={minRows}
          className="w-full px-5 py-4 text-sm text-[#111] placeholder:text-[#bbb] resize-y focus:outline-none font-mono leading-relaxed"
        />
      )}
    </div>
  );
}
