import CalculatorView, { calculatorMetadata } from "@/components/public/CalculatorView";

export const metadata = calculatorMetadata("en");

export default function CalculatorPage() {
  return <CalculatorView locale="en" />;
}
