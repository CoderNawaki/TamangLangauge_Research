"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL, type Entry, exportUrl, fetchEntries } from "@/lib/api";

function SenseList({ entry }: { entry: Entry }) {
  return (
    <div className="space-y-1">
      {entry.senses.map((sense) => (
        <div key={sense.id} className="text-zinc-700 dark:text-zinc-300">
          <span className="text-sm" lang="ne">
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
    <Link
      href={`/entry/${entry.id}`}
      className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
    >
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {entry.headword_devanagari}
        </span>
        {entry.headword_roman && (
          <span className="text-sm text-zinc-500">{entry.headword_roman}</span>
        )}
        {entry.tone && (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
            {entry.tone}
          </span>
        )}
        {entry.pos && (
          <span className="text-xs italic text-zinc-400">{entry.pos}</span>
        )}
        {entry.audio.length > 0 && (
          <span className="text-xs text-zinc-400">🔊</span>
        )}
      </div>
      <SenseList entry={entry} />
    </Link>
  );
}

type Direction = "tamang-nepali" | "nepali-tamang";

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [query, setQuery] = useState("");
  const [direction, setDirection] = useState<Direction>("tamang-nepali");
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
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            तामाङ् शब्दकोश
          </h1>
          <p className="mt-1 text-zinc-500">Tamang Language Dictionary</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/minimal-pairs"
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Minimal pairs →
          </Link>
          <Link
            href="/groups"
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Groups →
          </Link>
          <Link
            href="/stats"
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Stats →
          </Link>
          <Link
            href="/compare"
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Compare dialects →
          </Link>
          <Link
            href="/admin"
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Manage entries →
          </Link>
        </div>
      </header>

      {/* Bilingual direction toggle */}
      <div className="mb-3 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => setDirection("tamang-nepali")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            direction === "tamang-nepali"
              ? "bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-zinc-50"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          तामाङ् → नेपाली
        </button>
        <button
          type="button"
          onClick={() => setDirection("nepali-tamang")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            direction === "nepali-tamang"
              ? "bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-zinc-50"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          नेपाली → तामाङ्
        </button>
      </div>

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
          placeholder={
            direction === "tamang-nepali"
              ? "Type a Tamang word (Devanagari, roman, or IPA)…"
              : "Type a Nepali word to find its Tamang equivalent…"
          }
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
        <p className="text-zinc-500">No entries found.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      <footer className="mt-12 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <p className="mb-2 text-xs text-zinc-400">Export dictionary data</p>
        <div className="flex flex-wrap gap-2 text-sm">
          <a href={exportUrl("json")} className="text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50">
            JSON
          </a>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <a href={exportUrl("csv")} className="text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50">
            CSV
          </a>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <a href={exportUrl("teilex")} className="text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50">
            TEILex
          </a>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <a href={exportUrl("csv", true)} className="text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50">
            CSV (incl. drafts)
          </a>
        </div>
      </footer>
    </main>
  );
}
