import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import MyPromises from "@/components/neighbours/MyPromises";
import { neighboursMode } from "@/lib/neighbours-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "What I promised", robots: { index: false, follow: false } };

/** The promises made on this phone, each with its code and whether it arrived. */
export default function MinePage() {
  if (neighboursMode() === "off") notFound();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl space-y-6 px-5 pb-16 pt-6 md:px-10">
        <Link href="/neighbours" className="inline-flex min-h-[44px] items-center text-base text-pine hover:underline">
          ← All needs
        </Link>
        <h1 className="font-serif text-4xl leading-tight text-ink">What I promised</h1>
        <MyPromises />
      </main>
      <SiteFooter />
    </div>
  );
}
