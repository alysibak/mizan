import DebtsHelper from "@/components/public/DebtsHelper";
import EvidenceFor from "@/components/public/Evidence";
import ToolPage, { toolMetadata, type ToolPageCopy } from "@/components/public/ToolPage";
import { messagesFor } from "@/i18n/messages";

const copy: ToolPageCopy = {
  path: "/debts",
  metaTitle: "Who owes you? Who do you owe? Write it down in seconds",
  metaDescription:
    "A private note of money lent and borrowed, as the Quran asks (2:282). Two taps and an amount, a note to send the other person, a reminder on the pay-back day. Free, no sign-up, it stays on your phone.",
  appName: "Mizan money lent and borrowed",
  eyebrow: "Money lent and borrowed",
  title: "Who owes you? Who do you owe?",
  lede: "Write it down in ten seconds, so no one forgets. It stays on your phone.",
  sections: [
    {
      heading: "Why write it down?",
      body: (
        <>
          <p>
            The longest verse in the Quran is about this: when you lend or borrow, write it down, small or large, so
            no one forgets and no one argues later. Families fall out over money that was never written down.
          </p>
          <EvidenceFor caseKey="write-debts" />
        </>
      ),
    },
    {
      heading: "If they cannot pay you back",
      body: (
        <>
          <p>
            Give them more time, and if you can, let it go. Forgiving a debt for someone in hardship is counted as
            charity, and it is better for you. Tap “Forgive it” and it stops counting as money owed to you.
          </p>
          <EvidenceFor caseKey="forgive-debt" />
        </>
      ),
    },
  ],
  next: [
    { href: "/guide", label: "Work out my zakat", icon: "guide" },
    { href: "/my", label: "My zakat: my year in one place", icon: "my" },
  ],
  faq: [
    {
      q: "Who can see my notes?",
      a: "Only you. They stay on this phone and are never sent to Mizan. The other person sees a note only if you send it.",
    },
  ],
};

export const metadata = toolMetadata(copy);

export default function DebtsPage() {
  return (
    <ToolPage copy={copy}>
      <DebtsHelper share={messagesFor("en").common.share} />
    </ToolPage>
  );
}
