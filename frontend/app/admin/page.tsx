"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  API_BASE_URL,
  createEntry,
  updateEntry,
  fetchEntry,
  fetchDialects,
  uploadAudio,
  deleteAudio,
  type Audio,
  type Dialect,
  type EntryInput,
} from "@/lib/api";

const POS_OPTIONS = ["noun", "verb", "adjective", "adverb", "pronoun", "particle", "interjection", "other"];
const TONE_OPTIONS = ["T1", "T2", "T3", "T4"];
const STATUS_OPTIONS = ["draft", "reviewed", "published"];

interface LocalExample {
  key: number;
  text_devanagari: string;
  text_roman: string;
  translation_devanagari: string;
  translation_english: string;
}

interface LocalSense {
  key: number;
  definition_devanagari: string;
  definition_roman: string;
  gloss: string;
  order: number;
  examples: LocalExample[];
}

interface FormState {
  headword_devanagari: string;
  headword_roman: string;
  headword_ipa: string;
  tone: string;
  pos: string;
  status: string;
  senses: LocalSense[];
  audio: Audio[];
}

const nextFreeKey = (senses: LocalSense[]): number => {
  let max = -1;
  for (const s of senses) {
    max = Math.max(max, s.key);
    for (const x of s.examples) max = Math.max(max, x.key);
  }
  return max + 1;
};

const emptyExample = (key: number): LocalExample => ({
  key,
  text_devanagari: "",
  text_roman: "",
  translation_devanagari: "",
  translation_english: "",
});

const emptySense = (key: number): LocalSense => ({
  key,
  definition_devanagari: "",
  definition_roman: "",
  gloss: "",
  order: 0,
  examples: [],
});

