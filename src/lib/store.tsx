'use client';

import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Post, Category, Tag, Comment, Profile, ReadingList, ReadingListItem, Subscription, Locale } from '@/types/database';
import { INITIAL_CATEGORIES, INITIAL_TAGS, MOCK_ADMIN_PROFILE } from './mockData';
import { createClient } from './supabase/client';

export interface AppNotification {
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
}

interface AppContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  user: Profile | null;
  setUser: (user: Profile | null) => void;
  isAuthReady: boolean;
  signOut: () => Promise<void>;
  posts: Post[];
  categories: Category[];
  tags: Tag[];
  comments: Comment[];
  readingLists: ReadingList[];
  readingListItems: ReadingListItem[];
  subscriptions: Subscription[];
  notification: AppNotification | null;
  setNotification: (notif: AppNotification | null) => void;
  clearNotification: () => void;
  // Actions
  createPost: (post: Partial<Post>) => void;
  updatePost: (id: string, post: Partial<Post>) => void;
  deletePost: (id: string) => void;
  togglePostLike: (postId: string) => void;
  incrementViews: (postId: string) => void;
  addComment: (comment: Partial<Comment>) => void;
  toggleCommentLike: (commentId: string) => void;
  createReadingList: (name: string, description?: string, is_private?: boolean) => ReadingList;
  updateReadingList: (id: string, updates: Partial<ReadingList>) => void;
  deleteReadingList: (id: string) => void;
  removeReadingListItem: (listId: string, postId: string) => void;
  toggleSavedToReadingList: (listId: string, postId: string) => void;
  subscribeNewsletter: (email: string, originPostId?: string) => boolean;
  createCategory: (cat: Partial<Category>) => void;
  updateCategory: (id: string, cat: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  createTag: (tag: Partial<Tag>) => void;
  updateTag: (id: string, tag: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  updateUserProfile: (profile: Partial<Profile>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children, initialLocale = 'en' }: { children: ReactNode; initialLocale?: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [user, setUserState] = useState<Profile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [tags, setTags] = useState<Tag[]>(INITIAL_TAGS);
  const [comments, setComments] = useState<Comment[]>([]);
  const [readingLists, setReadingLists] = useState<ReadingList[]>([]);
  const [readingListItems, setReadingListItems] = useState<ReadingListItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const [notification, setNotificationState] = useState<AppNotification | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearNotification = () => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }
    setNotificationState(null);
  };

  const setNotification = (notif: AppNotification | null) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }

    setNotificationState(notif);

    if (notif) {
      // Error messages auto-dismiss after exactly 1 minute (60,000ms); success/info after 6,000ms
      const duration = notif.type === 'error' ? 60000 : 6000;
      notificationTimeoutRef.current = setTimeout(() => {
        setNotificationState(null);
        notificationTimeoutRef.current = null;
      }, duration);
    }
  };

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (user?.role) headers['x-user-role'] = user.role;
    if (user?.id) headers['x-user-id'] = user.id;
    return headers;
  };

  const setUser = (newUser: Profile | null) => {
    setUserState(newUser);
    if (typeof window !== 'undefined') {
      if (newUser) {
        localStorage.setItem('quiet_life_user', JSON.stringify(newUser));
      } else {
        localStorage.removeItem('quiet_life_user');
      }
    }
  };

  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      clearNotification();
    }
  }, [pathname]);

  // Sync locale with URL if route locale changes
  useEffect(() => {
    if (pathname) {
      const seg = pathname.split('/')[1];
      if ((seg === 'en' || seg === 'fr') && seg !== locale) {
        setLocaleState(seg as Locale);
      }
    }
  }, [pathname, locale]);

  // Load state and listen to Supabase auth / DB on mount
  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem('quiet_life_locale') as Locale;
      if (savedLocale) setLocaleState(savedLocale);

      // Clean out legacy mock posts if found in localStorage
      const savedPosts = localStorage.getItem('quiet_life_posts');
      if (savedPosts) {
        try {
          const parsed = JSON.parse(savedPosts);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter(p => !['post-1', 'post-2', 'post-3'].includes(p.id));
            setPosts(cleaned);
            localStorage.setItem('quiet_life_posts', JSON.stringify(cleaned));
          }
        } catch (e) {
          console.warn('Error reading saved posts:', e);
        }
      }

      const savedCats = localStorage.getItem('quiet_life_categories');
      if (savedCats) {
        try {
          const parsed = JSON.parse(savedCats);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCategories(parsed);
          }
        } catch (e) {
          console.warn('Error reading saved categories:', e);
        }
      }

      // Clean out legacy mock users (e.g. Elena Vance)
      const savedUser = localStorage.getItem('quiet_life_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed?.id === 'admin-101' || parsed?.full_name === 'Elena Vance') {
            localStorage.removeItem('quiet_life_user');
            setUser(null);
          } else if (parsed?.id) {
            setUser(parsed);
          }
        } catch (e) {
          console.warn('Error reading saved user:', e);
        }
      }
      // Load saved reading lists & items
      const savedLists = localStorage.getItem('quiet_life_reading_lists');
      if (savedLists) {
        try {
          const parsed = JSON.parse(savedLists);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setReadingLists(parsed);
          }
        } catch (e) {
          console.warn('Error reading saved reading lists:', e);
        }
      }

      const savedListItems = localStorage.getItem('quiet_life_reading_list_items');
      if (savedListItems) {
        try {
          const parsed = JSON.parse(savedListItems);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setReadingListItems(parsed);
          }
        } catch (e) {
          console.warn('Error reading saved reading list items:', e);
        }
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    } finally {
      setIsAuthReady(true);
    }

    // Connect with Supabase
    const supabase = createClient();
    if (supabase) {
      // 1. Fetch current session user & profile
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUser(profile);
            localStorage.setItem('quiet_life_user', JSON.stringify(profile));
          }
        }
      });

      // 2. Listen to auth changes
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const activeProfile = profile || {
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || 'Admin',
            avatar_url: session.user.user_metadata?.avatar_url || null,
            role: session.user.email?.toLowerCase() === 'nyagaandreroy@gmail.com' ? 'admin' : 'user',
            onboarding_completed: true,
            created_at: session.user.created_at,
            updated_at: new Date().toISOString(),
          };

          setUser(activeProfile);
          localStorage.setItem('quiet_life_user', JSON.stringify(activeProfile));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('quiet_life_user');
        }
      });

      // 3. Fetch categories from /api/categories
      fetch('/api/categories')
        .then(res => res.json())
        .then(res => {
          if (res.data && res.data.length > 0) {
            setCategories(res.data);
            localStorage.setItem('quiet_life_categories', JSON.stringify(res.data));
          }
        })
        .catch(err => {
          console.warn('Error fetching /api/categories:', err);
          supabase
            .from('categories')
            .select('*')
            .then(({ data: remoteCats }) => {
              if (remoteCats && remoteCats.length > 0) {
                setCategories(remoteCats);
                localStorage.setItem('quiet_life_categories', JSON.stringify(remoteCats));
              }
            });
        });

      // 3b. Fetch tags from /api/tags
      fetch('/api/tags')
        .then(res => res.json())
        .then(res => {
          if (res.data && res.data.length > 0) {
            setTags(res.data);
          }
        })
        .catch(err => console.warn('Error fetching /api/tags:', err));

      // 4. Fetch posts from Supabase
      supabase
        .from('posts')
        .select('*, categories(*), profiles(*)')
        .order('created_at', { ascending: false })
        .then(({ data: remotePosts }) => {
          if (remotePosts) {
            // Merge: keep any local-only posts (temp IDs starting with 'post-') that
            // haven't been persisted to the DB yet, then prepend remote posts.
            setPosts(prev => {
              const localOnly = prev.filter(
                p => p.id.startsWith('post-') && !remotePosts.some(r => r.id === p.id)
              );
              const merged = [...localOnly, ...remotePosts];
              localStorage.setItem('quiet_life_posts', JSON.stringify(merged));
              return merged;
            });
          }
        });

      // 5. Fetch reading lists & items from Supabase
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          supabase
            .from('reading_lists')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .then(({ data: remoteLists }) => {
              if (remoteLists && remoteLists.length > 0) {
                setReadingLists(remoteLists);
                localStorage.setItem('quiet_life_reading_lists', JSON.stringify(remoteLists));
              }
            });

          supabase
            .from('reading_list_items')
            .select('*')
            .then(({ data: remoteItems }) => {
              if (remoteItems && remoteItems.length > 0) {
                setReadingListItems(remoteItems);
                localStorage.setItem('quiet_life_reading_list_items', JSON.stringify(remoteItems));
              }
            });
        }
      });

      return () => {
        authListener?.subscription.unsubscribe();
      };
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('quiet_life_locale', newLocale);
    if (typeof document !== 'undefined') {
      document.cookie = `quiet_life_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    }

    if (pathname) {
      const segments = pathname.split('/');
      // segments[1] is the locale code ('en' | 'fr')
      if (segments[1] === 'en' || segments[1] === 'fr') {
        segments[1] = newLocale;
        const newPath = segments.join('/') || `/${newLocale}`;
        const search = typeof window !== 'undefined' ? window.location.search : '';
        router.push(`${newPath}${search}`);
      } else {
        router.push(`/${newLocale}${pathname}`);
      }
    }
  };

  const signOut = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('quiet_life_user');
  };

  const createPost = (newPostData: Partial<Post>) => {
    const newPost: Post = {
      id: newPostData.id || `post-${Date.now()}`,
      slug: newPostData.slug || `article-${Date.now()}`,
      slug_source_locale: newPostData.slug_source_locale || 'en',
      status: newPostData.status || 'published',
      category_id: newPostData.category_id || categories[0]?.id,
      author_id: user?.id || MOCK_ADMIN_PROFILE.id,
      cover_image_url: newPostData.cover_image_url || 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
      read_time_minutes: newPostData.read_time_minutes || 5,
      views_count: 0,
      published_at: newPostData.published_at || new Date().toISOString(),
      title_en: newPostData.title_en || 'Untitled Article',
      title_fr: newPostData.title_fr || '',
      excerpt_en: newPostData.excerpt_en || '',
      excerpt_fr: newPostData.excerpt_fr || '',
      content_markdown_en: newPostData.content_markdown_en || '# New Article',
      content_markdown_fr: newPostData.content_markdown_fr || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      categories: categories.find(c => c.id === newPostData.category_id),
      profiles: user || MOCK_ADMIN_PROFILE,
      likes_count: 0,
    };
    const updated = [newPost, ...posts];
    setPosts(updated);
    localStorage.setItem('quiet_life_posts', JSON.stringify(updated));

    // Also persist to Supabase if connected
    const supabase = createClient();
    if (supabase && user) {
      supabase.from('posts').insert({
        slug: newPost.slug,
        slug_source_locale: newPost.slug_source_locale,
        category_id: newPost.category_id,
        author_id: user.id,
        status: newPost.status,
        cover_image_url: newPost.cover_image_url,
        read_time_minutes: newPost.read_time_minutes,
        title_en: newPost.title_en,
        title_fr: newPost.title_fr,
        excerpt_en: newPost.excerpt_en,
        excerpt_fr: newPost.excerpt_fr,
        content_markdown_en: newPost.content_markdown_en,
        content_markdown_fr: newPost.content_markdown_fr,
        published_at: newPost.published_at,
      }).select('id').single().then(({ data, error }) => {
        if (error) {
          console.warn('Supabase post insert info:', error.message);
        } else if (data?.id) {
          // Replace the temp local ID with the real DB UUID so future fetches
          // don't create a duplicate.
          setPosts(prev => {
            const updated = prev.map(p =>
              p.id === newPost.id ? { ...p, id: data.id } : p
            );
            localStorage.setItem('quiet_life_posts', JSON.stringify(updated));
            return updated;
          });
        }
      });
    }
  };

  const updatePost = (id: string, updatedFields: Partial<Post>) => {
    const updated = posts.map(p => (p.id === id ? { ...p, ...updatedFields, updated_at: new Date().toISOString() } : p));
    setPosts(updated);
    localStorage.setItem('quiet_life_posts', JSON.stringify(updated));

    const supabase = createClient();
    if (supabase) {
      supabase.from('posts').update({
        ...updatedFields,
        updated_at: new Date().toISOString(),
      }).eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase post update info:', error.message);
      });
    }
  };

  const deletePost = (id: string) => {
    const updated = posts.filter(p => p.id !== id);
    setPosts(updated);
    localStorage.setItem('quiet_life_posts', JSON.stringify(updated));

    const supabase = createClient();
    if (supabase) {
      supabase.from('posts').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase post delete info:', error.message);
      });
    }
  };

  const togglePostLike = (postId: string) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const hasLiked = p.user_has_liked;
          return {
            ...p,
            user_has_liked: !hasLiked,
            likes_count: (p.likes_count || 0) + (hasLiked ? -1 : 1),
          };
        }
        return p;
      })
    );
  };

  const incrementViews = (postId: string) => {
    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, views_count: p.views_count + 1 } : p))
    );
  };

  const addComment = (commentData: Partial<Comment>) => {
    const newComment: Comment = {
      id: `comm-${Date.now()}`,
      post_id: commentData.post_id || '',
      user_id: user?.id || null,
      guest_name: commentData.guest_name || user?.full_name || 'Mindful Reader',
      guest_email: commentData.guest_email || '',
      content: commentData.content || '',
      parent_id: commentData.parent_id || null,
      is_approved: true,
      likes_count: 0,
      created_at: new Date().toISOString(),
      profiles: user || undefined,
    };
    setComments(prev => [newComment, ...prev]);
  };

  const toggleCommentLike = (commentId: string) => {
    setComments(prev =>
      prev.map(c => {
        if (c.id === commentId) {
          const hasLiked = c.user_has_liked;
          return {
            ...c,
            user_has_liked: !hasLiked,
            likes_count: c.likes_count + (hasLiked ? -1 : 1),
          };
        }
        return c;
      })
    );
  };

  const createReadingList = (name: string, description?: string, is_private: boolean = true): ReadingList => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `list-${Date.now()}`;
    const newList: ReadingList = {
      id,
      user_id: user?.id || 'guest-1',
      name,
      description: description || null,
      is_private,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setReadingLists(prev => {
      const updated = [...prev, newList];
      if (typeof window !== 'undefined') {
        localStorage.setItem('quiet_life_reading_lists', JSON.stringify(updated));
      }
      return updated;
    });

    const supabase = createClient();
    if (supabase && user && !user.id.startsWith('guest')) {
      supabase.from('reading_lists').insert({
        id: newList.id,
        user_id: user.id,
        name: newList.name,
        description: newList.description,
        is_private: newList.is_private,
      }).then(({ error }) => {
        if (error) console.warn('Error saving reading list to Supabase:', error);
      });
    }

    return newList;
  };

  const updateReadingList = (id: string, updates: Partial<ReadingList>) => {
    setReadingLists(prev => {
      const updated = prev.map(list => {
        if (list.id === id) {
          return { ...list, ...updates, updated_at: new Date().toISOString() };
        }
        return list;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('quiet_life_reading_lists', JSON.stringify(updated));
      }
      return updated;
    });

    const supabase = createClient();
    if (supabase && user && !user.id.startsWith('guest')) {
      const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.is_private !== undefined) dbUpdates.is_private = updates.is_private;

      supabase.from('reading_lists').update(dbUpdates).eq('id', id).then(({ error }) => {
        if (error) console.warn('Error updating reading list in Supabase:', error);
      });
    }
  };

  const deleteReadingList = (id: string) => {
    setReadingLists(prev => {
      const updated = prev.filter(list => list.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('quiet_life_reading_lists', JSON.stringify(updated));
      }
      return updated;
    });

    setReadingListItems(prev => {
      const updated = prev.filter(item => item.list_id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('quiet_life_reading_list_items', JSON.stringify(updated));
      }
      return updated;
    });

    const supabase = createClient();
    if (supabase && user && !user.id.startsWith('guest')) {
      supabase.from('reading_lists').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn('Error deleting reading list in Supabase:', error);
      });
    }
  };

  const removeReadingListItem = (listId: string, postId: string) => {
    setReadingListItems(prev => {
      const updated = prev.filter(item => !(item.list_id === listId && item.post_id === postId));
      if (typeof window !== 'undefined') {
        localStorage.setItem('quiet_life_reading_list_items', JSON.stringify(updated));
      }
      return updated;
    });

    const supabase = createClient();
    if (supabase && user && !user.id.startsWith('guest')) {
      supabase.from('reading_list_items').delete().eq('list_id', listId).eq('post_id', postId).then(({ error }) => {
        if (error) console.warn('Error deleting reading list item in Supabase:', error);
      });
    }
  };

  const toggleSavedToReadingList = (listId: string, postId: string) => {
    setReadingListItems(prev => {
      const exists = prev.some(item => item.list_id === listId && item.post_id === postId);
      let updated: ReadingListItem[];
      if (exists) {
        updated = prev.filter(item => !(item.list_id === listId && item.post_id === postId));
        const supabase = createClient();
        if (supabase && user && !user.id.startsWith('guest')) {
          supabase.from('reading_list_items').delete().eq('list_id', listId).eq('post_id', postId).then(({ error }) => {
            if (error) console.warn('Error removing reading list item in Supabase:', error);
          });
        }
      } else {
        const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `rli-${Date.now()}`;
        const newItem: ReadingListItem = { id, list_id: listId, post_id: postId, created_at: new Date().toISOString() };
        updated = [...prev, newItem];
        const supabase = createClient();
        if (supabase && user && !user.id.startsWith('guest')) {
          supabase.from('reading_list_items').insert({
            id: newItem.id,
            list_id: listId,
            post_id: postId,
          }).then(({ error }) => {
            if (error) console.warn('Error saving reading list item to Supabase:', error);
          });
        }
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('quiet_life_reading_list_items', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const subscribeNewsletter = (email: string, originPostId?: string): boolean => {
    if (!email || !email.includes('@')) return false;
    const exists = subscriptions.some(s => s.email.toLowerCase() === email.toLowerCase());
    if (!exists) {
      setSubscriptions(prev => [
        ...prev,
        { id: `sub-${Date.now()}`, email, origin_post_id: originPostId, status: 'active', created_at: new Date().toISOString() },
      ]);
    }
    return true;
  };

  const createCategory = async (catData: Partial<Category>) => {
    if (!user || user.role !== 'admin') {
      setNotification({
        type: 'error',
        message: 'Unauthorized: Only administrator profiles can create categories.',
      });
      return;
    }

    const tempId = catData.id || `cat-${Date.now()}`;
    const newCat: Category = {
      id: tempId,
      slug: catData.slug || `category-${Date.now()}`,
      name_en: catData.name_en || 'New Category',
      name_fr: catData.name_fr || 'Nouvelle Catégorie',
      description_en: catData.description_en || '',
      description_fr: catData.description_fr || '',
      icon: catData.icon || 'Category',
      created_at: new Date().toISOString(),
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    localStorage.setItem('quiet_life_categories', JSON.stringify(updated));

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(catData),
      });
      const result = await res.json();
      if (res.ok && result.data) {
        setCategories(prev => {
          const synced = prev.map(c => (c.id === tempId ? result.data : c));
          localStorage.setItem('quiet_life_categories', JSON.stringify(synced));
          return synced;
        });
        setNotification({
          type: 'success',
          message: `Category "${result.data.name_en}" created successfully.`,
        });
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to create category on database.',
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error creating category';
      setNotification({ type: 'error', message: msg });
    }
  };

  const updateCategory = async (id: string, catData: Partial<Category>) => {
    if (!user || user.role !== 'admin') {
      setNotification({
        type: 'error',
        message: 'Unauthorized: Only administrator profiles can update categories.',
      });
      return;
    }

    const previous = [...categories];
    const updated = categories.map(c => (c.id === id ? { ...c, ...catData } : c));
    setCategories(updated);
    localStorage.setItem('quiet_life_categories', JSON.stringify(updated));

    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, ...catData }),
      });
      const result = await res.json();
      if (!res.ok) {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to update category on database.',
        });
        setCategories(previous);
        localStorage.setItem('quiet_life_categories', JSON.stringify(previous));
      } else {
        setNotification({
          type: 'success',
          message: 'Category updated successfully.',
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error updating category';
      setNotification({ type: 'error', message: msg });
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user || user.role !== 'admin') {
      setNotification({
        type: 'error',
        message: 'Unauthorized: Only administrator profiles can delete categories.',
      });
      return;
    }

    const previous = [...categories];
    const targetCat = categories.find(c => c.id === id);
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    localStorage.setItem('quiet_life_categories', JSON.stringify(updated));

    try {
      const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to delete category on database.',
        });
        // Rollback state if server did not actually delete the record
        setCategories(previous);
        localStorage.setItem('quiet_life_categories', JSON.stringify(previous));
      } else {
        setNotification({
          type: 'success',
          message: `Category "${targetCat?.name_en || id}" deleted successfully.`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error deleting category';
      setNotification({ type: 'error', message: msg });
    }
  };

  const createTag = async (tagData: Partial<Tag>) => {
    if (!user || user.role !== 'admin') {
      setNotification({
        type: 'error',
        message: 'Unauthorized: Only administrator profiles can create tags.',
      });
      return;
    }

    const tempId = tagData.id || `tag-${Date.now()}`;
    const newTag: Tag = {
      id: tempId,
      slug: tagData.slug || `tag-${Date.now()}`,
      name_en: tagData.name_en || 'New Tag',
      name_fr: tagData.name_fr || 'Nouveau Tag',
      created_at: new Date().toISOString(),
    };
    setTags(prev => [...prev, newTag]);

    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(tagData),
      });
      const result = await res.json();
      if (res.ok && result.data) {
        setTags(prev => prev.map(t => (t.id === tempId ? result.data : t)));
        setNotification({
          type: 'success',
          message: `Tag "${result.data.name_en}" created successfully.`,
        });
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to create tag on database.',
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error creating tag';
      setNotification({ type: 'error', message: msg });
    }
  };

  const updateTag = async (id: string, tagData: Partial<Tag>) => {
    if (!user || user.role !== 'admin') {
      setNotification({
        type: 'error',
        message: 'Unauthorized: Only administrator profiles can update tags.',
      });
      return;
    }

    const previous = [...tags];
    setTags(prev => prev.map(t => (t.id === id ? { ...t, ...tagData } : t)));

    try {
      const res = await fetch('/api/tags', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, ...tagData }),
      });
      const result = await res.json();
      if (!res.ok) {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to update tag on database.',
        });
        setTags(previous);
      } else {
        setNotification({
          type: 'success',
          message: 'Tag updated successfully.',
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error updating tag';
      setNotification({ type: 'error', message: msg });
    }
  };

  const deleteTag = async (id: string) => {
    if (!user || user.role !== 'admin') {
      setNotification({
        type: 'error',
        message: 'Unauthorized: Only administrator profiles can delete tags.',
      });
      return;
    }

    const previous = [...tags];
    setTags(prev => prev.filter(t => t.id !== id));

    try {
      const res = await fetch(`/api/tags?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to delete tag on database.',
        });
        setTags(previous);
      } else {
        setNotification({
          type: 'success',
          message: 'Tag deleted successfully.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error deleting tag';
      setNotification({ type: 'error', message: msg });
    }
  };

  const updateUserProfile = (profileData: Partial<Profile>) => {
    if (!user) return;
    const updated = { ...user, ...profileData, updated_at: new Date().toISOString() };
    setUser(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('quiet_life_user', JSON.stringify(updated));
    }
    const supabase = createClient();
    if (supabase && user.id && !user.id.startsWith('guest')) {
      const dbUpdates: Record<string, unknown> = { updated_at: updated.updated_at };
      if (profileData.full_name !== undefined) dbUpdates.full_name = profileData.full_name;
      if (profileData.avatar_url !== undefined) dbUpdates.avatar_url = profileData.avatar_url;

      supabase.from('profiles').update(dbUpdates).eq('id', user.id).then(({ error }) => {
        if (error) console.warn('Error updating profile in Supabase:', error);
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        locale,
        setLocale,
        user,
        setUser,
        isAuthReady,
        signOut,
        posts,
        categories,
        tags,
        comments,
        readingLists,
        readingListItems,
        subscriptions,
        notification,
        setNotification,
        clearNotification,
        createPost,
        updatePost,
        deletePost,
        togglePostLike,
        incrementViews,
        addComment,
        toggleCommentLike,
        createReadingList,
        updateReadingList,
        deleteReadingList,
        removeReadingListItem,
        toggleSavedToReadingList,
        subscribeNewsletter,
        createCategory,
        updateCategory,
        deleteCategory,
        createTag,
        updateTag,
        deleteTag,
        updateUserProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
