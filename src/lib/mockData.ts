import { Category, Tag, Post, Profile, Comment } from '@/types/database';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    slug: 'accueil',
    name_en: 'Home & Highlights',
    name_fr: 'Accueil',
    description_en: 'Mindful highlights, latest reflections, and editorial selections.',
    description_fr: 'Sélections mindful, derniers écrits et réflexions éditoriales.',
    icon: 'Home',
    created_at: new Date().toISOString(),
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    slug: 'developpement-personnel-slow-living',
    name_en: 'Personal Growth & Slow Living',
    name_fr: 'Développement personnel et slow-living',
    description_en: 'Cultivate presence, embrace an unhurried rhythm, and build a purposeful life.',
    description_fr: 'Cultiver la présence, ralentir le rythme et façonner une vie pleine de sens.',
    icon: 'SelfImprovement',
    created_at: new Date().toISOString(),
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    slug: 'epreuves-resilience-paix-interieure',
    name_en: 'Resilience, Trials & Inner Peace',
    name_fr: 'Épreuves-Résilience et paix intérieure',
    description_en: 'Navigating hardship, building emotional fortitude, and finding inner peace.',
    description_fr: 'Surmonter les épreuves, forger la résilience et cultiver la paix intérieure.',
    icon: 'Spa',
    created_at: new Date().toISOString(),
  },
  {
    id: 'c4444444-4444-4444-4444-444444444444',
    slug: 'vie-saine-alimentation',
    name_en: 'Healthy Living & Nutrition',
    name_fr: 'Vie saine et Alimentation',
    description_en: 'Wholesome nourishment, restorative sleep, and restorative daily rituals.',
    description_fr: 'Alimentation bienfaisante, sommeil réparateur et rituels quotidiens.',
    icon: 'EmojiFoodBeverage',
    created_at: new Date().toISOString(),
  },
  {
    id: 'c5555555-5555-5555-5555-555555555555',
    slug: 'avant-propos',
    name_en: 'Foreword & Perspectives',
    name_fr: 'Avant-propos',
    description_en: 'Author reflections, project genesis, and founding principles of Quiet Life.',
    description_fr: 'Notes de l’auteur, genèse du projet et vision fondatrice de Quiet Life.',
    icon: 'MenuBook',
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_TAGS: Tag[] = [
  { id: 'b1111111-1111-1111-1111-111111111111', slug: 'morning-routine', name_en: 'Morning Rituals', name_fr: 'Rituels du Matin', created_at: new Date().toISOString() },
  { id: 'b2222222-2222-2222-2222-222222222222', slug: 'inner-peace', name_en: 'Inner Peace', name_fr: 'Paix Intérieure', created_at: new Date().toISOString() },
  { id: 'b3333333-3333-3333-3333-333333333333', slug: 'habit-building', name_en: 'Habits', name_fr: 'Habitudes', created_at: new Date().toISOString() },
  { id: 'b4444444-4444-4444-4444-444444444444', slug: 'stress-relief', name_en: 'Stress Relief', name_fr: 'Gestion du Stress', created_at: new Date().toISOString() },
  { id: 'b5555555-5555-5555-5555-555555555555', slug: 'mindful-eating', name_en: 'Nutrition', name_fr: 'Alimentation Consciente', created_at: new Date().toISOString() },
];

export const MOCK_ADMIN_PROFILE: Profile = {
  id: 'admin-nyaga',
  full_name: 'Andre Roy Nyaga',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  role: 'admin',
  onboarding_completed: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const INITIAL_POSTS: Post[] = [];

export const INITIAL_COMMENTS: Comment[] = [];