function AdminForm() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("id") ? Number(searchParams.get("id")) : null;

  const [form, setForm] = useState<FormState>(() => ({
    headword_devanagari: "",
    headword_roman: "",
    headword_ipa: "",
    tone: "",
    pos: "",
    status: "draft",
    senses: [emptySense(0)],
    audio: [],
  }));
  const [loading, setLoading] = useState(editId !== null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [nextKey, setNextKey] = useState(1);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioSpeaker, setAudioSpeaker] = useState("");
  const [audioDialectId, setAudioDialectId] = useState("");
  const [dialects, setDialects] = useState<Dialect[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;
    fetchDialects()
      .then((d) => active && setDialects(d))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (editId === null) return;
    let active = true;
    setLoading(true);
    fetchEntry(editId)
      .then((e) => {
        if (!active) return;
        const senses: LocalSense[] = e.senses.map((s, i) => ({
          key: i,
          definition_devanagari: s.definition_devanagari,
          definition_roman: s.definition_roman ?? "",
          gloss: s.gloss ?? "",
          order: s.order,
          examples: s.examples.map((x, j) => ({
            key: j,
            text_devanagari: x.text_devanagari ?? "",
            text_roman: x.text_roman ?? "",
            translation_devanagari: x.translation_devanagari ?? "",
            translation_english: x.translation_english ?? "",
          })),
        }));
        setForm({
          headword_devanagari: e.headword_devanagari,
          headword_roman: e.headword_roman ?? "",
          headword_ipa: e.headword_ipa ?? "",
          tone: e.tone ?? "",
          pos: e.pos ?? "",
          status: e.status,
          senses,
          audio: e.audio,
        });
        setNextKey(nextFreeKey(senses));
        setLoading(false);
      })
      .catch((err) => {
        if (active) {
          setMessage({ type: "err", text: err.message });
          setLoading(false);
        }
      });
  }, [editId]);

  if (loading) return <p className="text-zinc-500">Loading entry…</p>;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setSense = (
    key: number,
    patch: Partial<Pick<LocalSense, "definition_devanagari" | "definition_roman" | "gloss">>
  ) =>
    setForm((f) => ({
      ...f,
      senses: f.senses.map((s) => (s.key === key ? { ...s, ...patch } : s)),
    }));

  const setExample = (
    senseKey: number,
    exKey: number,
    patch: Partial<Pick<LocalExample, "text_devanagari" | "translation_english">>
  ) =>
    setForm((f) => ({
      ...f,
      senses: f.senses.map((s) =>
        s.key === senseKey
          ? {
              ...s,
              examples: s.examples.map((x) =>
                x.key === exKey ? { ...x, ...patch } : x
              ),
            }
          : s
      ),
    }));

  const addSense = () => {
    setForm((f) => ({ ...f, senses: [...f.senses, emptySense(nextKey)] }));
    setNextKey((k) => k + 1);
  };

  const removeSense = (key: number) =>
    setForm((f) => ({ ...f, senses: f.senses.filter((s) => s.key !== key) }));

  const addExample = (senseKey: number) =>
    setForm((f) => ({
      ...f,
      senses: f.senses.map((s) =>
        s.key === senseKey
          ? {
              ...s,
              examples: [
                ...s.examples,
                { key: nextKey, text_devanagari: "", text_roman: "", translation_devanagari: "", translation_english: "" },
              ],
            }
          : s
      ),
    }));
  const removeExample = (senseKey: number, exKey: number) =>
    setForm((f) => ({
      ...f,
      senses: f.senses.map((s) =>
        s.key === senseKey
          ? { ...s, examples: s.examples.filter((x) => x.key !== exKey) }
          : s
      ),
    }));

  const handleUploadAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId === null) return;
    if (!audioFile) {
      setMessage({ type: "err", text: "Choose an audio file to upload." });
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const created = await uploadAudio(editId, audioFile, {
        speaker: audioSpeaker || null,
        dialect_id: audioDialectId ? Number(audioDialectId) : null,
      });
      setForm((f) => ({ ...f, audio: [...f.audio, created] }));
      setAudioFile(null);
      setAudioSpeaker("");
      setAudioDialectId("");
      setMessage({ type: "ok", text: "Recording uploaded." });
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Upload failed",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAudio = async (record: Audio) => {
    try {
      await deleteAudio(record.id);
      setForm((f) => ({ ...f, audio: f.audio.filter((a) => a.id !== record.id) }));
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Delete failed",
      });
    }
  };

  const buildPayload = (): EntryInput => ({
    headword_devanagari: form.headword_devanagari,
    headword_roman: form.headword_roman || null,
    headword_ipa: form.headword_ipa || null,
    tone: form.tone || null,
    pos: form.pos || null,
    status: form.status,
    senses: form.senses
      .filter((s) => s.definition_devanagari.trim())
      .map((s, i) => ({
        definition_devanagari: s.definition_devanagari,
        definition_roman: s.definition_roman || null,
        gloss: s.gloss || null,
        order: i,
        examples: s.examples
          .filter((x) => x.text_devanagari?.trim())
          .map((x) => ({
            text_devanagari: x.text_devanagari || null,
            text_roman: x.text_roman || null,
            translation_devanagari: x.translation_devanagari || null,
            translation_english: x.translation_english || null,
          })),
      })),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.headword_devanagari.trim()) {
      setMessage({ type: "err", text: "Headword (Devanagari) is required." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const payload = buildPayload();
      if (editId !== null) {
        await updateEntry(editId, payload);
        setMessage({ type: "ok", text: "Entry updated." });
      } else {
        await createEntry(payload);
        setMessage({ type: "ok", text: "Entry created." });
        setForm({
          headword_devanagari: "",
          headword_roman: "",
          headword_ipa: "",
          tone: "",
          pos: "",
          status: "draft",
          senses: [emptySense(nextKey)],
          audio: [],
        });
        setNextKey((k) => k + 1);
      }
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {editId !== null ? "Edit Entry" : "New Entry"}
          </h1>
          <p className="text-sm text-zinc-500">Add a Tamang dictionary entry</p>
        </div>
        <Link
          href="/admin/list"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          Manage entries →
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Headword */}
        <section className="grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Headword (Devanagari) *</span>
            <input
              lang="ne"
              value={form.headword_devanagari}
              onChange={(e) => set("headword_devanagari", e.target.value)}
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Romanization</span>
            <input
              value={form.headword_roman}
              onChange={(e) => set("headword_roman", e.target.value)}
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">IPA</span>
            <input
              value={form.headword_ipa}
              onChange={(e) => set("headword_ipa", e.target.value)}
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Tone</span>
              <select
                value={form.tone}
                onChange={(e) => set("tone", e.target.value)}
                className="rounded border border-zinc-300 px-2 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">—</option>
                {TONE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">POS</span>
              <select
                value={form.pos}
                onChange={(e) => set("pos", e.target.value)}
                className="rounded border border-zinc-300 px-2 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">—</option>
                {POS_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Status</span>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className="rounded border border-zinc-300 px-2 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* Senses */}
        <section className="space-y-4">
          {form.senses.map((sense, idx) => (
            <div key={sense.key} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">Sense {idx + 1}</span>
                <button
                  type="button"
                  onClick={() => removeSense(sense.key)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">Definition (Devanagari)</span>
                  <input
                    lang="ne"
                    value={sense.definition_devanagari}
                    onChange={(e) => setSense(sense.key, { definition_devanagari: e.target.value })}
                    className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">Definition (roman)</span>
                  <input
                    value={sense.definition_roman}
                    onChange={(e) => setSense(sense.key, { definition_roman: e.target.value })}
                    className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">Gloss</span>
                  <input
                    value={sense.gloss || ""}
                    onChange={(e) => setSense(sense.key, { gloss: e.target.value })}
                    className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
              </div>

              {/* Examples */}
              {sense.examples.map((ex) => (
                <div key={ex.key} className="mt-3 space-y-2 rounded bg-zinc-50 p-3 dark:bg-zinc-900">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Example</span>
                    <button
                      type="button"
                      onClick={() => removeExample(sense.key, ex.key)}
                      className="text-xs text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    lang="ne"
                    placeholder="Sentence (Devanagari)"
                    value={ex.text_devanagari ?? ""}
                    onChange={(e) => setExample(sense.key, ex.key, { text_devanagari: e.target.value })}
                    className="w-full rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <input
                    placeholder="English translation"
                    value={ex.translation_english ?? ""}
                    onChange={(e) => setExample(sense.key, ex.key, { translation_english: e.target.value })}
                    className="w-full rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => addExample(sense.key)}
                className="mt-3 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                + Add example
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSense}
            className="w-full rounded-lg border border-dashed border-zinc-300 py-2 text-sm text-zinc-500 hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500"
          >
            + Add sense
          </button>
        </section>

        {/* Pronunciation recordings */}
        {editId !== null && (
          <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="mb-3 text-sm font-medium">Pronunciation recordings</h2>
            {form.audio.length > 0 && (
              <ul className="mb-4 space-y-3">
                {form.audio.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-3"
                  >
                    <audio
                      controls
                      src={`${API_BASE_URL}/${a.file_path}`}
                      className="h-9 min-w-0 flex-1"
                    />
                    <span className="w-36 shrink-0 truncate text-xs text-zinc-500">
                      {a.dialect ? a.dialect.name : "—"}
                    </span>
                    <span className="w-36 shrink-0 truncate text-xs text-zinc-500">
                      {a.speaker || "unnamed speaker"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAudio(a)}
                      className="shrink-0 text-sm text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={handleUploadAudio} className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Audio file</span>
                <input
                  type="file"
                  accept=".mp3,.wav,.ogg,.m4a,.aac,.flac,.webm,audio/*"
                  onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                  className="text-sm file:mr-3 file:rounded file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-white dark:file:bg-zinc-50 dark:file:text-black"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Speaker</span>
                <input
                  value={audioSpeaker}
                  onChange={(e) => setAudioSpeaker(e.target.value)}
                  placeholder="Optional"
                  className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Dialect</span>
                <select
                  value={audioDialectId}
                  onChange={(e) => setAudioDialectId(e.target.value)}
                  className="rounded border border-zinc-300 px-2 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <option value="">—</option>
                  {dialects.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                      {d.region ? ` (${d.region})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={uploading}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
              >
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </form>
          </section>
        )}

        {message && (
          <p
            className={`rounded-lg p-3 text-sm ${
              message.type === "ok"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-zinc-900 px-6 py-2.5 font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
        >
          {saving ? "Saving…" : editId !== null ? "Save Changes" : "Create Entry"}
        </button>
      </form>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="p-10">Loading…</p>}>
      <AdminForm />
    </Suspense>
  );
}
