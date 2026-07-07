import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { parseResponse } from "hono/client";

export function useExtractBehaviorInsights() {
  return useMutation({
    mutationFn: async () => parseResponse(api["behavior-insights"].extract.$post()),
  });
}
