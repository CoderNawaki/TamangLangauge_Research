"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { API_BASE_URL, fetchEntry, type Entry } from "@/lib/api";

const TONE_NOTES: Record<string, string> = {
  T1: "highest pitch, falling contour, modal voice",
  T2: "second-highest pitch, modal voice",
  T3: "low rising pitch, breathy voice",
  T4: "lowest falling pitch, breathy voice",
};

function DetailSkeleton() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="h-8 w-1/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-6 h-24 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900" />
    </main>
  );
}

export default function EntryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchEntry(id)
      .then((data) => active && setEntry(data))
      .catch((e) =>
        active && setError(e instanceof Error ? e.message : "Entry not found")
      );
    return () => {
      active = false;
    };
  }, [id]);

  if (error) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
          {error} — is the backend running at {API_BASE_URL}?
        </p>
      </main>
    );
  }

  if (!entry) return <DetailSkeleton />;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        ← Back to dictionary
      </Link>

      {/* Headword: all scripts side by side */}
      <header className="mb-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1
            className="text-4xl font-bold text-zinc-900 dark:text-zinc-50"
            lang="ne"
          >
            {entry.headword_devanagari}
          </h1>
          {entry.headword_roman && (
            <span className="text-xl text-zinc-500">{entry.headword_roman}</span>
          )}
          {entry.headword_tamyig && (
            <span
              className="text-xl text-zinc-700 dark:text-zinc-300"
              lang="und"
            >
              {entry.headword_tamyig}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {entry.headword_ipa && (
            <code className="rounded bg-zinc-100 px-2 py-0.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              /{entry.headword_ipa}/
            </code>
          )}
          {entry.tone && (
            <span
              className="rounded bg-amber-100 px-2 py-0.5 font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
              title={TONE_NOTES[entry.tone]}
            >
              Tone {entry.tone}
            </span>
          )}
          {entry.pos && (
            <span className="italic text-zinc-500">{entry.pos}</span>
          )}
          <span
            className={`rounded px-2 py-0.5 uppercase tracking-wide text-xs ${
              entry.status === "published"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {entry.status}
          </span>
        </div>
      </header>

      {/* Tone notes */}
      {entry.tone && TONE_NOTES[entry.tone] && (
        <p className="mb-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-100">
          Tone {entry.tone}: {TONE_NOTES[entry.tone]}
        </p>
      )}

      {/* Senses */}
      <section className="space-y-4">
        {entry.senses.map((sense) => (
          <div
            key={sense.id}
            className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex items-start gap-3">
              <span className="mt-1 text-sm font-medium text-zinc-400">
                {sense.order + 1}.
              </span>
              <div>
                <p
                  className="text-xl text-zinc-900 dark:text-zinc-50"
                  lang="ne"
                >
                  {sense.definition_devanagari}
                </p>
                {sense.definition_roman && (
                  <p className="text-sm text-zinc-500">{sense.definition_roman}</p>
                )}
                {sense.gloss && (
                  <p className="mt-1 text-sm text-zinc-400">{sense.gloss}</p>
                )}
              </div>
            </div>

            {sense.examples.length > 0 && (
              <div className="mt-3 space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                {sense.examples.map((ex) => (
                  <div key={ex.id} className="text-sm">
                    <p lang="ne" className="text-zinc-800 dark:text-zinc-200">
                      {ex.text_devanagari}
                    </p>
                    {ex.text_roman && (
                      <p className="text-zinc-500">{ex.text_roman}</p>
                    )}
                    {ex.translation_english && (
                      <p className="italic text-zinc-400">
                        {ex.translation_english}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Audio */}
      {entry.audio.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-zinc-500">
            Pronunciation
          </h2>
          {entry.audio.map((a) => (
            <audio
              key={a.id}
              controls
              src={`${API_BASE_URL}/${a.file_path}`}
              className="w-full"
            />
          ))}
        </section>
      )}

      {/* Metadata */}
      <footer className="mt-8 border-t border-zinc-100 pt-4 text-xs text-zinc-400 dark:border-zinc-800">
        {entry.dialect && (
          <p>
            Dialect: {entry.dialect.name}
            {entry.dialect.region ? ` (${entry.dialect.region})` : ""}
          </p>
        )}
        {entry.source && (
          <p>
            Source: {entry.source.title}
            {entry.source.author ? ` by ${entry.source.author}` : ""}
          </p>
        )}
        {entry.frequency != null && <p>Frequency: {entry.frequency}</p>}
      </footer>
    </main>
  );
}
