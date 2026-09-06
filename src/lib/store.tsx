'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Post, Category, Tag, Comment, Profile, ReadingList, ReadingListItem, Subscription, Locale } from '@/types/database';
import { INITIAL_CATEGORIES, INITIAL_TAGS, MOCK_ADMIN_PROFILE } from './mockData';
import { createClient } from './supabase/client';

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
  // Actions
  createPost: (post: Partial<Post>) => void;
  updatePost: (id: string, post: Partial<Post>) => void;
  deletePost: (id: string) => void;
  togglePostLike: (postId: string) => void;
  incrementViews: (postId: string) => void;
  addComment: (comment: Partial<Comment>) => void;
  toggleCommentLike: (commentId: string) => void;
  createReadingList: (name: string, description?: string) => ReadingList;
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

      // 3. Fetch categories from Supabase
      supabase
        .from('categories')
        .select('*')
        .then(({ data: remoteCats }) => {
          if (remoteCats && remoteCats.length > 0) {
            setCategories(remoteCats);
            localStorage.setItem('quiet_life_categories', JSON.stringify(remoteCats));
          }
        });

      // 4. Fetch posts from Supabase
      supabase
        .from('posts')
        .select('*, categories(*), profiles(*)')
        .order('created_at', { ascending: false })
        .then(({ data: remotePosts }) => {
          if (remotePosts) {
            setPosts(remotePosts);
            localStorage.setItem('quiet_life_posts', JSON.stringify(remotePosts));
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
      }).then(({ error }) => {
        if (error) console.warn('Supabase post insert info:', error.message);
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

  const createReadingList = (name: string, description?: string): ReadingList => {
    const newList: ReadingList = {
      id: `list-${Date.now()}`,
      user_id: user?.id || 'guest-1',
      name,
      description,
      is_private: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setReadingLists(prev => [...prev, newList]);
    return newList;
  };

  const toggleSavedToReadingList = (listId: string, postId: string) => {
    setReadingListItems(prev => {
      const exists = prev.some(item => item.list_id === listId && item.post_id === postId);
      if (exists) {
        return prev.filter(item => !(item.list_id === listId && item.post_id === postId));
      } else {
        return [...prev, { id: `rli-${Date.now()}`, list_id: listId, post_id: postId, created_at: new Date().toISOString() }];
      }
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

  const createCategory = (catData: Partial<Category>) => {
    const newCat: Category = {
      id: catData.id || `cat-${Date.now()}`,
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
  };

  const updateCategory = (id: string, catData: Partial<Category>) => {
    const updated = categories.map(c => (c.id === id ? { ...c, ...catData } : c));
    setCategories(updated);
    localStorage.setItem('quiet_life_categories', JSON.stringify(updated));
  };

  const deleteCategory = (id: string) => {
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    localStorage.setItem('quiet_life_categories', JSON.stringify(updated));
  };

  const createTag = (tagData: Partial<Tag>) => {
    const newTag: Tag = {
      id: tagData.id || `tag-${Date.now()}`,
      slug: tagData.slug || `tag-${Date.now()}`,
      name_en: tagData.name_en || 'New Tag',
      name_fr: tagData.name_fr || 'Nouveau Tag',
      created_at: new Date().toISOString(),
    };
    setTags(prev => [...prev, newTag]);
  };

  const updateTag = (id: string, tagData: Partial<Tag>) => {
    setTags(prev => prev.map(t => (t.id === id ? { ...t, ...tagData } : t)));
  };

  const deleteTag = (id: string) => {
    setTags(prev => prev.filter(t => t.id !== id));
  };

  const updateUserProfile = (profileData: Partial<Profile>) => {
    if (!user) return;
    const updated = { ...user, ...profileData, updated_at: new Date().toISOString() };
    setUser(updated);
    localStorage.setItem('quiet_life_user', JSON.stringify(updated));
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
        createPost,
        updatePost,
        deletePost,
        togglePostLike,
        incrementViews,
        addComment,
        toggleCommentLike,
        createReadingList,
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
