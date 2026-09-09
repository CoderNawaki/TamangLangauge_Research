export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export interface ExampleGloss {
  id: number;
  word: string;
  gloss: string | null;
  order: number;
}

export interface Example {
  id: number;
  text_devanagari: string | null;
  text_roman: string | null;
  translation_devanagari: string | null;
  translation_english: string | null;
  glosses: ExampleGloss[];
}

export interface WordForm {
  id: number;
  label: string | null;
  form_devanagari: string;
  form_roman: string | null;
  order: number;
}

export interface Sense {
  id: number;
  definition_devanagari: string;
  definition_roman: string | null;
  gloss: string | null;
  order: number;
  examples: Example[];
}

export interface Audio {
  id: number;
  dialect: Dialect | null;
  speaker: string | null;
  file_path: string;
  recorded_at: string | null;
}

export interface Dialect {
  id: number;
  name: string;
  name_local: string | null;
  region: string | null;
}

export interface Source {
  id: number;
  title: string | null;
  author: string | null;
  source_type: string;
}

export interface Entry {
  id: number;
  headword_devanagari: string;
  headword_roman: string | null;
  headword_ipa: string | null;
  headword_tamyig: string | null;
  tone: string | null;
  pos: string | null;
  grammar: string | null;
  status: string;
  frequency: number | null;
  dialect: Dialect | null;
  source: Source | null;
  senses: Sense[];
  audio: Audio[];
  wordforms: WordForm[];
}

export async function fetchEntries(params?: {
  q?: string;
  status?: string;
  pos?: string;
  tone?: string;
}): Promise<Entry[]> {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.status) query.set("status", params.status);
  if (params?.pos) query.set("pos", params.pos);
  if (params?.tone) query.set("tone", params.tone);
  const url = `${API_BASE_URL}/api/entries${query.toString() ? `?${query}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch entries (${res.status})`);
  return res.json() as Promise<Entry[]>;
}

export async function fetchEntry(id: number): Promise<Entry> {
  const res = await fetch(`${API_BASE_URL}/api/entries/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch entry (${res.status})`);
  return res.json() as Promise<Entry>;
}

export async function fetchDialects(): Promise<Dialect[]> {
  const res = await fetch(`${API_BASE_URL}/api/dialects`);
  if (!res.ok) throw new Error(`Failed to fetch dialects (${res.status})`);
  return res.json() as Promise<Dialect[]>;
}

export interface ExampleInput {
  text_devanagari?: string | null;
  text_roman?: string | null;
  translation_devanagari?: string | null;
  translation_english?: string | null;
  glosses?: ExampleGlossInput[];
}

export interface ExampleGlossInput {
  word: string;
  gloss?: string | null;
  order?: number;
}

export interface WordFormInput {
  label?: string | null;
  form_devanagari: string;
  form_roman?: string | null;
  order?: number;
}

export interface SenseInput {
  definition_devanagari: string;
  definition_roman?: string | null;
  gloss?: string | null;
  order?: number;
  examples?: ExampleInput[];
}

export interface EntryInput {
  headword_devanagari: string;
  headword_roman?: string | null;
  headword_ipa?: string | null;
  headword_tamyig?: string | null;
  tone?: string | null;
  pos?: string | null;
  grammar?: string | null;
  status?: string;
  frequency?: number | null;
  dialect_id?: number | null;
  source_id?: number | null;
  senses?: SenseInput[];
  wordforms?: WordFormInput[];
}

export async function createEntry(input: EntryInput): Promise<Entry> {
  const res = await fetch(`${API_BASE_URL}/api/entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to create entry (${res.status})`);
  return res.json() as Promise<Entry>;
}

export async function updateEntry(
  id: number,
  input: Partial<EntryInput>
): Promise<Entry> {
  const res = await fetch(`${API_BASE_URL}/api/entries/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to update entry (${res.status})`);
  return res.json() as Promise<Entry>;
}

export async function deleteEntry(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/entries/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Failed to delete entry (${res.status})`);
}

export async function uploadAudio(
  entryId: number,
  file: File,
  meta?: { speaker?: string | null; dialect_id?: number | null }
): Promise<Audio> {
  const body = new FormData();
  body.append("file", file);
  if (meta?.speaker) body.append("speaker", meta.speaker);
  if (meta?.dialect_id) body.append("dialect_id", String(meta.dialect_id));
  const res = await fetch(`${API_BASE_URL}/api/entries/${entryId}/audio`, {
    method: "POST",
    body,
  });
  if (!res.ok) throw new Error(`Failed to upload audio (${res.status})`);
  return res.json() as Promise<Audio>;
}

export async function deleteAudio(audioId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/audio/${audioId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Failed to delete audio (${res.status})`);
}

export interface CorpusCandidate {
  token: string;
  frequency: number;
}

export interface CorpusAnalysis {
  total_tokens: number;
  candidates: CorpusCandidate[];
}

export interface ImportSummary {
  created: number;
  skipped: number;
  duplicates: string[];
}

export async function analyzeCorpus(
  text: string,
  opts?: { maxCandidates?: number; minFrequency?: number }
): Promise<CorpusAnalysis> {
  const res = await fetch(`${API_BASE_URL}/api/import/corpus/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      max_candidates: opts?.maxCandidates ?? 100,
      min_frequency: opts?.minFrequency ?? 2,
    }),
  });
  if (!res.ok) throw new Error(`Failed to analyze corpus (${res.status})`);
  return res.json() as Promise<CorpusAnalysis>;
}

export async function createCorpusEntries(
  tokens: CorpusCandidate[]
): Promise<ImportSummary> {
  const res = await fetch(`${API_BASE_URL}/api/import/corpus/entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tokens }),
  });
  if (!res.ok) throw new Error(`Failed to create entries (${res.status})`);
  return res.json() as Promise<ImportSummary>;
}

export async function importWordlist(file: File): Promise<ImportSummary> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`${API_BASE_URL}/api/import/wordlist`, {
    method: "POST",
    body,
  });
  if (!res.ok) throw new Error(`Failed to import wordlist (${res.status})`);
  return res.json() as Promise<ImportSummary>;
}

export async function compareDialects(headword: string): Promise<Entry[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/compare?headword=${encodeURIComponent(headword)}`
  );
  if (!res.ok) throw new Error(`Failed to compare dialects (${res.status})`);
  return res.json() as Promise<Entry[]>;
}
