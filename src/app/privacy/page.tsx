import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { LegalSection } from "@/components/LegalPage";
import { LEGAL_UPDATED, contactEmail, operatorName } from "@/lib/legal";
import { analyticsConfig } from "@/lib/analytics";
import { CONTACT_KEEP_DAYS } from "@/lib/neighbours";
import { emailEnabled } from "@/lib/email";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What Mizan stores, why, and what it never does with it. No ads, no selling, no bank linking.",
  alternates: { canonical: "/privacy" },
};

// Read at request time, so a self-hosted image picks up its own APP_URL,
// OPERATOR_NAME, and CONTACT_EMAIL without a rebuild.
export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  const email = contactEmail();
  const analytics = analyticsConfig();
  const mail = emailEnabled();
  return (
    <LegalPage eyebrow="Privacy" title="Privacy policy" updated={LEGAL_UPDATED}>
      <p className="text-base text-ink">
        Mizan holds figures about your wealth and your giving. It keeps only
        what it needs to show them back to you, never sells or shares them, and
        lets you take them away or erase them at any time.
      </p>

      <LegalSection title="Who is responsible">
        <p>
          This service is run by {operatorName()}
          {email ? (
            <>
              , who can be reached at{" "}
              <a className="text-pine hover:underline" href={`mailto:${email}`}>
                {email}
              </a>
            </>
          ) : null}
          . Anyone can run the Mizan software on their own server; a copy run
          by someone else is that person’s responsibility.
        </p>
      </LegalSection>

      <LegalSection title="The calculator">
        <p>
          The <Link href="/calculator" className="text-pine hover:underline">zakat calculator</Link>{" "}
          works in your browser. What you type is kept in your browser’s own
          storage so a refresh does not lose it, and is never sent to Mizan’s
          servers. To suggest today’s metal prices, your browser sends only the
          currency you picked.
        </p>
      </LegalSection>

      <LegalSection title="What an account stores">
        <ul className="list-disc space-y-1 pl-5">
          <li>Your name and email address, to sign you in.</li>
          <li>
            Your password, only as a one-way bcrypt hash. Nobody, including the
            operator, can read it.
          </li>
          <li>
            If you sign in with Google: Google’s id for your Google account, so
            it can sign you in again. Mizan asks Google only for your name and
            email, never your contacts, files or anything else.
          </li>
          <li>
            What you enter: holdings, debts, giving records, settings, notes,
            frozen year snapshots, and letters to your future self.
          </li>
          <li>
            Your time zone, so dates match your calendar, and when you last
            signed in.
          </li>
          <li>
            A hash of your recovery code and of your calendar-feed link, if you
            make them, so they can be checked but not read.
          </li>
          <li>
            If you turn on two-step sign-in, the key shared with your
            authenticator app, which the server needs to check its codes.
          </li>
          {mail ? (
            <li>
              If you confirm your email address: when you did, whether you
              asked for hawl reminders, and which reminder was sent last.
              One-time links are stored only as hashes and deleted when used.
            </li>
          ) : null}
          <li>
            To slow down password guessing, a count of recent sign-in attempts
            per network address. The address is stored only as a one-way hash
            and the count is discarded within a day.
          </li>
        </ul>
        <p>
          Mizan does not ask for your bank logins, does not connect to your
          bank, and does not show advertising.
        </p>
      </LegalSection>

      <LegalSection title="Cookies and browser storage">
        <p>
          One cookie, <code className="font-mono text-xs">mizan_session</code>,
          keeps you signed in. It is strictly necessary, HttpOnly, and holds a
          random token whose hash is stored on the server. While you are signed
          in, a second cookie,{" "}
          <code className="font-mono text-xs">mizan_signed_in</code>, holds only
          the value 1, so the public pages can offer a link to your ledger
          instead of “Sign in”. There are no advertising or tracking cookies.
        </p>
        <p>
          Your browser’s local storage keeps what you work out without an
          account on your device only: the calculator draft; My zakat (your
          zakat day, the payments you note, and past years); the missed-years
          tally; your family, farm, bank-interest and Zakat al-Fitr figures;
          the days you ticked a good deed; the language, currency, and text
          size you picked; which setup step you reached; and notices you
          dismissed. The browser also keeps copies of the public pages you
          have opened (the beginner’s pages, the calculator, My zakat, nisab
          today and the other tools), so they open without a signal; pages
          inside your account are never kept. Clearing your browser data
          removes all of it.
        </p>
      </LegalSection>

      <LegalSection title="Moving to a new phone">
        <p>
          Only if you choose “Move to a new phone”: your browser seals a copy
          of what it keeps with a key made from the code it shows you, and
          sends Mizan only that sealed copy. Mizan cannot open it. The code
          itself never leaves your phone; the server receives a one-way hash
          of it, used only to find the copy. The copy is deleted as soon as
          your new phone collects it, or after 30 minutes, whichever comes
          first. Attempts are limited per network address, stored as a
          one-way hash.
        </p>
      </LegalSection>

      <LegalSection title="Report a problem">
        <p>
          If you report a problem, Mizan keeps what kind it is, the page you came from, your words, the page’s
          language, and an email or phone only if you choose to leave one for a reply. Requests are limited per
          network address, stored as a one-way hash.
        </p>
      </LegalSection>

      <LegalSection title="Helping a family near you (Mizan Neighbours)">
        <p>
          Where this site lists needs checked by mosques, a need never names or describes the family: mosques are
          asked not to, and text with phone numbers, emails or links is refused. When you promise to give, Mizan keeps
          the amount, the need, and a code for your payment; your name and an email only if you choose to give them,
          seen only by that mosque and deleted {CONTACT_KEEP_DAYS} days after the promise is settled. Your phone keeps
          the code and the amount, so you can see when it arrives. Mizan never receives or holds money: you pay the
          mosque directly.
        </p>
        <p>
          People who run a mosque’s desk use an ordinary Mizan account; Mizan keeps which mosque they belong to and
          what they did to each need, so the mosque can account for it. Reports about a need keep the reason and any
          words you add.
        </p>
      </LegalSection>

      <LegalSection title="“Was this easy?” and step counts">
        <p>
          If you answer “Was this easy?”, Mizan keeps your answer, any words
          you add, the page you were on, and its language. Nothing else goes
          with it: not your account, your network address, or any amount.
          Separately, Mizan counts how many people reach each step of working
          out zakat (the home page, the guide, its answer, making an account)
          as one number per step per day, with nothing about who. Both help
          make Mizan easier to use. Requests are limited per network address,
          stored as a one-way hash.
        </p>
      </LegalSection>

      {analytics ? (
        <LegalSection title="Visit counts">
          <p>
            Public pages (such as the home page and the calculator) are counted
            with Plausible, a cookieless analytics tool that records the page
            address, referrer, browser, and country, but no personal data and
            no cookies. Pages inside your account are never counted.
          </p>
        </LegalSection>
      ) : null}

      <LegalSection title="Who else handles data">
        <p>
          The service runs on hosting and database providers that store data on
          the operator’s behalf, under their own security and confidentiality
          terms. When a price or exchange-rate suggestion is requested, Mizan’s
          server asks free public sources (gold-api.com, frankfurter.app, and a
          public currency-rate feed) for today’s rates; those requests carry a
          currency code and nothing about you.
        </p>
        {mail ? (
          <p>
            Emails (a confirmation link, a password-reset link you ask for, and
            hawl reminders you turn on) are delivered by the operator’s email
            provider, which sees your address and the message. They carry a
            date and a link, never amounts or anything else from your ledger.
          </p>
        ) : (
          <p>This server sends no email.</p>
        )}
      </LegalSection>

      <LegalSection title="Your choices">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Download everything as a backup file, or your giving as a
            spreadsheet, from Settings.
          </li>
          <li>Correct or remove any entry at any time.</li>
          <li>
            Delete your account from Settings. Your account and every record in
            it are erased at once; copies in the provider’s routine backups
            expire on their normal schedule.
          </li>
        </ul>
        <p>
          Depending on where you live, you may have further rights, such as to
          object or to complain to a data protection authority.
          {email ? (
            <>
              {" "}
              Write to{" "}
              <a className="text-pine hover:underline" href={`mailto:${email}`}>
                {email}
              </a>{" "}
              about any of them.
            </>
          ) : null}
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          Connections are encrypted, passwords are hashed, sessions can be
          signed out from every device, and each account can see only its own
          records. No system is perfectly secure; keep your password and
          recovery code private.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>Mizan is not meant for children under 13, and does not knowingly hold their data.</p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          If this policy changes, the date above changes with it, and a
          significant change will be noted in the app.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
