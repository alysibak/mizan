import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

/** Shared frame for the privacy policy and terms. */
export default function LegalPage({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 pb-20 pt-8">
        <p className="label text-brassDeep">{eyebrow}</p>
        <h1 className="mt-2 font-serif text-4xl text-ink">{title}</h1>
        <p className="mt-2 text-xs text-sage">Last updated {updated}</p>
        <div className="legal mt-8 space-y-8 text-sm leading-relaxed text-sage">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-xl text-ink">{title}</h2>
      {children}
    </section>
  );
}
