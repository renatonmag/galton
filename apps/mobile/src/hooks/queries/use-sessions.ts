import { api, type Session } from "@/lib/api";
import { queryKeys } from "@/lib/query-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseResponse } from "hono/client";

export function useSessions() {
  return useQuery({
    queryKey: queryKeys.sessions,
    queryFn: async () => {
      const { sessions } = await parseResponse(api.sessions.$get());
      return sessions;
    },
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { session } = await parseResponse(api.sessions.$post({ json: {} }));
      return session;
    },
    onSuccess: (session) => {
      const newSession: Session = { ...session, tradeCount: 0 };
      queryClient.setQueryData<Session[]>(queryKeys.sessions, (old) =>
        old ? [newSession, ...old] : [newSession],
      );
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await parseResponse(api.sessions[":id"].$delete({ param: { id } }));
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<Session[]>(queryKeys.sessions, (old) =>
        old?.filter((s) => s.id !== id),
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
}
