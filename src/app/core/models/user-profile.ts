/** Frecuencia con la que el usuario quiere recibir avisos */
export type NotifyFreq = 'instant' | 'daily' | 'weekly';

/** Preferencias guardadas en `users/{uid}.prefs` */
export interface UserPrefs {
  emailNotifications: boolean;
  notifyOnReplies: boolean;
  notifyOnMentions: boolean;
  frequency: NotifyFreq;
  updatedAt?: any;
}
