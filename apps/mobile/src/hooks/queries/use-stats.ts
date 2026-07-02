import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-client";
import { useQuery } from "@tanstack/react-query";
import { parseResponse } from "hono/client";

export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: () => parseResponse(api.stats.$get()),
  });
}
