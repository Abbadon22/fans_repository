/** Доступное обновление лаунчера (Tauri updater). */
export interface AppUpdateInfo {
  version: string;
  currentVersion: string;
}

export type UpdateNotificationKind =
  | "launcher"
  | "mods_install"
  | "mods_issues"
  | "manifest";

export type UpdateNotificationAction =
  | "install_launcher"
  | "install_mods"
  | "go_mods"
  | "refresh_manifest"
  | "dismiss";

export interface UpdateNotification {
  id: string;
  kind: UpdateNotificationKind;
  title: string;
  message: string;
  primaryLabel: string;
  primaryAction: Exclude<UpdateNotificationAction, "dismiss">;
  dismissible?: boolean;
}
