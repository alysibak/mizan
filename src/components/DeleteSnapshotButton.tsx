"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteSnapshotButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!window.confirm("Delete this frozen year?")) return;
    setBusy(true);
    await fetch(`/api/snapshots/${id}`, { method: "DELETE" });
    setBusy(false);
    router.push("/year");
    router.refresh();
  }

  return (
    <button
      type="button"
      className="btn-danger"
      onClick={remove}
      disabled={busy}
    >
      Delete
    </button>
  );
}
