import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseResponse } from "hono/client";

type Result = "open" | "profit" | "loss" | "breakeven";

export function useTradeEntries(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.tradeEntries(sessionId),
    queryFn: async () => {
      const { tradeEntries } = await parseResponse(
        api.sessions[":sessionId"]["trade-entries"].$get({ param: { sessionId } }),
      );
      return tradeEntries;
    },
    enabled: !!sessionId,
  });
}

export function useCreateTradeEntry(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { tradeEntry } = await parseResponse(
        api.sessions[":sessionId"]["trade-entries"].$post({
          param: { sessionId },
          json: {},
        }),
      );
      return tradeEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tradeEntries(sessionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    },
  });
}

export function useUpdateTradeEntry(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; result: Result; r: string; entryAt: string | null }) => {
      const { tradeEntry } = await parseResponse(
        api["trade-entries"][":id"].$patch({
          param: { id: input.id },
          json: { result: input.result, r: input.r, entryAt: input.entryAt },
        }),
      );
      return tradeEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tradeEntries(sessionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
}

export function useDeleteTradeEntry(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await parseResponse(api["trade-entries"][":id"].$delete({ param: { id } }));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tradeEntries(sessionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    },
  });
}
