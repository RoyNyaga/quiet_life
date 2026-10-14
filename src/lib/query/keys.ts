/**
 * Query key factory — the single source of truth for every React Query key.
 * Keys are hierarchical (broad -> specific) so invalidating a parent key
 * also invalidates all of its children.
 *
 * Never write inline array keys in components; always use `qk`.
 */
export const qk = {
  auth: {
    profile: (userId?: string | null) => ['auth', 'profile', userId ?? null] as const,
  },
  posts: {
    all: ['posts'] as const,
    list: (filters?: Record<string, unknown>) => ['posts', 'list', filters ?? {}] as const,
    admin: () => ['posts', 'admin'] as const,
    detail: (slug: string) => ['posts', 'detail', slug] as const,
  },
  likes: {
    all: ['likes'] as const,
    byUser: (userId?: string | null) => ['likes', userId ?? null] as const,
  },
  readingLists: {
    all: ['readingLists'] as const,
    byUser: (userId?: string | null) => ['readingLists', userId ?? null] as const,
    items: (userId?: string | null) => ['readingLists', userId ?? null, 'items'] as const,
    detail: (listId: string) => ['readingLists', 'detail', listId] as const,
    articles: (listId: string) => ['readingLists', 'detail', listId, 'articles'] as const,
  },
  comments: {
    all: ['comments'] as const,
    byPost: (postId: string) => ['comments', postId] as const,
  },
  categories: { all: ['categories'] as const },
  tags: { all: ['tags'] as const },
  subscriptions: { all: ['subscriptions'] as const },
  profiles: { all: ['profiles'] as const },
};

/**
 * Root keys of data that belongs to the signed-in user.
 * Removed on sign-out and invalidated on sign-in.
 */
export const USER_SCOPED_ROOT_KEYS = [
  ['auth'],
  qk.likes.all,
  qk.readingLists.all,
] as const;
