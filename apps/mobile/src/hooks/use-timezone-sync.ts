import { useUpdateUserPreferences, useUserPreferences } from "@/hooks/queries/use-user-preferences";
import { useEffect } from "react";

export function useTimezoneSync() {
  const { data: preferences } = useUserPreferences();
  const updatePreferences = useUpdateUserPreferences();

  useEffect(() => {
    if (preferences === undefined) return;
    const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (preferences?.timezone === deviceTimezone) return;
    updatePreferences.mutate({ timezone: deviceTimezone });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences]);
}
