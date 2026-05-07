"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Link2, Check, X, BookOpen } from "lucide-react";
import { DOC_SECTIONS, DOC_GROUPS, type DocSection } from "./sections";

export function HandbookClient() {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string>(DOC_SECTIONS[0]?.id ?? "");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Filter via Volltextsuche
  const filtered = useMemo(() => {
    if (!query.trim()) return DOC_SECTIONS;
    const q = query.toLowerCase().trim();
    return DOC_SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.searchText.toLowerCase().includes(q) ||
        s.group.toLowerCase().includes(q)
    );
  }, [query]);

  // Group sections
  const grouped = useMemo(() => {
    const map = new Map<string, DocSection[]>();
    for (const s of filtered) {
      if (!map.has(s.group)) map.set(s.group, []);
      map.get(s.group)!.push(s);
    }
    return DOC_GROUPS.map((g) => ({
      group: g,
      items: map.get(g) ?? [],
    })).filter((x) => x.items.length > 0);
  }, [filtered]);

  // URL hash sync — wenn sich die Sichtbare Sektion aendert, hash setzen
  // Beim ersten Mount: hash lesen und scrollen
  useEffect(() => {
    const initial = window.location.hash.replace("#", "");
    if (initial && DOC_SECTIONS.find((s) => s.id === initial)) {
      setActiveId(initial);
      requestAnimationFrame(() => {
        document.getElementById(initial)?.scrollIntoView({ behavior: "auto" });
      });
    }
  }, []);

  // Intersection-Observer fuer "active" highlight im Sidebar
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const id = visible[0].target.id;
          setActiveId(id);
          if (window.location.hash !== `#${id}`) {
            history.replaceState(null, "", `#${id}`);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.5, 1] }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [filtered]);

  const copyLink = async (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1400);
  };

  const goto = (id: string) => {
    setMobileNavOpen(false);
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-6 lg:gap-10">
      {/* === SIDEBAR === */}
      <aside
        className={`
          ${mobileNavOpen ? "fixed inset-0 z-40 bg-white p-6 overflow-auto" : "hidden lg:block"}
          lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-auto
        `}
      >
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={18} className="text-[var(--color-wh-deep-green)]" />
          <p className="text-xs uppercase tracking-wider font-bold text-[var(--color-wh-deep-green)]">
            Handbuch
          </p>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="ml-auto lg:hidden"
            aria-label="Schließen"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-wh-fg-muted)]"
          />
          <input
            type="search"
            placeholder="Suche im Handbuch …"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[var(--color-wh-winter-grey)] bg-white text-sm focus:border-[var(--color-wh-deep-green)] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-wh-fg-muted)]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sections grouped */}
        {grouped.length === 0 ? (
          <p className="text-xs text-[var(--color-wh-fg-muted)] italic">
            Keine Treffer für „{query}".
          </p>
        ) : (
          <nav className="space-y-5">
            {grouped.map(({ group, items }) => (
              <div key={group}>
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] font-semibold mb-1.5 px-2">
                  {group}
                </p>
                <ul className="space-y-0.5">
                  {items.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => goto(s.id)}
                        className={`w-full text-left text-sm px-2 py-1.5 rounded-md transition ${
                          activeId === s.id
                            ? "bg-[var(--color-wh-beige)] text-[var(--color-wh-deep-green)] font-semibold"
                            : "text-[var(--color-wh-black)] hover:bg-[var(--color-wh-beige)]/60"
                        }`}
                      >
                        {s.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        )}

        {query && filtered.length > 0 && (
          <p className="text-[11px] text-[var(--color-wh-fg-muted)] mt-4 italic">
            {filtered.length} Treffer
          </p>
        )}
      </aside>

      {/* === MAIN === */}
      <main className="min-w-0">
        {/* Mobile-Toggle */}
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="lg:hidden mb-4 inline-flex items-center gap-2 text-sm rounded-full border border-[var(--color-wh-winter-grey)] px-4 py-2"
        >
          <BookOpen size={16} /> Inhaltsverzeichnis
        </button>

        {filtered.length === 0 ? (
          <div className="bg-white border border-[var(--color-wh-winter-grey)] rounded-2xl p-10 text-center">
            <p className="text-[var(--color-wh-fg-muted)]">
              Nichts gefunden für „{query}".
            </p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-3 text-sm text-[var(--color-wh-deep-green)] underline"
            >
              Suche zurücksetzen
            </button>
          </div>
        ) : (
          filtered.map((s) => (
            <section
              key={s.id}
              id={s.id}
              ref={(el) => {
                sectionRefs.current[s.id] = el;
              }}
              className="bg-white border border-[var(--color-wh-winter-grey)] rounded-2xl p-6 lg:p-8 mb-6 scroll-mt-6"
            >
              <div className="flex items-start justify-between gap-3 mb-4 group">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--color-wh-fg-muted)] font-semibold mb-1">
                    {s.group}
                  </p>
                  <h2 className="font-display font-bold text-3xl text-[var(--color-wh-deep-green)] m-0 leading-tight">
                    {s.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => copyLink(s.id)}
                  className="opacity-0 group-hover:opacity-100 transition text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-wh-winter-grey)] hover:border-[var(--color-wh-deep-green)] text-[var(--color-wh-deep-green)] shrink-0"
                  title="Permalink zu dieser Sektion kopieren"
                >
                  {copiedId === s.id ? (
                    <>
                      <Check size={12} /> kopiert
                    </>
                  ) : (
                    <>
                      <Link2 size={12} /> Link
                    </>
                  )}
                </button>
              </div>
              <div className="prose-block">{s.body}</div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
