import { api, type BehaviorInsight } from "@/lib/api";
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

export function useExtractBehaviorInsights() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => parseResponse(api["behavior-insights"].extract.$post()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.behaviorInsightsPendingCount });
      queryClient.invalidateQueries({ queryKey: queryKeys.behaviorInsights });
    },
  });
}

export function useBehaviorInsights() {
  return useQuery({
    queryKey: queryKeys.behaviorInsights,
    queryFn: async () => {
      const { insights } = await parseResponse(api["behavior-insights"].$get());
      return insights;
    },
  });
}

export function useCreateBehaviorInsight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { text: string; type: "do" | "dont" }) => {
      const { insight } = await parseResponse(api["behavior-insights"].$post({ json: input }));
      return insight;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.behaviorInsights });
    },
  });
}

export function useUpdateBehaviorInsight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; text?: string; type?: "do" | "dont" }) => {
      const { id, ...patch } = input;
      const { insight } = await parseResponse(
        api["behavior-insights"][":id"].$patch({ param: { id }, json: patch }),
      );
      return insight;
    },
    onSuccess: (insight) => {
      queryClient.setQueryData<BehaviorInsight[]>(queryKeys.behaviorInsights, (old) =>
        old?.map((i) => (i.id === insight.id ? insight : i)),
      );
    },
  });
}

export function useDeleteBehaviorInsight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await parseResponse(api["behavior-insights"][":id"].$delete({ param: { id } }));
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<BehaviorInsight[]>(queryKeys.behaviorInsights, (old) =>
        old?.filter((i) => i.id !== id),
      );
    },
  });
}
