"use client";

import Link from "next/link";
import { useState } from "react";
import {
  analyzeCorpus,
  createCorpusEntries,
  importWordlist,
  type CorpusCandidate,
  type ImportSummary,
} from "@/lib/api";

function SummaryBanner({ summary }: { summary: ImportSummary }) {
  return (
    <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
      Created {summary.created}, skipped {summary.skipped}
      {summary.duplicates.length > 0 &&
        ` (already present: ${summary.duplicates.slice(0, 5).join(", ")}${summary.duplicates.length > 5 ? "…" : ""})`}
    </p>
  );
}

function CorpusSection() {
  const [text, setText] = useState("");
  const [minFrequency, setMinFrequency] = useState(2);
  const [analyzing, setAnalyzing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [candidates, setCandidates] = useState<CorpusCandidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [totalTokens, setTotalTokens] = useState(0);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError("Paste some corpus text first.");
      return;
    }
    setAnalyzing(true);
    setError(null);
    setSummary(null);
    try {
      const result = await analyzeCorpus(text, { minFrequency });
      setCandidates(result.candidates.slice(0, 100));
      setSelected(new Set(result.candidates.map((c) => c.token)));
      setTotalTokens(result.total_tokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const toggle = (token: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(token)) next.delete(token);
      else next.add(token);
      return next;
    });

  const handleCreate = async () => {
    if (selected.size === 0) return;
    setCreating(true);
    setError(null);
    try {
      const summary = await createCorpusEntries(
        candidates.filter((c) => selected.has(c.token))
      );
      setSummary(summary);
      setCandidates(candidates.filter((c) => !selected.has(c.token)));
      setSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Corpus extraction
      </h2>
      <p className="mb-3 text-sm text-zinc-500">
        Paste raw Tamang text. Repeated words become candidate headwords
        (frequency-sorted); pick the ones to save as draft entries.
      </p>

      <form onSubmit={handleAnalyze} className="space-y-3">
        <textarea
          lang="ne"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Paste corpus text here…"
          className="w-full rounded-lg border border-zinc-300 p-3 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            Min frequency
            <input
              type="number"
              min={1}
              max={1000}
              value={minFrequency}
              onChange={(e) => setMinFrequency(Number(e.target.value))}
              className="w-20 rounded border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <button
            type="submit"
            disabled={analyzing}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
          >
            {analyzing ? "Analyzing…" : "Analyze"}
          </button>
        </div>
      </form>

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {summary && (
        <div className="mt-3">
          <SummaryBanner summary={summary} />
        </div>
      )}

      {candidates.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-sm text-zinc-500">
            <span>
              {totalTokens} tokens → {candidates.length} candidates
            </span>
            <span>
              {selected.size} selected ·{" "}
              <button
                type="button"
                onClick={() =>
                  setSelected(new Set(candidates.map((c) => c.token)))
                }
                className="text-zinc-600 hover:underline dark:text-zinc-300"
              >
                select all
              </button>
            </span>
          </div>
          <ul className="max-h-72 overflow-y-auto rounded-lg border border-zinc-200 text-sm dark:border-zinc-800">
            {candidates.map((c) => (
              <li key={c.token} className="border-b border-zinc-100 dark:border-zinc-800">
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <input
                    type="checkbox"
                    checked={selected.has(c.token)}
                    onChange={() => toggle(c.token)}
                  />
                  <span lang="ne" className="flex-1">
                    {c.token}
                  </span>
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    ×{c.frequency}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || selected.size === 0}
            className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
          >
            {creating
              ? "Creating…"
              : `Create ${selected.size} draft entry${selected.size === 1 ? "" : "s"}`}
          </button>
        </div>
      )}
    </section>
  );
}

function WordlistSection() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Choose a CSV or JSON file.");
      return;
    }
    setImporting(true);
    setError(null);
    setSummary(null);
    try {
      setSummary(await importWordlist(file));
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Batch wordlist import
      </h2>
      <p className="mb-3 text-sm text-zinc-500">
        Upload an existing wordlist. CSV needs a{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
          headword_devanagari
        </code>{" "}
        column (optional: definition_devanagari, gloss, headword_roman,
        headword_ipa, tone, pos, status, frequency). JSON accepts an array of
        entry objects.
      </p>
      <form onSubmit={handleImport} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Wordlist file</span>
          <input
            type="file"
            accept=".csv,.json,text/csv,application/json"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm file:mr-3 file:rounded file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-white dark:file:bg-zinc-50 dark:file:text-black"
          />
        </label>
        <button
          type="submit"
          disabled={importing}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
        >
          {importing ? "Importing…" : "Import"}
        </button>
      </form>
      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {summary && (
        <div className="mt-3">
          <SummaryBanner summary={summary} />
        </div>
      )}
    </section>
  );
}

export default function AdminImportPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Import Data
          </h1>
          <p className="text-sm text-zinc-500">
            Automated draft extraction — review, then publish in the entry
            list.
          </p>
        </div>
        <Link
          href="/admin/list"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← Manage entries
        </Link>
      </header>

      <div className="space-y-6">
        <CorpusSection />
        <WordlistSection />
      </div>
    </main>
  );
}