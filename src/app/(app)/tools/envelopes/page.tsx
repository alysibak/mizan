import { getCurrentUser } from "@/lib/session";
import { loadReckoning } from "@/lib/reckoning";
import { toCents } from "@/lib/money";
import EnvelopeTool from "@/components/EnvelopeTool";

export default async function EnvelopesPage() {
  const user = (await getCurrentUser())!;
  const { settings, result, outstanding, phase } = await loadReckoning(user.id);
  const defaultTotal =
    phase === "payable" && outstanding > 0
      ? outstanding
      : result.isDue
        ? toCents(result.zakatDue)
        : 0;

  return (
    <EnvelopeTool currency={settings.currency} defaultTotal={defaultTotal} />
  );
}
