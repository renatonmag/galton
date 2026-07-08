import { useIsMutating } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";

export function useRefreshOnFocus(refetch: () => void) {
  const isFirstFocus = useRef(true);
  const isMutating = useIsMutating();

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      if (isMutating > 0) return; // don't race an in-flight optimistic mutation
      refetch();
    }, [refetch, isMutating]),
  );
}
