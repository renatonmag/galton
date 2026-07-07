import { api, uploadVoiceNote, type VoiceNote } from "@/lib/api";
import { queryKeys } from "@/lib/query-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseResponse } from "hono/client";

export function useVoiceNotes(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.voiceNotes(sessionId),
    queryFn: async () => {
      const { voiceNotes } = await parseResponse(
        api.sessions[":sessionId"]["voice-notes"].$get({ param: { sessionId } }),
      );
      return voiceNotes;
    },
    enabled: !!sessionId,
  });
}

export function useCreateVoiceNote(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { audioUri: string; mimeType: string }) => {
      const { voiceNote } = await uploadVoiceNote(sessionId, input.audioUri, input.mimeType);
      return voiceNote;
    },
    onSuccess: (voiceNote) => {
      const key = queryKeys.voiceNotes(sessionId);
      queryClient.setQueryData<VoiceNote[]>(key, (old) => (old ? [...old, voiceNote] : [voiceNote]));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.voiceNotes(sessionId) });
    },
  });
}

export function useDeleteVoiceNote(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await parseResponse(api["voice-notes"][":id"].$delete({ param: { id } }));
      return id;
    },
    onMutate: async (id) => {
      const key = queryKeys.voiceNotes(sessionId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<VoiceNote[]>(key);
      queryClient.setQueryData<VoiceNote[]>(key, (old) => old?.filter((n) => n.id !== id));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(queryKeys.voiceNotes(sessionId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.voiceNotes(sessionId) });
    },
  });
}
