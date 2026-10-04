import Link from "next/link";
import { ASNAF } from "@/lib/asnaf";

export default function AsnafPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="label text-brassDeep">Zakat recipients</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">The eight asnaf</h1>
        <p className="mt-2 max-w-xl text-sm text-sage">
          Categories mentioned in the Qur’an for zakat. Mizan stores which one
          you tagged a payment with — it does not certify that a person or
          organization qualifies. Ask who you trust for that.
        </p>
      </header>

      <ol className="divide-y divide-mist border-y border-mist">
        {ASNAF.map((a, i) => (
          <li key={a.key} className="py-5">
            <p className="text-xs text-sage">{i + 1}</p>
            <p className="mt-1 font-serif text-xl text-ink">{a.label}</p>
            <p className="mt-1 text-sm text-sage">{a.note}</p>
          </li>
        ))}
      </ol>

      <p className="text-sm text-sage">
        When you record zakat on{" "}
        <Link href="/giving?type=zakat" className="text-pine hover:underline">
          Give
        </Link>
        , you can optionally tag one of these categories.
      </p>
    </div>
  );
}
