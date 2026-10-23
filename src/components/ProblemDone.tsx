"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/client-fetch";

/** "Done" on a reported problem, or open it again. */
export default function ProblemDone({ id, done }: { id: string; done: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex min-h-[44px] items-center text-sm text-pine underline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await sendJson("/api/problems", "PATCH", { id, status: done ? "open" : "done" });
        setBusy(false);
        if (res.ok) router.refresh();
      }}
    >
      {done ? "Open it again" : "Done"}
    </button>
  );
}
