import { api, uploadTradeEntryComment, type Stats, type TradeEntry } from "@/lib/api";
import { type Direction, type Result } from "@/lib/decision";
import { queryKeys } from "@/lib/query-client";
import { decisionFromRatio, ratioFromCounts } from "@galton/api/lib/successRatio";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseResponse } from "hono/client";

let tempIdSeq = 0;

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
    onMutate: async () => {
      const key = queryKeys.tradeEntries(sessionId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TradeEntry[]>(key);
      // Mirrors the server's scope: computeDecision on the API is computed over
      // all of the user's closed entries across every session, not just this one.
      const stats = queryClient.getQueryData<Stats>(queryKeys.stats);
      const ratio = stats
        ? ratioFromCounts({ profit: stats.profit, loss: stats.loss, breakeven: stats.breakeven })
        : null;
      const decision = decisionFromRatio(ratio);
      const optimisticEntry: TradeEntry = {
        id: `temp-${Date.now()}-${tempIdSeq++}`,
        sessionId,
        decision,
        result: "open",
        direction: null,
        r: "",
        successRatio: ratio === null ? "0.0000" : ratio.toFixed(4),
        entryAt: null,
        comment: null,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<TradeEntry[]>(key, (old) =>
        old ? [...old, optimisticEntry] : [optimisticEntry],
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(queryKeys.tradeEntries(sessionId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tradeEntries(sessionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    },
  });
}

export function useUpdateTradeEntry(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      result: Result;
      direction?: Direction | null;
      r: string;
      entryAt: string | null;
      comment?: string | null;
    }) => {
      const { tradeEntry } = await parseResponse(
        api["trade-entries"][":id"].$patch({
          param: { id: input.id },
          json: {
            result: input.result,
            r: input.r,
            entryAt: input.entryAt,
            ...(input.direction !== undefined && { direction: input.direction }),
            ...(input.comment !== undefined && { comment: input.comment }),
          },
        }),
      );
      return tradeEntry;
    },
    onMutate: async (input) => {
      const key = queryKeys.tradeEntries(sessionId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TradeEntry[]>(key);
      queryClient.setQueryData<TradeEntry[]>(key, (old) =>
        old?.map((e) =>
          e.id === input.id
            ? {
                ...e,
                result: input.result,
                r: input.r,
                entryAt: input.entryAt,
                ...(input.direction !== undefined && { direction: input.direction }),
                ...(input.comment !== undefined && { comment: input.comment }),
              }
            : e,
        ),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(queryKeys.tradeEntries(sessionId), context.previous);
      }
    },
    onSettled: () => {
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
    onMutate: async (id) => {
      const key = queryKeys.tradeEntries(sessionId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TradeEntry[]>(key);
      queryClient.setQueryData<TradeEntry[]>(key, (old) => old?.filter((e) => e.id !== id));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(queryKeys.tradeEntries(sessionId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tradeEntries(sessionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    },
  });
}

export function useTranscribeTradeEntryComment(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; audioUri: string; mimeType: string }) => {
      const { tradeEntry } = await uploadTradeEntryComment(input.id, input.audioUri, input.mimeType);
      return tradeEntry;
    },
    onSuccess: (tradeEntry) => {
      const key = queryKeys.tradeEntries(sessionId);
      queryClient.setQueryData<TradeEntry[]>(key, (old) =>
        old?.map((e) => (e.id === tradeEntry.id ? { ...e, comment: tradeEntry.comment } : e)),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tradeEntries(sessionId) });
    },
  });
}
