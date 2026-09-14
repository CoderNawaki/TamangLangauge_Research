"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchMinimalPairs, type MinimalPairGroup } from "@/lib/api";

const TONE_COLORS: Record<string, string> = {
  T1: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
  T2: "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100",
  T3: "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100",
  T4: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100",
};

export default function MinimalPairsPage() {
  const [groups, setGroups] = useState<MinimalPairGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMinimalPairs()
      .then(setGroups)
      .catch((err) => setError(err instanceof Error ? err.message : "Load failed"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Tone minimal pairs
        </h1>
        <p className="text-sm text-zinc-500">
          Headwords that share the same shape but differ only by tone class
          (T1–T4). Classic example: the कुपा quadruplet.
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {loading && <p className="text-zinc-500">Loading…</p>}

      {!loading && !error && groups.length === 0 && (
        <p className="text-zinc-500">
          No minimal pairs found yet — search a common stem with recordings in
          different tones.
        </p>
      )}

      <div className="space-y-6">
        {groups.map((g) => (
          <section
            key={g.stem}
            className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <header className="mb-3 flex items-baseline gap-3">
              <h2 className="font-mono text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {g.stem}
              </h2>
              <span className="text-sm text-zinc-500">
                {g.tones.length} tones · {g.entries.length} entries
              </span>
            </header>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {g.entries.map((m) => (
                <Link
                  key={m.id}
                  href={`/entry/${m.id}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  <div>
                    <span lang="ne" className="text-lg text-zinc-900 dark:text-zinc-50">
                      {m.headword_devanagari}
                    </span>
                    {m.headword_ipa && (
                      <span className="ml-2 font-mono text-xs text-zinc-400">
                        /{m.headword_ipa}/
                      </span>
                    )}
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${TONE_COLORS[m.tone] ?? "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}`}
                  >
                    {m.tone}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}