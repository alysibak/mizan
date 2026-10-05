"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseAssetCsv, SAMPLE_CSV, type ImportRow } from "@/lib/import-csv";
import { CATEGORY_LIST, type CategoryKey } from "@/lib/categories";
import { categoryForMadhhab, type Madhhab } from "@/lib/madhhab";
import { formatMoney, formatPercent } from "@/lib/money";
import { sendJson } from "@/lib/client-fetch";

export default function AssetImport({
  currency,
  madhhab = "general",
}: {
  currency: string;
  madhhab?: Madhhab;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ImportRow[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function runParse(raw: string) {
    setMessage(null);
    const result = parseAssetCsv(
      raw,
      (category) => categoryForMadhhab(category, madhhab).defaultZakatablePortion,
    );
    setErrors(result.errors);
    setPreview(result.rows.length ? result.rows : null);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const raw = await file.text();
    setText(raw);
    runParse(raw);
  }

  function updateRow(index: number, category: CategoryKey) {
    setPreview((rows) =>
      rows
        ? rows.map((row, i) =>
            i === index
              ? {
                  ...row,
                  category,
                  zakatablePortion: categoryForMadhhab(category, madhhab)
                    .defaultZakatablePortion,
                }
              : row,
          )
        : rows,
    );
  }

  async function importRows() {
    if (!preview?.length) return;
    setBusy(true);
    setMessage(null);
    const res = await sendJson<{ count?: number }>(
      "/api/assets/import",
      "POST",
      { rows: preview },
      "Could not import",
    );
    setBusy(false);
    if (!res.ok) {
      setErrors([res.error]);
      return;
    }
    setMessage(`Imported ${res.data.count ?? preview.length} holdings.`);
    setPreview(null);
    setText("");
    router.refresh();
  }

  return (
    <details className="card group p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <span className="font-serif text-lg text-ink">Import many at once from a CSV</span>
        <span className="text-sage transition group-open:rotate-45" aria-hidden>
          +
        </span>
      </summary>
      <p className="mt-3 text-sm text-sage">
        Paste or upload a CSV. Headers optional. Two columns work as description
        and amount; Mizan will guess the category.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="btn-ghost cursor-pointer">
          Choose file
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            className="sr-only"
            onChange={onFile}
          />
        </label>
        <button
          type="button"
          className="text-sm text-pine hover:underline"
          onClick={() => {
            setText(SAMPLE_CSV);
            runParse(SAMPLE_CSV);
          }}
        >
          Load sample
        </button>
      </div>

      <textarea
        aria-label="CSV to import"
        className="field mt-4 min-h-[8rem] font-mono text-xs"
        placeholder={"chequing,9500\nTFSA brokerage,12000"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => text.trim() && runParse(text)}
      />
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => runParse(text)}
          disabled={!text.trim()}
        >
          Preview
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={importRows}
          disabled={busy || !preview?.length}
        >
          {busy ? "Importing…" : `Import ${preview?.length ?? 0}`}
        </button>
      </div>

      {errors.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-danger">
          {errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      )}
      {message && <p className="mt-3 text-sm text-gain">{message}</p>}

      {preview && preview.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-sage">
              <tr>
                <th className="py-2 font-medium">Description</th>
                <th className="py-2 font-medium">Category</th>
                <th className="py-2 font-medium">Amount</th>
                <th className="py-2 font-medium">Counted</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={`${row.label}-${i}`} className="border-t border-mist">
                  <td className="py-2 text-ink">{row.label}</td>
                  <td className="py-2">
                    <select
                      aria-label={`Category for ${row.label}`}
                      className="field py-1 text-sm"
                      value={row.category}
                      onChange={(e) =>
                        updateRow(i, e.target.value as CategoryKey)
                      }
                    >
                      {CATEGORY_LIST.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 nums">{formatMoney(row.amount, currency)}</td>
                  <td className="py-2 nums text-sage">
                    {formatPercent(row.zakatablePortion, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </details>
  );
}
