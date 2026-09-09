"use client";

import Link from "next/link";
import { useState } from "react";
import { compareDialects, type Entry } from "@/lib/api";

export default function ComparePage() {
  const [headword, setHeadword] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headword.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      setEntries(await compareDialects(headword.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Dialect comparison
        </h1>
        <p className="text-sm text-zinc-500">
          See the same headword recorded across regional Tamang varieties.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
        <input
          lang="ne"
          value={headword}
          onChange={(e) => setHeadword(e.target.value)}
          placeholder="Headword (Devanagari or roman), e.g. कुपा"
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-black"
        >
          Compare
        </button>
      </form>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading && <p className="text-zinc-500">Loading…</p>}

      {searched && !loading && entries.length === 0 && (
        <p className="text-zinc-500">No entries found for this headword.</p>
      )}

      {searched && entries.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2">Dialect</th>
                <th className="px-3 py-2">Headword</th>
                <th className="px-3 py-2">IPA</th>
                <th className="px-3 py-2">Tone</th>
                <th className="px-3 py-2">POS</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <td className="px-3 py-2 text-zinc-500">
                    {entry.dialect ? (
                      <>
                        {entry.dialect.name}
                        {entry.dialect.region ? ` (${entry.dialect.region})` : ""}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/entry/${entry.id}`}
                      className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                      lang="ne"
                    >
                      {entry.headword_devanagari}
                    </Link>
                    {entry.headword_roman && (
                      <span className="ml-2 text-xs text-zinc-400">
                        {entry.headword_roman}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-zinc-500">
                    {entry.headword_ipa ? `/${entry.headword_ipa}/` : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {entry.tone ? (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                        {entry.tone}
                      </span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 italic text-zinc-500">
                    {entry.pos || "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-zinc-400">
                    {entry.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}