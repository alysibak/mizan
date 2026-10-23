"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/client-fetch";
import { COMMON_CURRENCIES } from "@/lib/currencies";

interface Row {
  id: string;
  name: string;
  city: string;
  slug: string;
  status: string;
  members: number;
  listed: number;
}

/** Add a partner and its lead; pause or restart one. */
export default function AdminPartners({ partners }: { partners: Row[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", city: "", currency: "CAD", leadEmail: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(method: "POST" | "PATCH", body: unknown): Promise<boolean> {
    setBusy(true);
    setError(null);
    const res = await sendJson("/api/admin/partners", method, body);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return false;
    }
    router.refresh();
    return true;
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="partners-list" className="space-y-3">
        <h2 id="partners-list" className="font-serif text-2xl text-ink">
          Partners
        </h2>
        {partners.length ? (
          <ul className="divide-y divide-mist border-y border-mist">
            {partners.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <Link href={`/neighbours/at/${p.slug}`} className="font-medium text-pine hover:underline">
                    {p.name}
                  </Link>
                  <p className="text-sm text-sage">
                    {p.city} · {p.members} {p.members === 1 ? "person" : "people"} · {p.listed} listed
                    {p.status === "paused" ? " · paused" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className={p.status === "paused" ? "btn-primary" : "btn-ghost"}
                  disabled={busy}
                  onClick={() => send("PATCH", { id: p.id, status: p.status === "paused" ? "active" : "paused" })}
                >
                  {p.status === "paused" ? "Let it go on" : "Pause it"}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-base text-sage">No partners yet.</p>
        )}
      </section>

      <form
        className="space-y-3 border-2 border-mist p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await send("POST", form)) setForm({ name: "", city: "", currency: form.currency, leadEmail: "" });
        }}
      >
        <h2 className="font-serif text-xl text-ink">Add a partner</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label mb-1.5" htmlFor="ap-name">Name</label>
            <input id="ap-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label mb-1.5" htmlFor="ap-city">City</label>
            <input id="ap-city" className="field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <label className="label mb-1.5" htmlFor="ap-currency">Currency</label>
            <select id="ap-currency" className="field" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              {COMMON_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label mb-1.5" htmlFor="ap-lead">Lead’s Mizan account email</label>
            <input
              id="ap-lead"
              type="email"
              className="field"
              value={form.leadEmail}
              onChange={(e) => setForm({ ...form, leadEmail: e.target.value })}
            />
          </div>
        </div>
        {error ? (
          <p role="alert" className="text-base text-danger">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn-primary" disabled={busy}>
          Add it
        </button>
      </form>
    </div>
  );
}
