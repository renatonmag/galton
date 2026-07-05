import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-client";
import { useQuery } from "@tanstack/react-query";
import { parseResponse } from "hono/client";

export function useDailyReportsList() {
  return useQuery({
    queryKey: queryKeys.dailyReports,
    queryFn: async () => {
      const { reportDates } = await parseResponse(api.reports.$get());
      return reportDates;
    },
  });
}

export function useDailyReport(date: string) {
  return useQuery({
    queryKey: queryKeys.dailyReport(date),
    queryFn: async () => {
      const { report } = await parseResponse(api.reports[":date"].$get({ param: { date } }));
      return report;
    },
  });
}
