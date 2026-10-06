import Link from "next/link";
import { notFound } from "next/navigation";
import ToolPage, { toolMetadata } from "@/components/public/ToolPage";
import { GUIDES, guideBySlug } from "@/content/guides";

// Only the guides that exist; anything else 404s without rendering.
export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props) {
  const guide = guideBySlug((await params).slug);
  return guide ? toolMetadata(guide) : {};
}

export default async function GuidePage({ params }: Props) {
  const guide = guideBySlug((await params).slug);
  if (!guide) notFound();
  const others = GUIDES.filter((g) => g.slug !== guide.slug);
  return (
    <ToolPage
      copy={guide}
      after={
        <nav className="mt-16" aria-labelledby="more-guides">
          <h2 id="more-guides" className="font-serif text-2xl text-ink">
            More guides
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {others.map((g) => (
              <li key={g.slug}>
                <Link href={g.path} className="btn-ghost">
                  {g.short}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      }
    >
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <p className="max-w-md text-sm text-sage">
          Work out what you owe with today’s gold and silver prices. Free, no account,
          and nothing leaves your browser.
        </p>
        <Link href="/calculator" className="btn-primary">
          Calculate your zakat
        </Link>
      </div>
    </ToolPage>
  );
}
