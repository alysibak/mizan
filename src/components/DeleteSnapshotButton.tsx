"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendJson } from "@/lib/client-fetch";

export default function DeleteSnapshotButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!window.confirm("Delete this frozen year?")) return;
    setBusy(true);
    setError(null);
    const res = await sendJson(`/api/snapshots/${id}`, "DELETE", undefined, "Could not delete this freeze");
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push("/year");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className="btn-danger"
        onClick={remove}
        disabled={busy}
      >
        {busy ? "Deleting…" : "Delete"}
      </button>
      {error && (
        <p className="basis-full text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
