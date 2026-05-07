"use client";

import { useTransition } from "react";
import { deleteTemplate } from "./actions";

export function DeleteTemplateButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => {
        if (
          !confirm(
            `Template "${name}" endgültig löschen?\n\nAlle Versionen werden gelöscht. Versendete Mails bleiben im Email-Log erhalten.`
          )
        ) {
          return;
        }
        fd.set("id", id);
        startTransition(async () => {
          await deleteTemplate(fd);
        });
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-red-700 hover:text-red-900 disabled:opacity-50"
        title="Template löschen"
      >
        {pending ? "…" : "Löschen"}
      </button>
    </form>
  );
}
