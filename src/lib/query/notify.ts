import type { Locale } from '@/types/database';

export type NotificationType = 'error' | 'success' | 'warning' | 'info';

type Notifier = (type: NotificationType, message: string) => void;

/**
 * Bridge between the (module-level) QueryClient cache handlers and the
 * React notification state. AppProvider registers the notifier and the
 * current locale on mount; the QueryCache/MutationCache handlers call
 * `notify()` without needing React context.
 */
let notifier: Notifier | null = null;
let currentLocale: Locale = 'en';

export function registerNotifier(fn: Notifier | null) {
  notifier = fn;
}

export function setNotifierLocale(locale: Locale) {
  currentLocale = locale;
}

export function getNotifierLocale(): Locale {
  return currentLocale;
}

export function notify(type: NotificationType, message: string) {
  if (notifier) {
    notifier(type, message);
  } else if (type === 'error') {
    console.error(message);
  }
}
