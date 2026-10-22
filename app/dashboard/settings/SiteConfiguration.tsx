"use client";

import { useCallback, useEffect, useState } from "react";
import { parseSiteSettings, type SiteSettings } from "@/lib/site-settings";

export function SiteConfiguration() {
  const [site, setSite] = useState<SiteSettings | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch("/api/site-settings", {
      cache: "no-store",
      signal: signal ?? AbortSignal.timeout(15_000),
    });
    if (!response.ok)
      throw new Error("Could not load site settings. Check owner access and storage, then reload.");
    const result = parseSiteSettings((await response.json()).site);
    if (!signal?.aborted) {
      setSite(result);
      setName(result?.name ?? "");
      setUrl(result?.url ?? "");
      setReady(true);
    }
    return result;
  }, []);

  async function reload() {
    setBusy(true);
    setReady(false);
    setError("");
    setMessage("");
    setSite(null);
    try {
      await load();
    } catch {
      setError("Could not load site settings. Check owner access and storage, then reload.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    let active = true;
    void load(controller.signal)
      .catch(() => {
        if (active)
          setError("Could not load site settings. Check owner access and storage, then reload.");
      })
      .finally(() => {
        clearTimeout(timeout);
        if (active) setBusy(false);
      });
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [load]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url }),
        signal: AbortSignal.timeout(15_000),
      });
      const body = await response.json();
      if (response.status === 400) {
        setError(typeof body.error === "string" ? body.error : "Check the site name and URL.");
        return;
      }
      if (!response.ok)
        throw new Error("Save could not be confirmed. Reload settings before retrying.");
      const saved = parseSiteSettings(body.site);
      if (!saved) throw new Error("Missing save confirmation. Reload settings before retrying.");
      const confirmed = await load();
      if (confirmed?.revision !== saved.revision)
        throw new Error(
          "Settings changed during confirmation. Reload to see the latest saved values.",
        );
      setMessage("Site settings saved and reloaded from storage.");
    } catch (cause) {
      setReady(false);
      setSite(null);
      setError(
        cause instanceof Error
          ? cause.message
          : "Save could not be confirmed. Reload before retrying.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="site-title" className="pb-8">
      <h2
        id="site-title"
        className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#E63946]"
      >
        Site configuration
      </h2>
      <p className="mb-4 text-sm text-[#6B6560]">
        Name the single website tracked by this deployment. Saving its URL does not install the
        collector, verify ownership, or move existing traffic to another website.
      </p>
      {busy && (
        <p role="status" className="mb-3 text-sm">
          Loading or saving site settings…
        </p>
      )}
      {error && (
        <p role="alert" className="mb-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mb-3 text-sm text-green-800">
          {message}
        </p>
      )}
      <form onSubmit={save} className="space-y-4" aria-busy={busy}>
        <div>
          <label htmlFor="site-name" className="mb-1 block text-sm font-medium">
            Site name
          </label>
          <input
            id="site-name"
            required
            maxLength={100}
            value={name}
            disabled={busy || !ready}
            onChange={(event) => {
              setName(event.target.value);
              setMessage("");
            }}
            placeholder="My website"
            className="w-full border border-[#E0DDD8] px-4 py-2 text-sm disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="site-url" className="mb-1 block text-sm font-medium">
            Site URL (origin only)
          </label>
          <input
            id="site-url"
            type="url"
            required
            maxLength={2048}
            value={url}
            disabled={busy || !ready}
            onChange={(event) => {
              setUrl(event.target.value);
              setMessage("");
            }}
            placeholder="https://example.com"
            className="w-full border border-[#E0DDD8] px-4 py-2 text-sm disabled:opacity-50"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            disabled={busy || !ready}
            className="bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Save site settings
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void reload()}
            className="border border-black px-4 py-2 text-sm disabled:opacity-50"
          >
            Reload settings
          </button>
        </div>
      </form>
      {ready && !site && (
        <p className="mt-3 text-sm text-[#6B6560]">
          No site details saved yet. Existing collection and policies are unchanged.
        </p>
      )}
      {site && <p className="mt-3 text-xs text-[#6B6560]">Last saved: {site.updatedAt} (UTC).</p>}
    </section>
  );
}
