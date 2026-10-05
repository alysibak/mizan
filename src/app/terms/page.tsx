import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { LegalSection } from "@/components/LegalPage";
import { LEGAL_UPDATED, contactEmail, operatorName } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms for using Mizan: an estimation aid, free to use, with no warranty.",
  alternates: { canonical: "/terms" },
};

// Read at request time, so a self-hosted image picks up its own APP_URL,
// OPERATOR_NAME, and CONTACT_EMAIL without a rebuild.
export const dynamic = "force-dynamic";

export default function TermsPage() {
  const email = contactEmail();
  return (
    <LegalPage eyebrow="Terms" title="Terms of use" updated={LEGAL_UPDATED}>
      <p className="text-base text-ink">
        Plainly: Mizan helps you do arithmetic about zakat. It is not a
        religious ruling, financial advice, or a payment service, and the
        figures are only as sound as what you enter.
      </p>

      <LegalSection title="Who these terms are with">
        <p>
          These terms are between you and {operatorName()}, who runs this
          service. Using Mizan, including the calculator, means you accept them.
        </p>
      </LegalSection>

      <LegalSection title="An estimate, not a ruling">
        <p>
          Mizan applies mainstream positions and shows where scholars differ,
          but it does not issue fatwas and cannot know your full circumstances.
          Treat every figure as an estimate to help you plan, check it, and ask a
          qualified person of knowledge about anything consequential. You are
          responsible for what you pay, to whom, and when.{" "}
          <Link href="/trust" className="text-pine hover:underline">
            What is verified
          </Link>{" "}
          sets out what the code checks and what it does not.
        </p>
        <p>
          Metal prices and exchange rates suggested by Mizan come from free
          public sources and may be late or wrong. Confirm them before relying
          on them.
        </p>
      </LegalSection>

      <LegalSection title="Your account">
        <ul className="list-disc space-y-1 pl-5">
          <li>Give a real email address, keep your password private, and save your recovery code.</li>
          <li>
            Without a recovery code or a confirmed email address, a lost password may mean a lost
            account.
          </li>
          <li>One person per account. You may close your account at any time from Settings.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Fair use">
        <p>
          Do not try to reach other people’s data, disrupt the service, probe
          it for weaknesses without permission, automate sign-ups, or use it
          for anything unlawful. Accounts that do may be suspended or removed.
          Reasonable limits apply to how many records one account can keep.
        </p>
      </LegalSection>

      <LegalSection title="Your data">
        <p>
          What you enter remains yours. You let the operator store and process
          it only to run the service for you, as described in the{" "}
          <Link href="/privacy" className="text-pine hover:underline">
            privacy policy
          </Link>
          . Keep your own backups: Settings lets you download everything.
        </p>
      </LegalSection>

      <LegalSection title="No warranty">
        <p>
          Mizan is free and provided “as is”, without warranties of any kind,
          including accuracy, fitness for a purpose, or uninterrupted
          availability. To the fullest extent the law allows, the operator is
          not liable for indirect or consequential loss, or for any sum paid or
          not paid on the strength of a figure Mizan showed. Nothing here limits
          liability that cannot lawfully be limited.
        </p>
      </LegalSection>

      <LegalSection title="The software">
        <p>
          These terms cover this hosted service. They do not grant or limit
          any rights in the Mizan source code itself.
        </p>
      </LegalSection>

      <LegalSection title="Changes and contact">
        <p>
          These terms may be updated; the date above shows when. Continuing to
          use Mizan after a change means accepting it.
          {email ? (
            <>
              {" "}
              Questions:{" "}
              <a className="text-pine hover:underline" href={`mailto:${email}`}>
                {email}
              </a>
              .
            </>
          ) : null}
        </p>
      </LegalSection>
    </LegalPage>
  );
}
