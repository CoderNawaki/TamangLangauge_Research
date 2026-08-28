"use client";

import { useCallback, useEffect, useState } from "react";
import {
  API_BASE_URL,
  type Entry,
  fetchEntries,
} from "@/lib/api";

function SenseList({ entry }: { entry: Entry }) {
  return (
    <div className="space-y-1">
      {entry.senses.map((sense) => (
        <div key={sense.id} className="text-zinc-700 dark:text-zinc-300">
          <span className="text-sm">
            {sense.order + 1}. {sense.definition_devanagari}
          </span>
          <span className="ml-2 text-xs text-zinc-500">
            {sense.gloss || sense.definition_roman}
          </span>
        </div>
      ))}
    </div>
  );
}

function EntryRow({ entry }: { entry: Entry }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {entry.headword_devanagari}
        </span>
        {entry.headword_roman && (
          <span className="text-sm text-zinc-500">{entry.headword_roman}</span>
        )}
        {entry.tone && (
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {entry.tone}
          </span>
        )}
        {entry.pos && (
          <span className="text-xs italic text-zinc-400">{entry.pos}</span>
        )}
        {entry.audio.length > 0 && (
          <span className="text-xs text-zinc-400">🔊 audio</span>
        )}
      </div>
      <SenseList entry={entry} />
    </div>
  );
}

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEntries(q ? { q } : {});
      setEntries(data);
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

  return (
    <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          तामाङ् शब्दकोश
        </h1>
        <p className="mt-1 text-zinc-500">Tamang Language Dictionary</p>
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
          placeholder="Search Devanagari or romanized word…"
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-black"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error} — is the backend running at {API_BASE_URL}?{" "}
          <span className="font-mono text-xs">
            (cd backend && uvicorn app.main:app --reload)
          </span>
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-zinc-500">No entries yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </main>
  );
}
