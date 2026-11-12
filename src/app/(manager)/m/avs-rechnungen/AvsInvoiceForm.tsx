"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, Check } from "lucide-react";
import { sendAvsInvoices } from "./actions";

export default function AvsInvoiceForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await sendAvsInvoices(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setNotice(
        res.count > 1
          ? `${res.count} Rechnungen an ${res.sentTo} verschickt.`
          : `Rechnung an ${res.sentTo} verschickt.`
      );
      form.reset();
      setFiles([]);
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 space-y-4"
    >
      <h3 className="text-[20px] m-0">Rechnung hochladen</h3>
      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 text-sm text-center cursor-pointer hover:bg-[var(--color-wh-snow,#F7F7F2)]">
        <FileUp size={22} className="text-[var(--color-wh-deep-green)]" />
        {files.length > 0 ? (
          <span className="font-medium">{files.map((f) => f.name).join(", ")}</span>
        ) : (
          <span>PDF auswählen (auch mehrere)</span>
        )}
        <input
          type="file"
          name="files"
          accept="application/pdf"
          multiple
          required
          className="sr-only"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
      </label>
      <label className="block text-sm">
        <span className="block mb-1 font-medium">Notiz an Norbert (optional)</span>
        <textarea
          name="note"
          rows={2}
          maxLength={500}
          placeholder="z. B. Kurbeitrag Oktober, fällig bis 30.11."
          className="w-full rounded-lg border border-[var(--color-wh-winter-grey)] bg-white px-3 py-2 text-sm"
        />
      </label>
      {error && <p className="text-sm text-[#7a3a20] m-0">{error}</p>}
      {notice && (
        <p className="text-sm text-emerald-700 m-0 flex items-center gap-1.5">
          <Check size={14} /> {notice}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || files.length === 0}
        className="inline-flex items-center gap-2 h-10 px-4 rounded-[var(--radius-btn)] bg-[var(--color-wh-deep-green)] text-white text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
        An Norbert senden
      </button>
    </form>
  );
}
