import { useCallback, useState } from "react";
import {
  dismissNotificationId,
  loadDismissedIds,
} from "../utils/updateNotifications";

export function useDismissedNotifications() {
  const [dismissedIds, setDismissedIds] = useState(() => loadDismissedIds());

  const dismiss = useCallback((id: string) => {
    setDismissedIds(dismissNotificationId(id));
  }, []);

  const resetDismissed = useCallback(() => {
    setDismissedIds(loadDismissedIds());
  }, []);

  return { dismissedIds, dismiss, resetDismissed };
}
