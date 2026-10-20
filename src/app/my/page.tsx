import MyZakatHub from "@/components/public/MyZakat";
import ToolPage, { toolMetadata, type ToolPageCopy } from "@/components/public/ToolPage";

const copy: ToolPageCopy = {
  path: "/my",
  metaTitle: "My zakat: your zakat year in one place",
  metaDescription:
    "Your zakat day with a reminder every year, this year's zakat, what you have given and what is left, past years, interest to give away, and a record of every year. Free, private, kept on your phone.",
  appName: "Mizan My zakat",
  eyebrow: "My zakat",
  title: "Your zakat year, in one place",
  lede: "When it is due, how much, what you have given, and what to do next. Kept on this phone only.",
  sections: [],
  faq: [
    {
      q: "Where is this kept?",
      a: "Only in this browser, on this phone. Nothing is sent to Mizan. Save a copy now and then, or open a free account to keep it on every device.",
    },
    {
      q: "How do I move it to a new phone?",
      a: "Tap Save a copy, send the file to your new phone (by WhatsApp or email to yourself), then open My zakat there and tap Restore a copy.",
    },
    {
      q: "Why choose a zakat day?",
      a: "Zakat is due once a full Islamic year has passed over your savings. Keeping one day each year, such as 1 Ramadan, makes sure a year never goes by without it.",
    },
  ],
};

export const metadata = toolMetadata(copy);

export default function MyZakatPage() {
  return (
    <ToolPage copy={copy}>
      <MyZakatHub />
    </ToolPage>
  );
}
