'use client';

import { useState, useEffect, useRef, useMemo, createContext, useContext, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { Profile, Locale } from '@/types/database';
import { createClient } from './supabase/client';
import { qk, USER_SCOPED_ROOT_KEYS } from './query/keys';
import { registerNotifier, setNotifierLocale } from './query/notify';
import { profileQueryOptions } from '@/features/auth/queries';
import { buildProfile, signOut as signOutRequest } from '@/features/auth/api';

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
  authModalOpen: boolean;
  authModalMode: 'signin' | 'signup';
  authModalPrompt: string;
  openAuthModal: (mode?: 'signin' | 'signup', promptMessage?: string) => void;
  closeAuthModal: () => void;
  notification: AppNotification | null;
  setNotification: (notif: AppNotification | null) => void;
  clearNotification: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children, initialLocale = 'en' }: { children: ReactNode; initialLocale?: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // --- Auth: the Supabase session is the ONLY source of truth ---
  const [session, setSession] = useState<Session | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const sessionUser = session?.user ?? null;
  const userId = sessionUser?.id ?? null;

  // Profile row is server data -> React Query cache (keyed by userId)
  const profileQuery = useQuery(profileQueryOptions(userId));
  const user = useMemo<Profile | null>(
    () => (sessionUser ? buildProfile(sessionUser, profileQuery.data ?? null) : null),
    [sessionUser, profileQuery.data]
  );
  // Ready once the session is known and (if signed in) the profile has resolved
  const isAuthReady = sessionChecked && (!userId || profileQuery.status !== 'pending');

  // Global Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [authModalPrompt, setAuthModalPrompt] = useState('');

  const openAuthModal = (mode: 'signin' | 'signup' = 'signin', promptMessage: string = '') => {
    setAuthModalMode(mode);
    setAuthModalPrompt(promptMessage);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setAuthModalPrompt('');
  };

  // Notification Toast State
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

  /**
   * Compatibility helper: writes a profile into the React Query cache.
   * Sign-in/out must go through the auth mutations (features/auth/mutations.ts).
   */
  const setUser = (newUser: Profile | null) => {
    if (newUser) {
      queryClient.setQueryData(qk.auth.profile(newUser.id), newUser);
    }
  };

  // Bridge global React Query success/error handlers to the notification UI
  const setNotificationRef = useRef(setNotification);
  useEffect(() => {
    setNotificationRef.current = setNotification;
  });
  useEffect(() => {
    registerNotifier((type, message) => setNotificationRef.current({ type, message }));
    return () => registerNotifier(null);
  }, []);
  useEffect(() => {
    setNotifierLocale(locale);
  }, [locale]);

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

  // Load state and listen to Supabase auth on mount
  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem('quiet_life_locale') as Locale;
      if (savedLocale) setLocaleState(savedLocale);

      // Clean out legacy client-side copies of server data / auth
      localStorage.removeItem('quiet_life_posts');
      localStorage.removeItem('quiet_life_reading_lists');
      localStorage.removeItem('quiet_life_reading_list_items');
      localStorage.removeItem('quiet_life_categories');
      localStorage.removeItem('quiet_life_user');
    } catch (e) {
      console.warn('LocalStorage initialization error:', e);
    }

    // Connect with Supabase
    const supabase = createClient();
    if (!supabase) {
      setSessionChecked(true);
      return;
    }

    // 1. Restore the session from Supabase cookies (refreshes the token if needed)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionChecked(true);
    });

    // 2. Listen to auth changes.
    // IMPORTANT: this callback must stay SYNCHRONOUS and must never await Supabase calls.
    // supabase-js holds an auth lock while notifying listeners; awaiting a query here
    // deadlocks signInWithPassword (network returns 200 but the promise never resolves).
    // Profile loading is handled by React Query (profileQuery) reacting to `userId`.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setSessionChecked(true);

      if (event === 'SIGNED_OUT') {
        USER_SCOPED_ROOT_KEYS.forEach(queryKey => queryClient.removeQueries({ queryKey }));
      } else if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && newSession?.user) {
        queryClient.invalidateQueries({ queryKey: qk.auth.profile(newSession.user.id) });
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [queryClient]);

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
    try {
      await signOutRequest();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    setSession(null);
    USER_SCOPED_ROOT_KEYS.forEach(queryKey => queryClient.removeQueries({ queryKey }));
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
        authModalOpen,
        authModalMode,
        authModalPrompt,
        openAuthModal,
        closeAuthModal,
        notification,
        setNotification,
        clearNotification,
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
