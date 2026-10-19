/**
 * A visitor's own plan, from what they say they have: which pages to open,
 * in the order that keeps the sums right (interest set aside before
 * counting, this year before past years, giving last).
 */
export type Situation = "unsure" | "money" | "gold" | "shop" | "farm" | "family" | "interest" | "missed";

export interface PlanStep {
  key: string;
  href: string;
  title: string;
  why: string;
}

export function buildPlan(have: ReadonlySet<Situation>): PlanStep[] {
  const steps: PlanStep[] = [];
  if (have.has("unsure")) {
    steps.push({ key: "start", href: "/start", title: "Find out if you have to pay", why: "Three quick questions, in plain words." });
  }
  if (have.has("interest")) {
    steps.push({
      key: "interest",
      href: "/interest",
      title: "Set the bank interest aside first",
      why: "It is not yours, so it is given away and not counted.",
    });
  }
  if (have.has("shop")) {
    steps.push({
      key: "shop",
      href: "/shop",
      title: "Work out your shop with your savings",
      why: have.has("gold")
        ? "Stock, the till, and money owed to you, with your own savings. Add your gold’s value to your savings."
        : "Stock, the till, and money owed to you, with your own savings.",
    });
  } else if (have.has("family")) {
    steps.push({
      key: "family",
      href: "/family",
      title: "Work out each person’s zakat",
      why: "Everyone’s cash and gold, one person at a time: it is not added together.",
    });
  } else if (have.has("money") || have.has("gold")) {
    steps.push({
      key: "guide",
      href: "/guide",
      title: "Work out your zakat, step by step",
      why: have.has("gold")
        ? "Cash, bank, and gold at today’s price. Don’t know your gold’s weight? Tap the pieces you have."
        : "Cash and bank against today’s nisab.",
    });
  }
  if (have.has("farm")) {
    steps.push({ key: "farm", href: "/farm", title: "Your harvest and your animals", why: "These are counted on their own, not with your money." });
  }
  if (have.has("missed")) {
    steps.push({ key: "missed", href: "/missed-years", title: "Then catch up on past years", why: "What they owe, and a plan to pay it monthly." });
  }
  const owes = ["money", "gold", "shop", "farm", "family", "missed"].some((s) => have.has(s as Situation));
  if (owes) {
    steps.push({ key: "give", href: "/give", title: "Give it", why: "Who to give to first, and how to choose a charity." });
  }
  return steps;
}
