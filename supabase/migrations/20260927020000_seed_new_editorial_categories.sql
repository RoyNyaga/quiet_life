-- Migration: Seed and update categories with revised bilingual editorial lineup
-- 1- Accueil
-- 2- Développement personnel et slow-living
-- 3- Épreuves-Résilience et paix intérieure
-- 4- Vie saine et Alimentation
-- 5- Avant-propos

-- 1. Reassign any posts that may point to categories outside the core 5
UPDATE posts
SET category_id = 'c1111111-1111-1111-1111-111111111111'
WHERE category_id NOT IN (
    'c1111111-1111-1111-1111-111111111111',
    'c2222222-2222-2222-2222-222222222222',
    'c3333333-3333-3333-3333-333333333333',
    'c4444444-4444-4444-4444-444444444444',
    'c5555555-5555-5555-5555-555555555555'
);

-- 2. Upsert the 5 revised categories
INSERT INTO categories (id, slug, name_en, name_fr, description_en, description_fr, icon)
VALUES
    (
        'c1111111-1111-1111-1111-111111111111',
        'accueil',
        'Home & Highlights',
        'Accueil',
        'Mindful highlights, latest reflections, and editorial selections.',
        'Sélections mindful, derniers écrits et réflexions éditoriales.',
        'Home'
    ),
    (
        'c2222222-2222-2222-2222-222222222222',
        'developpement-personnel-slow-living',
        'Personal Growth & Slow Living',
        'Développement personnel et slow-living',
        'Cultivate presence, embrace an unhurried rhythm, and build a purposeful life.',
        'Cultiver la présence, ralentir le rythme et façonner une vie pleine de sens.',
        'SelfImprovement'
    ),
    (
        'c3333333-3333-3333-3333-333333333333',
        'epreuves-resilience-paix-interieure',
        'Resilience, Trials & Inner Peace',
        'Épreuves-Résilience et paix intérieure',
        'Navigating hardship, building emotional fortitude, and finding inner peace.',
        'Surmonter les épreuves, forger la résilience et cultiver la paix intérieure.',
        'Spa'
    ),
    (
        'c4444444-4444-4444-4444-444444444444',
        'vie-saine-alimentation',
        'Healthy Living & Nutrition',
        'Vie saine et Alimentation',
        'Wholesome nourishment, restorative sleep, and restorative daily rituals.',
        'Alimentation bienfaisante, sommeil réparateur et rituels quotidiens.',
        'EmojiFoodBeverage'
    ),
    (
        'c5555555-5555-5555-5555-555555555555',
        'avant-propos',
        'Foreword & Perspectives',
        'Avant-propos',
        'Author reflections, project genesis, and founding principles of Quiet Life.',
        'Notes de l’auteur, genèse du projet et vision fondatrice de Quiet Life.',
        'MenuBook'
    )
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    name_en = EXCLUDED.name_en,
    name_fr = EXCLUDED.name_fr,
    description_en = EXCLUDED.description_en,
    description_fr = EXCLUDED.description_fr,
    icon = EXCLUDED.icon;

-- 3. Remove obsolete categories if any exist
DELETE FROM categories
WHERE id NOT IN (
    'c1111111-1111-1111-1111-111111111111',
    'c2222222-2222-2222-2222-222222222222',
    'c3333333-3333-3333-3333-333333333333',
    'c4444444-4444-4444-4444-444444444444',
    'c5555555-5555-5555-5555-555555555555'
);
