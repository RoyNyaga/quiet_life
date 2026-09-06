export type UserRole = 'user' | 'admin';
export type PostStatus = 'draft' | 'published' | 'archived';
export type SubscriptionStatus = 'active' | 'unsubscribed';
export type Locale = 'en' | 'fr';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  role: UserRole;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name_en: string;
  name_fr: string;
  description_en?: string | null;
  description_fr?: string | null;
  icon?: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  slug: string;
  name_en: string;
  name_fr: string;
  created_at: string;
}

export interface Post {
  id: string;
  slug: string;
  category_id?: string | null;
  author_id?: string | null;
  status: PostStatus;
  cover_image_url?: string | null;
  read_time_minutes: number;
  views_count: number;
  published_at?: string | null;
  title_en: string;
  title_fr?: string | null;
  excerpt_en?: string | null;
  excerpt_fr?: string | null;
  content_markdown_en: string;
  content_markdown_fr?: string | null;
  created_at: string;
  updated_at: string;
  // Joined relation fields
  categories?: Category | null;
  profiles?: Profile | null;
  post_tags?: { tags: Tag }[];
  likes_count?: number;
  user_has_liked?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id?: string | null;
  guest_name?: string | null;
  guest_email?: string | null;
  content: string;
  parent_id?: string | null;
  is_approved: boolean;
  likes_count: number;
  created_at: string;
  profiles?: Profile | null;
  replies?: Comment[];
  user_has_liked?: boolean;
}

export interface ReadingList {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export interface ReadingListItem {
  id: string;
  list_id: string;
  post_id: string;
  created_at: string;
  posts?: Post;
}

export interface Subscription {
  id: string;
  email: string;
  origin_post_id?: string | null;
  status: SubscriptionStatus;
  created_at: string;
}
