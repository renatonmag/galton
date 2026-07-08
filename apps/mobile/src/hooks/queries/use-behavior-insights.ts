import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseResponse } from "hono/client";

export function usePendingBehaviorInsightsCount() {
  return useQuery({
    queryKey: queryKeys.behaviorInsightsPendingCount,
    queryFn: async () => {
      const { pendingCount } = await parseResponse(api["behavior-insights"]["pending-count"].$get());
      return pendingCount;
    },
  });
}

export function useReinforceBehaviorInsights() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => parseResponse(api["behavior-insights"].extract.$post()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.behaviorInsightsPendingCount });
    },
  });
}
