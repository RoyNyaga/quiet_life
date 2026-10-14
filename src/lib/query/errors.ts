import { DICTIONARY } from '@/lib/i18n';
import type { Locale } from '@/types/database';

export type ErrorKey = keyof typeof DICTIONARY.en.errors;
export type NotificationKey = keyof typeof DICTIONARY.en.notifications;
export type AuthMessageKey = keyof typeof DICTIONARY.en.auth;

/** A message reference resolvable in the current locale, e.g. 'notifications.postCreated'. */
export type MessageKey =
  | `notifications.${NotificationKey}`
  | `errors.${ErrorKey}`
  | `auth.${AuthMessageKey}`;

export function translate(key: MessageKey, locale: Locale): string {
  const [section, name] = key.split('.') as [keyof typeof DICTIONARY.en, string];
  const dict = (DICTIONARY[locale] ?? DICTIONARY.en) as unknown as Record<string, Record<string, string>>;
  const fallback = DICTIONARY.en as unknown as Record<string, Record<string, string>>;
  return dict[section]?.[name] ?? fallback[section]?.[name] ?? key;
}

/** Error thrown by API functions; carries an i18n key when we can classify it. */
export class AppError extends Error {
  readonly key: ErrorKey;
  readonly code?: string;
  readonly status?: number;

  constructor(key: ErrorKey, message?: string, opts?: { code?: string; status?: number }) {
    super(message ?? key);
    this.name = 'AppError';
    this.key = key;
    this.code = opts?.code;
    this.status = opts?.status;
  }
}

interface ErrorLike {
  message?: string;
  code?: string;
  status?: number;
  name?: string;
}

/** Classify any thrown value (Supabase PostgrestError, AuthError, fetch error, Error) into an i18n key. */
export function classifyError(error: unknown): ErrorKey {
  if (error instanceof AppError) return error.key;

  const e = (error ?? {}) as ErrorLike;
  const msg = (e.message ?? '').toLowerCase();
  const code = e.code ?? '';
  const status = e.status;

  // Supabase Auth
  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) return 'invalidCredentials';
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) return 'emailNotConfirmed';
  if (code === 'user_already_exists' || msg.includes('already registered')) return 'userAlreadyExists';
  if (code === 'weak_password' || msg.includes('password should be')) return 'weakPassword';
  if (code === 'over_request_rate_limit' || status === 429 || msg.includes('rate limit')) return 'rateLimited';

  // Postgres / PostgREST
  if (code === '42501' || status === 403 || msg.includes('row-level security') || msg.includes('permission denied')) {
    return 'permissionDenied';
  }
  if (code === '23505' || msg.includes('duplicate key')) return 'duplicate';
  if (code === 'PGRST116' || status === 404) return 'notFound';
  if (status === 401 || msg.includes('jwt') || msg.includes('not authenticated')) return 'notAuthenticated';

  // Network
  if (e.name === 'TypeError' && msg.includes('fetch')) return 'network';
  if (msg.includes('failed to fetch') || msg.includes('network')) return 'network';

  return 'generic';
}

/** Resolve a user-facing, translated message for an error. */
export function getErrorMessage(error: unknown, locale: Locale, override?: MessageKey): string {
  if (override) return translate(override, locale);
  return translate(`errors.${classifyError(error)}`, locale);
}

/**
 * Throw if a Supabase response contains an error. Use in every api.ts function:
 *   const { data, error } = await supabase.from('x').select();
 *   throwIfError(error);
 */
export function throwIfError(error: unknown): void {
  if (error) throw error;
}

/** Parse a fetch() Response from our /api routes; throws on non-2xx. */
export async function parseApiResponse<T>(res: Response): Promise<T> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // empty body
  }
  if (!res.ok) {
    const message = (body as { error?: string } | null)?.error ?? res.statusText;
    const err = { message, status: res.status } as ErrorLike;
    throw new AppError(classifyError(err), message, { status: res.status });
  }
  return body as T;
}
