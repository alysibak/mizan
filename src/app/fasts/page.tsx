import Link from "next/link";
import FastsHelper from "@/components/public/FastsHelper";
import EvidenceFor from "@/components/public/Evidence";
import ToolPage, { toolMetadata, type ToolPageCopy } from "@/components/public/ToolPage";

const copy: ToolPageCopy = {
  path: "/fasts",
  metaTitle: "Missed fasts: making them up, fidya and kaffarah",
  metaDescription:
    "Missed Ramadan fasts? See what to do for your reason: make them up, pay fidya if you never can, or kaffarah for a fast broken on purpose. Count what is left, work out the amount, and get a reminder.",
  appName: "Mizan missed fasts helper",
  eyebrow: "Fasting",
  title: "Fasts I missed",
  lede: "Whatever the reason, it can be put right. Tap why you missed them, count what is left, and tick them off as you go.",
  sections: [
    {
      heading: "When to make them up",
      body: (
        <p>
          Any day outside Ramadan and the two Eids, one day for each day missed. They do not have to be in a row.
          Try to finish before the next Ramadan; ‘A’ishah would make hers up in Sha‘ban. Mondays and Thursdays are
          good days: the Prophet ﷺ liked to fast them.
        </p>
      ),
    },
    {
      heading: "Years of missed fasts?",
      body: (
        <p>
          Count your best estimate and start, a few each week. Allah does not ask more of a soul than it can bear.
          If you also left zakat for years, the{" "}
          <Link href="/missed-years" className="text-pine hover:underline">
            catch-up page
          </Link>{" "}
          works out what is owed.
        </p>
      ),
    },
  ],
  next: [
    { href: "/ramadan", label: "Get ready for Ramadan", icon: "ramadan" },
    { href: "/my", label: "Keep track in My zakat", icon: "my" },
  ],
  faq: [
    {
      q: "I delayed making them up until the next Ramadan came. What now?",
      a: "Make them up after this Ramadan. Most scholars (the Maliki, Shafi‘i and Hanbali schools) add a fidya for each day if the delay had no good reason; the Hanafi school asks only that you make them up.",
    },
    {
      q: "Can I pay fidya instead of making up fasts because fasting is hard for me?",
      a: "No. Fidya is only for someone who cannot fast now and is not expected to be able to, such as the very old or someone with a lasting illness. If you may be able to fast later, make the days up then.",
    },
    {
      q: "Who receives fidya and kaffarah?",
      a: "Poor and needy people, as food or its value. Many mosques and charities collect fidya in Ramadan and turn it into meals.",
    },
    {
      q: "I ate by mistake, having forgotten I was fasting.",
      a: "Your fast is still sound: carry on fasting. The Prophet ﷺ said, “Whoever forgets while fasting and eats or drinks, let him complete his fast, for it was Allah who fed him and gave him drink” (Bukhari and Muslim).",
    },
  ],
};

export const metadata = toolMetadata(copy);

export default function FastsPage() {
  return (
    <ToolPage copy={copy}>
      <div className="space-y-8">
        <FastsHelper />
        <div className="space-y-6">
          <h2 className="font-serif text-xl text-ink">Why</h2>
          <div>
            <h3 className="eyebrow">Making them up</h3>
            <EvidenceFor caseKey="fasts-make-up" />
          </div>
          <div>
            <h3 className="eyebrow">Fidya</h3>
            <EvidenceFor caseKey="fidya" />
          </div>
          <div>
            <h3 className="eyebrow">Kaffarah</h3>
            <EvidenceFor caseKey="kaffarah" />
          </div>
          <div>
            <h3 className="eyebrow">Broken oaths</h3>
            <EvidenceFor caseKey="oath" />
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
