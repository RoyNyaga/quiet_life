# Data Fetching with React Query Rule

All server data (Supabase tables, `/api/*` routes, storage listings) MUST be fetched and mutated through **TanStack React Query** (`@tanstack/react-query` v5). No exceptions.

## 1. Hard Rules

1. **Every read uses `useQuery`/`useSuspenseQuery`** (or `queryOptions` + `prefetchQuery` on the server). Never fetch in `useEffect` + `useState`.
2. **Every write uses `useMutation`.** Never call `supabase.from(...).insert/update/delete` or `fetch(..., { method: 'POST' })` directly from a component or event handler.
3. **Never store server data in React Context, `useState`, or `localStorage`.** Context is only for UI/client state: `locale`, modal state, notifications, and the auth session (`user`, `isAuthReady`).
4. **Never hand-patch cached lists after a mutation** with `setPosts(prev => prev.map(...))`-style code. Use `invalidateQueries`, or `setQueryData` inside the optimistic-update pattern below.
5. **Query keys come only from the key factory** in `src/lib/query/keys.ts`. Never write inline array keys like `['posts']` in components.
6. **API functions throw on error.** A Supabase `{ error }` must be converted to `throw error` so React Query's `isError`/`onError` work.
7. **User-scoped queries include `userId` in the key** and use `enabled: !!userId`.

## 2. File Layout

```
src/
  lib/query/
    queryClient.ts     # makeQueryClient() + default options
    keys.ts            # qk key factory (single source of truth)
  features/<domain>/   # posts, categories, tags, likes, readingLists, profiles, subscriptions, comments
    api.ts             # pure async functions (Supabase / fetch). No React. Throw on error.
    queries.ts         # queryOptions() objects + useXxx() hooks
    mutations.ts       # useXxx() mutation hooks with invalidation / optimistic updates
```

Components import hooks from `features/<domain>/queries` or `mutations` — never from `api.ts` directly.

## 3. Query Key Factory

Add new keys to `src/lib/query/keys.ts` hierarchically (broad → specific) so a parent key invalidates all children:

```ts
export const qk = {
  posts: {
    all: ['posts'] as const,
    list: (filters?: PostFilters) => [...qk.posts.all, 'list', filters ?? {}] as const,
    detail: (slug: string) => [...qk.posts.all, 'detail', slug] as const,
  },
  likes: { byUser: (userId?: string) => ['likes', userId] as const },
  readingLists: {
    all: (userId?: string) => ['readingLists', userId] as const,
    items: (userId?: string) => ['readingLists', userId, 'items'] as const,
  },
  categories: { all: ['categories'] as const },
  tags: { all: ['tags'] as const },
};
```

## 4. Query Pattern

```ts
// features/posts/api.ts
export async function fetchPosts(): Promise<Post[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('posts')
    .select('*, categories(*), profiles(*), post_tags(*, tags(*))')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// features/posts/queries.ts
export const postsQueryOptions = () =>
  queryOptions({ queryKey: qk.posts.list(), queryFn: fetchPosts });

export function usePosts() {
  return useQuery(postsQueryOptions());
}
```

- Components must handle `isPending` and `isError` (skeleton / error UI). Never treat "loading" as "empty".
- Derive data with `select` or `useMemo` instead of copying it into state.
- Reference data (categories, tags): `staleTime: 5 * 60 * 1000`.

## 5. Mutation Pattern

Simple mutation (invalidate on success):

```ts
export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.posts.all }),
  });
}
```

Optimistic mutation (likes, bookmarks, toggles) — always use `onMutate` → `onError` rollback → `onSettled` invalidate:

```ts
onMutate: async (vars) => {
  await qc.cancelQueries({ queryKey });
  const previous = qc.getQueryData(queryKey);
  qc.setQueryData(queryKey, (old) => /* immutable update */);
  return { previous };
},
onError: (_err, _vars, ctx) => qc.setQueryData(queryKey, ctx?.previous),
onSettled: () => qc.invalidateQueries({ queryKey }),
```

- Show user feedback (notifications) in the mutation's `onError` / `onSuccess` or in the component via `mutate(vars, { onSuccess })`, with EN/FR strings from `src/lib/i18n.ts`.
- Use `isPending` from the mutation for button loading states.

## 6. Auth Integration

- The Supabase session is the only auth source of truth. Do not use `localStorage` for the user.
- On `SIGNED_OUT`: `queryClient.removeQueries()` for user-scoped keys (likes, readingLists, profile).
- On `SIGNED_IN` / `USER_UPDATED`: `queryClient.invalidateQueries()` for user-scoped keys.
- Keep public data (posts, categories, tags) separate from user data (e.g. likes are a separate `Set<postId>` query, not merged into posts).

## 7. Server Components / SSR

- On the server, create a fresh `QueryClient` per request, `prefetchQuery(xxxQueryOptions())`, and wrap the client tree in `<HydrationBoundary state={dehydrate(queryClient)}>`.
- In the browser, the `QueryClient` is a singleton created in `Providers.tsx` via `useState(() => makeQueryClient())`.
- Before writing server-side code, check `node_modules/next/dist/docs/` for the current Next.js API (see `AGENTS.md`).

## 8. Checklist Before Finishing Any Data-Related Change

- [ ] No `useEffect` fetching, no server data in Context/state.
- [ ] Keys from `qk` factory; user-scoped keys include `userId`.
- [ ] API functions throw on error.
- [ ] Mutations invalidate (or optimistically update + roll back) the right keys.
- [ ] Loading and error states rendered.
- [ ] `npm run build` passes.
