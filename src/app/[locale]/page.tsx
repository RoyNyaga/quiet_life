'use client';

import Link from 'next/link';
import { Typography, Button, Container, Chip, Box } from '@mui/material';
import SpaIcon from '@mui/icons-material/Spa';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import PsychologyIcon from '@mui/icons-material/Psychology';
import BoltIcon from '@mui/icons-material/Bolt';
import EmojiFoodBeverageIcon from '@mui/icons-material/EmojiFoodBeverage';
import { motion } from 'framer-motion';
import { useApp } from '@/lib/store';
import { getLocalizedField, DICTIONARY } from '@/lib/i18n';
import { ArticleCard } from '@/components/article/ArticleCard';

export default function HomePage() {
  const { locale, posts, categories } = useApp();
  const t = DICTIONARY[locale];

  const featuredPost = posts[0];

  const getCategoryIcon = (iconName?: string | null) => {
    switch (iconName) {
      case 'SelfImprovement':
        return <SelfImprovementIcon fontSize="large" />;
      case 'Psychology':
        return <PsychologyIcon fontSize="large" />;
      case 'Bolt':
        return <BoltIcon fontSize="large" />;
      case 'EmojiFoodBeverage':
        return <EmojiFoodBeverageIcon fontSize="large" />;
      default:
        return <SpaIcon fontSize="large" />;
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-cream-100 to-[#FDFBF7] pt-12 pb-16 border-b border-cream-200">
        <Container maxWidth="lg" className="px-4">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Chip
                label={t.home.heroBadge}
                icon={<SpaIcon style={{ color: '#C88A79' }} />}
                sx={{
                  bgcolor: 'rgba(200,138,121,0.12)',
                  color: '#A66E5E',
                  fontWeight: 700,
                  px: 1,
                  py: 2.5,
                  borderRadius: 4,
                }}
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
              <Typography variant="h2" className="font-serif font-bold text-earth-900 text-3xl sm:text-5xl leading-tight">
                {t.home.heroTitle}
              </Typography>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <Typography variant="h6" className="font-sans font-normal text-earth-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                {t.home.heroSubtitle}
              </Typography>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.3 }} className="pt-2 flex justify-center gap-4">
              <Link href={`/${locale}/articles`}>
                <Button variant="contained" size="large" endIcon={<ArrowForwardIcon />} sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' }, px: 4, py: 1.5, borderRadius: 3 }}>
                  {t.home.browseCategories}
                </Button>
              </Link>
            </motion.div>
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
                    {getCategoryIcon(cat.icon)}
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
