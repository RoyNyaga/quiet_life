'use client';

import Link from 'next/link';
import { Typography, Button, Container, Chip, Box } from '@mui/material';
import SpaIcon from '@mui/icons-material/Spa';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import PsychologyIcon from '@mui/icons-material/Psychology';
import BoltIcon from '@mui/icons-material/Bolt';
import EmojiFoodBeverageIcon from '@mui/icons-material/EmojiFoodBeverage';
import HomeIcon from '@mui/icons-material/Home';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CategoryIcon from '@mui/icons-material/Category';
import { motion } from 'framer-motion';
import { useApp } from '@/lib/store';
import { getLocalizedField, DICTIONARY } from '@/lib/i18n';
import { ArticleCard } from '@/components/article/ArticleCard';

export default function HomePage() {
  const { locale, posts, categories } = useApp();
  const t = DICTIONARY[locale];

  const featuredPost = posts[0];

  const getCategoryIcon = (iconName?: string | null, slug?: string | null) => {
    // 1. Direct name lookup
    switch (iconName) {
      case 'Home':
        return <HomeIcon fontSize="large" />;
      case 'SelfImprovement':
        return <SelfImprovementIcon fontSize="large" />;
      case 'Spa':
        return <SpaIcon fontSize="large" />;
      case 'EmojiFoodBeverage':
        return <EmojiFoodBeverageIcon fontSize="large" />;
      case 'MenuBook':
        return <MenuBookIcon fontSize="large" />;
      case 'Psychology':
        return <PsychologyIcon fontSize="large" />;
      case 'Bolt':
        return <BoltIcon fontSize="large" />;
      case 'Category':
        return <CategoryIcon fontSize="large" />;
    }

    // 2. Slug-based intelligent matching if icon is not set or custom
    if (slug) {
      const lower = slug.toLowerCase();
      if (lower.includes('accueil') || lower.includes('home')) return <HomeIcon fontSize="large" />;
      if (lower.includes('slow') || lower.includes('developpement') || lower.includes('growth')) return <SelfImprovementIcon fontSize="large" />;
      if (lower.includes('resilience') || lower.includes('paix') || lower.includes('peace') || lower.includes('epreuve')) return <SpaIcon fontSize="large" />;
      if (lower.includes('aliment') || lower.includes('saine') || lower.includes('food') || lower.includes('nutrition')) return <EmojiFoodBeverageIcon fontSize="large" />;
      if (lower.includes('avant') || lower.includes('propos') || lower.includes('foreword') || lower.includes('book')) return <MenuBookIcon fontSize="large" />;
    }

    // 3. Robust generic fallback icon for any new category added in the future
    return <SpaIcon fontSize="large" />;
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section with African Slow-Living Background Image */}
      <section className="relative overflow-hidden pt-4 sm:pt-6 pb-12 sm:pb-16">
        <Container maxWidth="lg" className="px-4">
          <div className="relative rounded-3xl sm:rounded-[36px] overflow-hidden shadow-2xl border border-[#E8E0D5] min-h-[460px] sm:min-h-[500px] md:min-h-[540px] flex items-center">
            {/* Background Image Layer */}
            <div
              className="absolute inset-0 bg-cover bg-center sm:bg-[center_top_35%] scale-105 transition-transform duration-1000"
              style={{
                backgroundImage: "url('/hero-african-slow-living.jpg')",
              }}
            />

            {/* Earthy Warm Gradient Overlay Matching Brand Colors */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  linear-gradient(
                    110deg,
                    rgba(34, 23, 17, 0.94) 0%,
                    rgba(44, 30, 23, 0.88) 35%,
                    rgba(60, 40, 30, 0.72) 65%,
                    rgba(40, 26, 18, 0.45) 100%
                  )
                `,
              }}
            />

            {/* Subtle warm terracotta ambient radial glow */}
            <div
              className="absolute -top-24 -left-24 w-96 h-96 rounded-full pointer-events-none opacity-40 blur-3xl"
              style={{ background: 'radial-gradient(circle, #C88A79 0%, transparent 70%)' }}
            />

            {/* Content Layer */}
            <div className="relative z-10 w-full p-6 sm:p-10 md:p-14 lg:p-16 max-w-2xl text-left">
              {/* Badge */}
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Chip
                  label={t.home.heroBadge}
                  icon={<SpaIcon style={{ color: '#E8B2A2' }} />}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(12px)',
                    color: '#FAF5EE',
                    fontWeight: 700,
                    px: 1.5,
                    py: 2,
                    fontSize: '0.8rem',
                    borderRadius: 4,
                    border: '1px solid rgba(255, 255, 255, 0.22)',
                    mb: 2.5,
                  }}
                />
              </motion.div>

              {/* Title - Compact & Reduced Size (Especially on Mobile) */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
                <Typography
                  variant="h1"
                  className="font-serif font-bold text-white tracking-tight leading-snug"
                  sx={{
                    fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.45rem' },
                    lineHeight: { xs: 1.28, sm: 1.25, md: 1.2 },
                    textShadow: '0 2px 12px rgba(0, 0, 0, 0.35)',
                    mb: 2,
                  }}
                >
                  {t.home.heroTitle}
                </Typography>
              </motion.div>

              {/* Subtitle */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                <Typography
                  variant="body1"
                  className="font-sans font-normal leading-relaxed"
                  sx={{
                    color: '#EAE1D7',
                    fontSize: { xs: '0.875rem', sm: '1rem', md: '1.05rem' },
                    lineHeight: 1.6,
                    maxWidth: '560px',
                    mb: 3.5,
                    textShadow: '0 1px 6px rgba(0, 0, 0, 0.25)',
                  }}
                >
                  {t.home.heroSubtitle}
                </Typography>
              </motion.div>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex flex-wrap items-center gap-3 pt-1"
              >
                <Link href={`/${locale}/articles`}>
                  <Button
                    variant="contained"
                    size="medium"
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      bgcolor: '#C88A79',
                      '&:hover': { bgcolor: '#A66E5E' },
                      color: '#FFFFFF',
                      px: { xs: 2.5, sm: 3.5 },
                      py: { xs: 1.1, sm: 1.3 },
                      borderRadius: '14px',
                      fontWeight: 700,
                      fontSize: { xs: '0.85rem', sm: '0.95rem' },
                      boxShadow: '0 8px 20px rgba(200, 138, 121, 0.4)',
                      textTransform: 'none',
                    }}
                  >
                    {t.home.browseCategories}
                  </Button>
                </Link>

                <Link href={`/${locale}/articles?category=developpement-personnel-et-slow-living`}>
                  <Button
                    variant="outlined"
                    size="medium"
                    sx={{
                      color: '#FFFFFF',
                      borderColor: 'rgba(255, 255, 255, 0.45)',
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(8px)',
                      '&:hover': {
                        borderColor: '#FFFFFF',
                        bgcolor: 'rgba(255, 255, 255, 0.18)',
                      },
                      px: { xs: 2.5, sm: 3 },
                      py: { xs: 1.1, sm: 1.3 },
                      borderRadius: '14px',
                      fontWeight: 600,
                      fontSize: { xs: '0.85rem', sm: '0.95rem' },
                      textTransform: 'none',
                    }}
                  >
                    {locale === 'fr' ? 'Slow Living' : 'Mindful Living'}
                  </Button>
                </Link>
              </motion.div>

              {/* Floating Mini Feature Pills */}
              <div className="pt-6 sm:pt-8 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-[#EAE1D7]/90 font-medium">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
                  🌿 {locale === 'fr' ? 'Pleine conscience' : 'Mindfulness'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
                  ☕ {locale === 'fr' ? 'Rituels du matin' : 'Morning rituals'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
                  📖 {locale === 'fr' ? 'Paix & Résilience' : 'Peace & Resilience'}
                </span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Category Grid Section */}
      <Container maxWidth="lg" className="px-4">
        <div className="text-center mb-8">
          <Typography variant="h4" className="font-serif font-bold text-earth-900">
            {t.home.browseCategories}
          </Typography>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((cat, idx) => (
            <Link key={cat.id} href={`/${locale}/articles?category=${cat.slug}`}>
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} whileHover={{ y: -6 }}>
                <Box className="p-5 rounded-2xl bg-white border border-cream-200 text-center flex flex-col items-center gap-3 hover:border-terracotta-400 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-xl bg-sage-50 text-sage-600 flex items-center justify-center">
                    {getCategoryIcon(cat.icon, cat.slug)}
                  </div>
                  <Typography variant="subtitle2" className="font-serif font-bold text-earth-900 text-sm">
                    {getLocalizedField(cat, 'name', locale)}
                  </Typography>
                </Box>
              </motion.div>
            </Link>
          ))}
        </div>
      </Container>

      {/* Featured Hero Article */}
      {featuredPost && (
        <Container maxWidth="lg" className="px-4">
          <div className="mb-6 flex items-center justify-between">
            <Typography variant="h4" className="font-serif font-bold text-earth-900">
              {t.home.editorsPick}
            </Typography>
          </div>
          <ArticleCard post={featuredPost} featured={true} />
        </Container>
      )}

      {/* Trending & Latest Articles */}
      <Container maxWidth="lg" className="px-4 space-y-8">
        <div className="flex items-center justify-between border-b border-cream-200 pb-3">
          <Typography variant="h4" className="font-serif font-bold text-earth-900">
            {t.home.latestArticles}
          </Typography>
          <Link href={`/${locale}/articles`}>
            <Button endIcon={<ArrowForwardIcon />} sx={{ color: '#C88A79' }}>
              View All Articles
            </Button>
          </Link>
        </div>

        {posts.length === 0 ? (
          <Box className="p-12 text-center rounded-3xl bg-white border border-cream-200 shadow-sm space-y-4 max-w-xl mx-auto">
            <SpaIcon sx={{ fontSize: 48, color: '#C88A79' }} />
            <Typography variant="h5" className="font-serif font-bold text-earth-900">
              No articles published yet
            </Typography>
            <Typography variant="body2" className="text-earth-600">
              Sign in as the administrator to start publishing mindful wisdom, reflections, and wellness stories.
            </Typography>
            <div className="pt-2">
              <Link href={`/${locale}/admin/posts/new`}>
                <Button variant="contained" sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' }, borderRadius: 3 }}>
                  Create First Article
                </Button>
              </Link>
            </div>
          </Box>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {posts.map(post => (
              <ArticleCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
