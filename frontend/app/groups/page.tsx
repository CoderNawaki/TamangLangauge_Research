"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  addEntryToGroup,
  createGroup,
  fetchEntries,
  fetchGroupEntries,
  fetchGroups,
  removeEntryFromGroup,
  type Entry,
  type GroupSummary,
} from "@/lib/api";

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [openId, setOpenId] = useState<number | null>(null);
  const [members, setMembers] = useState<Entry[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Entry[]>([]);
  const [searching, setSearching] = useState(false);

  const load = () =>
    fetchGroups()
      .then(setGroups)
      .catch((err) => setError(err instanceof Error ? err.message : "Load failed"))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    setMessage(null);
    try {
      await createGroup({ name: name.trim(), description: description.trim() || null });
      setName("");
      setDescription("");
      await load();
      setMessage("Group created.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const toggle = async (g: GroupSummary) => {
    if (openId === g.id) {
      setOpenId(null);
      return;
    }
    setOpenId(g.id);
    setMembersLoading(true);
    setError(null);
    try {
      setMembers(await fetchGroupEntries(g.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setMembersLoading(false);
    }
  };

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      setResults(await fetchEntries({ q: q.trim() }));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (entry: Entry) => {
    if (openId === null) return;
    try {
      await addEntryToGroup(openId, entry.id);
      setMembers(await fetchGroupEntries(openId));
      setSearch("");
      setResults([]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add failed");
    }
  };

  const handleRemove = async (entry: Entry) => {
    if (openId === null) return;
    try {
      await removeEntryFromGroup(openId, entry.id);
      setMembers(await fetchGroupEntries(openId));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Semantic groups
        </h1>
        <p className="text-sm text-zinc-500">
          Cluster related entries — kinship, cooking, tones, flora, and more.
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </p>
      )}

      <form
        onSubmit={handleCreate}
        className="mb-8 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">New group</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. Cooking verbs)"
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">Description</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional"
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <button
          type="submit"
          disabled={creating}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
        >
          Create
        </button>
      </form>

      {loading && <p className="text-zinc-500">Loading…</p>}
      {!loading && groups.length === 0 && (
        <p className="text-zinc-500">No groups yet.</p>
      )}

      <ul className="space-y-3" id="group-list">
        {groups.map((g) => {
          const open = openId === g.id;
          return (
            <li
              key={g.id}
              id={`group-${g.id}`}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800"
            >
              <button
                type="button"
                onClick={() => toggle(g)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {g.name}
                  </span>
                  {g.description && (
                    <span className="ml-2 text-sm text-zinc-500">
                      {g.description}
                    </span>
                  )}
                </span>
                <span className="text-sm text-zinc-400">
                  {g.entry_count} entries{open ? " ▴" : " ▾"}
                </span>
              </button>

              {open && (
                <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
                  {membersLoading ? (
                    <p className="text-sm text-zinc-500">Loading…</p>
                  ) : (
                    <ul className="mb-3 space-y-1">
                      {members.map((m) => (
                        <li
                          key={m.id}
                          className="flex items-center justify-between rounded bg-zinc-50 px-3 py-1.5 text-sm dark:bg-zinc-900"
                        >
                          <Link
                            href={`/entry/${m.id}`}
                            className="text-zinc-800 hover:underline dark:text-zinc-200"
                          >
                            <span lang="ne">{m.headword_devanagari}</span>
                            {m.headword_roman && (
                              <span className="ml-2 text-xs text-zinc-400">
                                {m.headword_roman}
                              </span>
                            )}
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleRemove(m)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                      {members.length === 0 && (
                        <li className="text-sm text-zinc-500">Empty group.</li>
                      )}
                    </ul>
                  )}

                  <div className="flex gap-2">
                    <input
                      value={search}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Find entry to add (search headword or meaning)"
                      className="flex-1 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    />
                    {searching && <span className="text-xs text-zinc-400">…</span>}
                  </div>
                  {results.length > 0 && (
                    <ul className="mt-2 max-h-48 space-y-1 overflow-auto rounded border border-zinc-100 p-2 dark:border-zinc-800">
                      {results
                        .filter((r) => !members.some((m) => m.id === r.id))
                        .map((r) => (
                          <li key={r.id}>
                            <button
                              type="button"
                              onClick={() => handleAdd(r)}
                              className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                            >
                              <span>
                                <span lang="ne">{r.headword_devanagari}</span>
                                {r.headword_roman && (
                                  <span className="ml-2 text-xs text-zinc-400">
                                    {r.headword_roman}
                                  </span>
                                )}
                              </span>
                              <span className="text-xs text-zinc-400">
                                + Add
                              </span>
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}