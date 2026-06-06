import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { mailTemplates, mailTemplateVersions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { saveTemplateVersion, activateVersion } from "../actions";
import { mdToHtml } from "@/lib/mail-templates";
import { TemplateEditor } from "./TemplateEditor";
import { GLOBAL_MAIL_VARIABLES } from "@/lib/mail-render";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function TemplateEditorPage({ params }: Props) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "manager" && role !== "admin") redirect("/m/dashboard");

  const { id } = await params;
  const tplRows = await db
    .select()
    .from(mailTemplates)
    .where(eq(mailTemplates.id, id))
    .limit(1);
  const tpl = tplRows[0];
  if (!tpl) notFound();

  const versions = await db
    .select()
    .from(mailTemplateVersions)
    .where(eq(mailTemplateVersions.templateId, id))
    .orderBy(desc(mailTemplateVersions.version));

  const activeVersion = tpl.activeVersionId
    ? versions.find((v) => v.id === tpl.activeVersionId) ?? null
    : versions[0] ?? null;
  const previousVersion = activeVersion
    ? versions.find((v) => v.version === activeVersion.version - 1) ?? null
    : null;

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-[1200px]">
      <Link
        href="/m/mail-templates"
        className="text-sm text-[var(--color-wh-fg-muted)] no-underline"
      >
        ← Zurück zur Liste
      </Link>
      <div className="flex items-start justify-between gap-4 mt-3 mb-6">
        <div>
          <p className="font-mono text-xs text-[var(--color-wh-fg-muted)]">{tpl.key}</p>
          <h1 className="text-[32px] mt-1 mb-1">{tpl.name}</h1>
          {tpl.description && (
            <p className="text-[var(--color-wh-fg-muted)] m-0">{tpl.description}</p>
          )}
        </div>
      </div>

      {/* Editor */}
      <TemplateEditor
        templateId={tpl.id}
        templateName={tpl.name}
        initialSubject={activeVersion?.subject ?? ""}
        initialBody={activeVersion?.bodyMd ?? ""}
        previousBody={previousVersion?.bodyMd ?? null}
        variables={GLOBAL_MAIL_VARIABLES}
      />

      {/* Versions-Verlauf */}
      <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 mt-8">
        <h2 className="text-[20px] m-0 mb-4">Versionen ({versions.length})</h2>
        {versions.length === 0 ? (
          <p className="text-sm text-[var(--color-wh-fg-muted)]">Noch keine Versionen.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-wh-winter-grey)]/40">
            {versions.map((v) => (
              <li
                key={v.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">v{v.version}</span>
                    {v.id === tpl.activeVersionId && (
                      <span className="text-[10px] text-emerald-700 uppercase tracking-wider font-semibold">
                        ● aktiv
                      </span>
                    )}
                  </div>
                  <p className="text-sm m-0 truncate">{v.subject}</p>
                  <p className="text-[10px] text-[var(--color-wh-fg-muted)] m-0">
                    {v.createdBy ?? "—"} · {new Date(v.createdAt).toLocaleString("de-DE")}
                    {v.changeNote && ` · ${v.changeNote}`}
                  </p>
                </div>
                {v.id !== tpl.activeVersionId && (
                  <form
                    action={async (fd) => {
                      "use server";
                      await activateVersion(fd);
                    }}
                  >
                    <input type="hidden" name="templateId" value={tpl.id} />
                    <input type="hidden" name="versionId" value={v.id} />
                    <button
                      type="submit"
                      className="text-xs text-[var(--color-wh-deep-green)] underline"
                    >
                      Als aktiv setzen
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Aktive Version Vorschau */}
      {activeVersion && (
        <section className="bg-white border border-[var(--color-wh-winter-grey)] rounded-[var(--radius-card)] p-6 mt-8">
          <h2 className="text-[20px] m-0 mb-4">Vorschau (aktive Version)</h2>
          <p className="text-xs text-[var(--color-wh-fg-muted)] mb-2">Subject</p>
          <p className="font-semibold mb-4 p-3 bg-[var(--color-wh-beige)] rounded-lg">
            {activeVersion.subject}
          </p>
          <p className="text-xs text-[var(--color-wh-fg-muted)] mb-2">Body (gerendert)</p>
          <div
            className="border border-[var(--color-wh-winter-grey)] rounded-lg p-4 bg-[var(--color-wh-snow)]"
            dangerouslySetInnerHTML={{ __html: mdToHtml(activeVersion.bodyMd) }}
          />
        </section>
      )}
    </div>
  );
}
