export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export interface Example {
  id: number;
  text_devanagari: string | null;
  text_roman: string | null;
  translation_devanagari: string | null;
  translation_english: string | null;
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
  dialect_id: number | null;
  speaker: string | null;
  file_path: string;
  recorded_at: string | null;
}

export interface Entry {
  id: number;
  headword_devanagari: string;
  headword_roman: string | null;
  headword_ipa: string | null;
  headword_tamyig: string | null;
  tone: string | null;
  pos: string | null;
  status: string;
  frequency: number | null;
  senses: Sense[];
  audio: Audio[];
}

export async function fetchEntries(params?: {
  q?: string;
  status?: string;
}): Promise<Entry[]> {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.status) query.set("status", params.status);
  const url = `${API_BASE_URL}/api/entries${query.toString() ? `?${query}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch entries (${res.status})`);
  return res.json() as Promise<Entry[]>;
}
