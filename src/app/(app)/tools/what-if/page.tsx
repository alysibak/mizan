import { getCurrentUser } from "@/lib/session";
import { loadReckoning } from "@/lib/reckoning";
import WhatIfNisabTool from "@/components/WhatIfNisabTool";

export default async function WhatIfPage() {
  const user = (await getCurrentUser())!;
  const { settings, result } = await loadReckoning(user.id);

  return (
    <WhatIfNisabTool
      currency={settings.currency}
      netZakatable={result.netZakatable}
      goldPricePerGram={settings.goldPricePerGram}
      silverPricePerGram={settings.silverPricePerGram}
      standard={result.standard}
      basis={result.basis}
    />
  );
}
