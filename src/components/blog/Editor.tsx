"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExt from "@tiptap/extension-image";
import LinkExt from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { useEffect, useRef, useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading2, Heading3, List, ListOrdered, Quote, Link as LinkIcon,
  AlignLeft, AlignCenter, AlignRight, Image as ImageIcon, Code, Undo, Redo, Eye, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  initialHtml: string;
  onChange: (html: string, json: object) => void;
  /** Server action that uploads a file and returns its public URL. */
  onUploadImage: (file: File) => Promise<string>;
};

export const Editor = ({ initialHtml, onChange, onUploadImage }: Props) => {
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [htmlSource, setHtmlSource] = useState(initialHtml || "");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: { HTMLAttributes: { class: "blog-code" } },
      }),
      ImageExt.configure({
        HTMLAttributes: { class: "blog-img", loading: "lazy" },
      }),
      LinkExt.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      Placeholder.configure({
        placeholder:
          "Hier den Beitrag schreiben — H2/H3 für Überschriften, Bilder per Drag & Drop oder Button …",
      }),
      Typography,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
    ],
    content: initialHtml || "",
    editorProps: {
      attributes: {
        class:
          "prose-blog min-h-[420px] focus:outline-none px-5 py-4 text-[var(--color-wh-black)]",
      },
      handleDrop(view, event) {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;
        const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (imageFiles.length === 0) return false;
        event.preventDefault();
        (async () => {
          setUploading(true);
          try {
            for (const file of imageFiles) {
              const url = await onUploadImage(file);
              editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
            }
          } finally {
            setUploading(false);
          }
        })();
        return true;
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        const fileItems = Array.from(items).filter((it) => it.kind === "file" && it.type.startsWith("image/"));
        if (fileItems.length === 0) return false;
        event.preventDefault();
        (async () => {
          setUploading(true);
          try {
            for (const it of fileItems) {
              const file = it.getAsFile();
              if (!file) continue;
              const url = await onUploadImage(file);
              editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
            }
          } finally {
            setUploading(false);
          }
        })();
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = editor.getJSON() as object;
      setHtmlSource(html);
      onChange(html, json);
    },
  });

  // Sync HTML source when switching modes
  useEffect(() => {
    if (mode === "visual" && editor) {
      editor.commands.setContent(htmlSource || "", { emitUpdate: false });
    }
  }, [mode, editor]);

  if (!editor) return null;

  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const url = await onUploadImage(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } finally {
      setUploading(false);
    }
  };

  const applyLink = () => {
    if (!linkUrl) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl, target: "_blank" }).run();
    }
    setLinkOpen(false);
    setLinkUrl("");
  };

  const Btn = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "inline-flex w-9 h-9 items-center justify-center rounded-md cursor-pointer transition-colors",
        active
          ? "bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)]"
          : "text-[var(--color-wh-deep-green)] hover:bg-[var(--color-wh-green-soft)]"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] overflow-hidden bg-white">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--color-wh-winter-grey)] bg-[var(--color-wh-snow)]">
        <div className="flex flex-wrap items-center gap-1">
          <Btn title="Rückgängig" onClick={() => editor.chain().focus().undo().run()}><Undo size={16} /></Btn>
          <Btn title="Wiederholen" onClick={() => editor.chain().focus().redo().run()}><Redo size={16} /></Btn>
          <span className="w-px h-6 bg-[var(--color-wh-winter-grey)] mx-1" />
          <Btn title="H2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={16} /></Btn>
          <Btn title="H3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={16} /></Btn>
          <span className="w-px h-6 bg-[var(--color-wh-winter-grey)] mx-1" />
          <Btn title="Fett" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></Btn>
          <Btn title="Kursiv" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16} /></Btn>
          <Btn title="Unterstrichen" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={16} /></Btn>
          <Btn title="Durchgestrichen" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={16} /></Btn>
          <span className="w-px h-6 bg-[var(--color-wh-winter-grey)] mx-1" />
          <Btn title="Liste" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={16} /></Btn>
          <Btn title="Nummeriert" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></Btn>
          <Btn title="Zitat" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={16} /></Btn>
          <Btn title="Code-Block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code size={16} /></Btn>
          <span className="w-px h-6 bg-[var(--color-wh-winter-grey)] mx-1" />
          <Btn title="Links" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft size={16} /></Btn>
          <Btn title="Mitte" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter size={16} /></Btn>
          <Btn title="Rechts" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight size={16} /></Btn>
          <span className="w-px h-6 bg-[var(--color-wh-winter-grey)] mx-1" />
          <Btn
            title="Link einfügen"
            active={editor.isActive("link")}
            onClick={() => {
              setLinkUrl(editor.getAttributes("link").href ?? "");
              setLinkOpen(!linkOpen);
            }}
          >
            <LinkIcon size={16} />
          </Btn>
          <Btn
            title={uploading ? "Bild wird hochgeladen ..." : "Bild einfügen"}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon size={16} />
          </Btn>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChosen}
          />
        </div>
        <div className="inline-flex rounded-md bg-white border border-[var(--color-wh-winter-grey)] overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setMode("visual")}
            className={cn(
              "px-3 py-2 inline-flex items-center gap-1.5 cursor-pointer",
              mode === "visual" ? "bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)]" : "text-[var(--color-wh-deep-green)]"
            )}
          >
            <Pencil size={12} /> Visual
          </button>
          <button
            type="button"
            onClick={() => setMode("html")}
            className={cn(
              "px-3 py-2 inline-flex items-center gap-1.5 cursor-pointer border-l border-[var(--color-wh-winter-grey)]",
              mode === "html" ? "bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)]" : "text-[var(--color-wh-deep-green)]"
            )}
          >
            <Eye size={12} /> HTML
          </button>
        </div>
      </div>

      {linkOpen && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-wh-beige)] border-b border-[var(--color-wh-winter-grey)]">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 h-9 px-3 rounded-md border border-[var(--color-wh-winter-grey)] bg-white text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); applyLink(); }
              if (e.key === "Escape") setLinkOpen(false);
            }}
          />
          <button type="button" onClick={applyLink} className="h-9 px-4 rounded-md bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold cursor-pointer">
            Link setzen
          </button>
          <button type="button" onClick={() => { editor.chain().focus().unsetLink().run(); setLinkOpen(false); }} className="h-9 px-3 rounded-md border border-[var(--color-wh-winter-grey)] text-sm cursor-pointer">
            Entfernen
          </button>
        </div>
      )}

      {uploading && (
        <div className="px-3 py-2 bg-[var(--color-wh-green-soft)] text-[var(--color-wh-deep-green)] text-sm font-medium">
          Bild wird hochgeladen ...
        </div>
      )}

      {mode === "visual" ? (
        <EditorContent editor={editor} />
      ) : (
        <textarea
          value={htmlSource}
          onChange={(e) => {
            setHtmlSource(e.target.value);
            onChange(e.target.value, editor.getJSON() as object);
          }}
          onBlur={() => {
            // when leaving HTML mode the visual will resync via the effect
          }}
          className="w-full min-h-[420px] p-5 font-mono text-sm bg-[var(--color-wh-snow)] text-[var(--color-wh-black)] focus:outline-none"
          spellCheck={false}
        />
      )}
    </div>
  );
};
