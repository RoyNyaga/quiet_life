import { Category, Tag, Post, Profile, Comment } from '@/types/database';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    slug: 'mindfulness',
    name_en: 'Mindfulness & Meditation',
    name_fr: 'Pleine Conscience & Méditation',
    description_en: 'Cultivate presence, calmness, and mental clarity in your daily routine.',
    description_fr: 'Cultivez la présence, le calme et la clarté mentale dans votre quotidien.',
    icon: 'SelfImprovement',
    created_at: new Date().toISOString(),
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    slug: 'wellness',
    name_en: 'Holistic Wellness',
    name_fr: 'Bien-être Global',
    description_en: 'Nurture physical, emotional, and spiritual balance for sustainable vitality.',
    description_fr: 'Nourrissez l’équilibre physique, émotionnel et spirituel pour une vitalité durable.',
    icon: 'Spa',
    created_at: new Date().toISOString(),
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    slug: 'personal-growth',
    name_en: 'Personal Development',
    name_fr: 'Développement Personnel',
    description_en: 'Unlock potential, build resilient habits, and design a purposeful life.',
    description_fr: 'Libérez votre potentiel, créez des habitudes résilientes et façonnez une vie pleine de sens.',
    icon: 'Psychology',
    created_at: new Date().toISOString(),
  },
  {
    id: 'c4444444-4444-4444-4444-444444444444',
    slug: 'motivation',
    name_en: 'Motivation & Purpose',
    name_fr: 'Motivation & Intention',
    description_en: 'Ignite inner drive, overcome burnout, and stay grounded in goals.',
    description_fr: 'Rallumez votre élan intérieur, surmontez le surmenage et restez ancré.',
    icon: 'Bolt',
    created_at: new Date().toISOString(),
  },
  {
    id: 'c5555555-5555-5555-5555-555555555555',
    slug: 'healthy-living',
    name_en: 'Healthy Living',
    name_fr: 'Vie Saine & Alimentation',
    description_en: 'Nourishing recipes, restorative sleep, and energizing daily rituals.',
    description_fr: 'Recettes nourrissantes, sommeil réparateur et rituels quotidiens vivifiants.',
    icon: 'EmojiFoodBeverage',
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_TAGS: Tag[] = [
  { id: 't1111111-1111-1111-1111-111111111111', slug: 'morning-routine', name_en: 'Morning Rituals', name_fr: 'Rituels du Matin', created_at: new Date().toISOString() },
  { id: 't2222222-2222-2222-2222-222222222222', slug: 'inner-peace', name_en: 'Inner Peace', name_fr: 'Paix Intérieure', created_at: new Date().toISOString() },
  { id: 't3333333-3333-3333-3333-333333333333', slug: 'habit-building', name_en: 'Habits', name_fr: 'Habitudes', created_at: new Date().toISOString() },
  { id: 't4444444-4444-4444-4444-444444444444', slug: 'stress-relief', name_en: 'Stress Relief', name_fr: 'Gestion du Stress', created_at: new Date().toISOString() },
  { id: 't5555555-5555-5555-5555-555555555555', slug: 'mindful-eating', name_en: 'Nutrition', name_fr: 'Alimentation Consciente', created_at: new Date().toISOString() },
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
