import Link from "next/link";
import MirathTool from "@/components/MirathTool";
import ToolPage, {
  toolMetadata,
  type ToolPageCopy,
} from "@/components/public/ToolPage";

const copy: ToolPageCopy = {
  path: "/inheritance",
  metaTitle: "Islamic inheritance calculator (mirath, faraid)",
  metaDescription:
    "Free Islamic inheritance calculator. Name who survives and see each heir’s Quranic share in exact fractions, with awl, radd, and blocking explained. No account needed.",
  appName: "Mizan inheritance calculator",
  eyebrow: "Mirath · faraid",
  title: "Islamic inheritance calculator",
  lede: "Name who survives and see each heir’s share of the estate in exact fractions, with the reason for it. Sunni rules, in your browser, with nothing sent anywhere.",
  sections: [
    {
      heading: "Before the estate is divided",
      body: (
        <>
          <p>
            The shares below apply to what remains after three things, in this
            order: the costs of the funeral and burial, then every debt the
            person owed (a spouse’s unpaid mahr among them; most schools count
            unpaid zakat too), then any bequest (wasiyya). A bequest may not
            exceed one third of what is left, and may not go to someone who
            already inherits unless the other heirs agree.
          </p>
          <p>
            Enter the net estate after those, or leave it and read the
            fractions.
          </p>
        </>
      ),
    },
    {
      heading: "How the shares are found",
      body: (
        <>
          <p>
            The Quran fixes shares for spouses, parents, daughters, and sisters
            (Surat an-Nisa, 4:11, 4:12 and 4:176). Those are the <em>fard</em>{" "}
            heirs. Whatever they leave goes to the residuary heirs (
            <em>‘asaba</em>), led by the nearest male-line relative; where a son
            and daughter inherit together, he takes twice her portion.
          </p>
          <p>
            Closer heirs exclude more distant ones: a son excludes grandsons and
            siblings, a father excludes brothers. When the fixed shares add up
            to more than the whole, each is reduced in proportion (<em>‘awl</em>
            ). When they add up to less and nobody takes the residue, the
            surplus returns to the sharers other than a spouse (<em>radd</em>).
          </p>
        </>
      ),
    },
    {
      heading: "What this calculator does not decide",
      body: (
        <>
          <p>
            It follows the Sunni schools. Where they differ, it says so beside
            the result: a grandfather alongside brothers and sisters follows the
            Hanafi position, and the shared case (<em>al-mushtaraka</em>)
            follows the Hanafi and Hanbali ruling. It does not model nephews,
            uncles, cousins, or more distant relatives, nor an unborn child, a
            missing person, or heirs who died together.
          </p>
          <p>
            The law where the estate is administered may differ from all of
            these. For a real estate, take the result to a scholar or lawyer you
            trust. The engine’s rules are tested in the open; see{" "}
            <Link href="/trust" className="text-pine hover:underline">
              what is verified
            </Link>
            .
          </p>
        </>
      ),
    },
  ],
  faq: [
    {
      q: "Why does a son receive twice a daughter’s share?",
      a: "When sons and daughters inherit together, the Quran gives each son the portion of two daughters (4:11). Classical scholars tie this to the financial duties a man carries: mahr, and providing for his wife, children, and often his parents. A daughter’s share is hers alone.",
    },
    {
      q: "What happens to the remainder if there is no residuary heir?",
      a: "It returns to the fixed-share heirs in proportion to their shares (radd), except the husband or wife, by the majority view. If only a spouse survives, this calculator shows the remainder passing to the public treasury, as the classical texts have it; many scholars today return it to the spouse instead.",
    },
    {
      q: "Can I leave money to someone who is not an heir?",
      a: "Yes, by bequest (wasiyya), up to one third of the estate after funeral costs and debts. A bequest to an heir needs the consent of the other heirs. Write it into a will that is valid where you live.",
    },
    {
      q: "Is this valid in my country?",
      a: "This shows the shares under Sunni fiqh. Whether a court follows them depends on where the estate is administered and on the will. In many countries an Islamic will is needed for these shares to apply.",
    },
    {
      q: "Is anything I enter stored?",
      a: "No. The calculation runs in your browser and nothing is sent to a server.",
    },
  ],
};

export const metadata = toolMetadata(copy);

export default function InheritancePage() {
  return (
    <ToolPage copy={copy}>
      <MirathTool />
    </ToolPage>
  );
}
