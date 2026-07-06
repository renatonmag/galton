import { useStats } from "@/hooks/queries/use-stats";
import { pendingDecisionFromStats } from "@/lib/decision";
import { useMemo } from "react";

export function usePendingDecision() {
  const { data: stats } = useStats();
  return useMemo(() => pendingDecisionFromStats(stats), [stats]);
}
