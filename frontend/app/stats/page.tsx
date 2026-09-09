"use client";

import { useEffect, useState } from "react";
import { fetchStats, type Stats } from "@/lib/api";

function BarList({ data, total }: { data: Record<string, number>; total?: number }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return <p className="text-sm text-zinc-500">No data.</p>;
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <ul className="space-y-1.5">
      {entries.map(([label, count]) => (
        <li key={label} className="flex items-center gap-2 text-sm">
          <span className="w-40 shrink-0 truncate text-zinc-600 dark:text-zinc-300">
            {label}
          </span>
          <div className="h-3 flex-1 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded bg-zinc-800 dark:bg-zinc-200"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-zinc-400">
            {count}
            {total && total > 0
              ? ` (${Math.round((count / total) * 100)}%)`
              : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Load failed"))
      .finally(() => setLoading(false));
  }, []);

  const statItems: [string, number][] = [
    ["Senses", stats?.senses ?? 0],
    ["Examples", stats?.examples ?? 0],
    ["Word glosses", stats?.glosses ?? 0],
    ["Word forms", stats?.wordforms ?? 0],
    ["Audio recordings", stats?.audio ?? 0],
    ["Semantic groups", stats?.semantic_groups ?? 0],
  ];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Dictionary statistics
        </h1>
        <p className="text-sm text-zinc-500">
          Progress of the Tamang dictionary corpus.
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {loading && <p className="text-zinc-500">Loading…</p>}
      {!loading && !error && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-zinc-200 p-4 text-center dark:border-zinc-800">
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {stats.entries.total}
              </p>
              <p className="text-xs text-zinc-500">total entries</p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4 text-center dark:border-zinc-800">
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                {stats.entries.published}
              </p>
              <p className="text-xs text-zinc-500">published</p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4 text-center dark:border-zinc-800">
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {stats.entries.total > 0
                  ? Math.round((stats.entries.published / stats.entries.total) * 100)
                  : 0}
                %
              </p>
              <p className="text-xs text-zinc-500">published rate</p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4 text-center dark:border-zinc-800">
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {stats.senses}
              </p>
              <p className="text-xs text-zinc-500">senses</p>
            </div>
          </div>

          <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="mb-3 text-sm font-medium text-zinc-500">By status</h2>
            <BarList data={stats.by_status} total={stats.entries.total} />
          </section>

          <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="mb-3 text-sm font-medium text-zinc-500">By tone</h2>
            <BarList data={stats.by_tone} total={stats.entries.total} />
          </section>

          <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="mb-3 text-sm font-medium text-zinc-500">
              By part of speech
            </h2>
            <BarList data={stats.by_pos} total={stats.entries.total} />
          </section>

          <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="mb-3 text-sm font-medium text-zinc-500">By dialect</h2>
            <BarList data={stats.by_dialect} total={stats.entries.total} />
          </section>

          <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="mb-3 text-sm font-medium text-zinc-500">
              Content depth
            </h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {statItems.map(([label, count]) => (
                <div key={label} className="rounded bg-zinc-50 p-3 dark:bg-zinc-900">
                  <dt className="text-xs text-zinc-500">{label}</dt>
                  <dd className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                    {count}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      )}
    </main>
  );
}