import Link from "next/link";
import { ASNAF } from "@/lib/asnaf";

export default function AsnafPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="label text-brassDeep">Who can receive zakat</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">The eight groups</h1>
        <p className="mt-2 max-w-xl text-base text-sage">
          The Quran names eight groups who may receive zakat (9:60). Mizan
          cannot tell you whether a person or charity is one of them; ask
          someone you trust.
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
        When you note zakat on{" "}
        <Link href="/giving?type=zakat" className="text-pine hover:underline">
          Give
        </Link>
        , you can say which group it went to, if you like.
      </p>
    </div>
  );
}
