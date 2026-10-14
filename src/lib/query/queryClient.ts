import { QueryClient, QueryCache, MutationCache, isServer } from '@tanstack/react-query';
import { getErrorMessage, translate, type MessageKey } from './errors';
import { notify, getNotifierLocale } from './notify';

/**
 * Typed `meta` for every query and mutation.
 *
 * Mutations:
 *   meta: { successMessage: 'notifications.postCreated' }   -> global success toast
 *   meta: { errorMessage: 'errors.duplicate' }              -> override error text
 *   meta: { silent: true }                                  -> no global error toast
 *                                                              (component shows mutation.error inline)
 */
declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      successMessage?: MessageKey;
      errorMessage?: MessageKey;
      silent?: boolean;
    };
    queryMeta: {
      errorMessage?: MessageKey;
      silent?: boolean;
    };
  }
}

export function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (query.meta?.silent) return;
        // First-load errors are rendered inline by the component (isError).
        // Only toast when a background refetch fails while data is already shown.
        if (query.state.data !== undefined) {
          notify('error', getErrorMessage(error, getNotifierLocale(), query.meta?.errorMessage));
        }
      },
    }),
    mutationCache: new MutationCache({
      onSuccess: (_data, _vars, _ctx, mutation) => {
        const key = mutation.meta?.successMessage;
        if (key) notify('success', translate(key, getNotifierLocale()));
      },
      onError: (error, _vars, _ctx, mutation) => {
        console.warn('[mutation error]', error);
        if (mutation.meta?.silent) return;
        notify('error', getErrorMessage(error, getNotifierLocale(), mutation.meta?.errorMessage));
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/** Server: always a new client per request. Browser: a single shared client. */
export function getQueryClient() {
  if (isServer) return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
