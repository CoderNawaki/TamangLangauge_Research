"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { deleteEntry, type Entry, fetchEntries } from "@/lib/api";

export default function AdminListPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      setEntries(await fetchEntries(q ? { q } : {}));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load entries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (entry: Entry) => {
    if (!confirm(`Delete "${entry.headword_devanagari}"?`)) return;
    try {
      await deleteEntry(entry.id);
      setEntries((es) => es.filter((e) => e.id !== entry.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Manage Entries
        </h1>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            ← Dictionary
          </Link>
          <Link
            href="/admin"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-black"
          >
            + New Entry
          </Link>
        </div>
      </header>

      <form
        className="mb-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          load(query);
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-black"
        >
          Search
        </button>
      </form>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-zinc-500">No entries.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between py-3"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-medium">{entry.headword_devanagari}</span>
                <span className="text-sm text-zinc-500">{entry.headword_roman}</span>
                <span className="text-xs text-zinc-400">{entry.pos}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">{entry.status}</span>
                <Link
                  href={`/admin?id=${entry.id}`}
                  className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(entry)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
