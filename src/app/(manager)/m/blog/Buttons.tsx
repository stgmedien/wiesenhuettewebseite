"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, Loader2 } from "lucide-react";
import { createBlogPost } from "./actions";
import { importHtmlFile } from "./import-actions";

export const NewPostButton = () => {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => createBlogPost())}
      className="inline-flex h-11 px-5 items-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-[var(--color-wh-snow)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-deep-green-hover)] transition-colors disabled:opacity-60"
    >
      {pending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
      Neuer Entwurf
    </button>
  );
};

export const ImportButton = () => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    start(async () => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await importHtmlFile(fd);
      if (!res.ok) setError(res.error);
      else router.push(`/m/blog/${res.postId}`);
    });
  };

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        className="inline-flex h-11 px-5 items-center gap-2 rounded-[var(--radius-btn)] border border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)] text-sm font-semibold cursor-pointer hover:bg-[var(--color-wh-green-soft)] transition-colors disabled:opacity-60"
      >
        {pending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        HTML importieren
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".html,.htm,.md,text/html,text/markdown"
        className="hidden"
        onChange={onChange}
      />
      {error && (
        <span className="text-sm text-[var(--color-wh-sunset)] self-center">{error}</span>
      )}
    </>
  );
};
