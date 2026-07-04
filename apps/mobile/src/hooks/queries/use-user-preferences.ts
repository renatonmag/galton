import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseResponse } from "hono/client";

export function useUserPreferences() {
  return useQuery({
    queryKey: queryKeys.userPreferences,
    queryFn: async () => {
      const { userPreferences } = await parseResponse(api["user-preferences"].$get());
      return userPreferences;
    },
  });
}

export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationTime: string) => {
      const { userPreferences } = await parseResponse(
        api["user-preferences"].$put({ json: { notificationTime } }),
      );
      return userPreferences;
    },
    onSuccess: (userPreferences) => {
      queryClient.setQueryData(queryKeys.userPreferences, userPreferences);
    },
  });
}
