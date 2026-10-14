'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Typography,
  Button,
  Box,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import { motion } from 'framer-motion';

import { useApp } from '@/lib/store';
import { useReadingList, useReadingListArticles } from '@/features/readingLists';
import { ArticleCard } from '@/components/article/ArticleCard';
import { DICTIONARY, getLocalizedField } from '@/lib/i18n';

export default function ReadingListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params?.id as string;
  const { locale, user } = useApp();
  const t = DICTIONARY[locale];

  const { data: readingList, isLoading: isListLoading } = useReadingList(listId);
  const { data: articles = [], isLoading: isArticlesLoading } = useReadingListArticles(listId);

  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Total reading time calculation
  const totalReadTime = useMemo(() => {
    return articles.reduce((sum, a) => sum + (a.read_time_minutes || 5), 0);
  }, [articles]);

  // Client-side search filtering within the collection
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles;
    const q = searchQuery.toLowerCase();
    return articles.filter(article => {
      const title = getLocalizedField(article, 'title', locale).toLowerCase();
      const excerpt = (getLocalizedField(article, 'excerpt', locale) || '').toLowerCase();
      return title.includes(q) || excerpt.includes(q);
    });
  }, [articles, searchQuery, locale]);

  const handleShareList = () => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setToastMsg(
        locale === 'fr'
          ? 'Lien de la collection copié dans le presse-papiers !'
          : 'Collection link copied to clipboard!'
      );
    }
  };

  const isOwner = user && readingList && user.id === readingList.user_id;

  // Loading state
  if (isListLoading || isArticlesLoading) {
    return (
      <Container maxWidth="lg" className="py-24 text-center space-y-4">
        <CircularProgress sx={{ color: '#C88A79' }} />
        <Typography variant="body2" className="text-earth-600">
          {locale === 'fr' ? 'Chargement de votre collection...' : 'Opening mindful collection...'}
        </Typography>
      </Container>
    );
  }

  // Not found state
  if (!readingList) {
    return (
      <Container maxWidth="md" className="py-20 text-center space-y-5">
        <Box className="p-12 rounded-3xl bg-white border border-cream-200 max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-terracotta-600 mx-auto flex items-center justify-center mb-4">
            <BookmarkIcon fontSize="large" />
          </div>
          <Typography variant="h5" className="font-serif font-bold text-earth-900 mb-2">
            {locale === 'fr' ? 'Collection Introuvable' : 'Collection Not Found'}
          </Typography>
          <Typography variant="body1" className="text-earth-600 mb-6 leading-relaxed">
            {locale === 'fr'
              ? 'La collection de lecture que vous recherchez a peut-être été supprimée ou n’existe pas.'
              : 'The mindful reading collection you are looking for may have been removed or does not exist.'}
          </Typography>
          <Link href={`/${locale}/profile?tab=reading-list`}>
            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' }, px: 3, py: 1, borderRadius: '12px' }}
            >
              {locale === 'fr' ? 'Retour aux collections' : 'Back to Collections'}
            </Button>
          </Link>
        </Box>
      </Container>
    );
  }

  return (
    <div className="py-10 space-y-8 min-h-screen">
      <Container maxWidth="lg" className="space-y-8">
        {/* Top Navigation & Back Button */}
        <div className="flex items-center justify-between">
          <Link
            href={`/${locale}/profile?tab=reading-list`}
            className="inline-flex items-center gap-2 text-earth-600 hover:text-terracotta-600 font-semibold text-sm transition-colors group"
          >
            <ArrowBackIcon fontSize="small" className="group-hover:-translate-x-1 transition-transform" />
            <span>{locale === 'fr' ? 'Retour aux collections' : 'Back to Collections'}</span>
          </Link>

          <div className="flex items-center gap-2">
            <Tooltip title={locale === 'fr' ? 'Partager la collection' : 'Share collection'}>
              <IconButton
                onClick={handleShareList}
                size="small"
                sx={{
                  bgcolor: 'white',
                  border: '1px solid #E8E2DA',
                  color: '#5C4438',
                  '&:hover': { bgcolor: '#FAF7F2', borderColor: '#C88A79' },
                }}
              >
                <ShareRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {isOwner && (
              <Link href={`/${locale}/profile?tab=reading-list&list=${readingList.id}`}>
                <Tooltip title={locale === 'fr' ? 'Gérer dans le profil' : 'Manage in profile'}>
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: 'white',
                      border: '1px solid #E8E2DA',
                      color: '#5C4438',
                      '&:hover': { bgcolor: '#FAF7F2', borderColor: '#C88A79' },
                    }}
                  >
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Link>
            )}
          </div>
        </div>

        {/* Collection Header Banner */}
        <Box className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-cream-100 via-cream-50 to-sage-50 border border-cream-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Chip
                  icon={readingList.is_private ? <LockIcon sx={{ fontSize: '0.9rem !important' }} /> : <PublicIcon sx={{ fontSize: '0.9rem !important' }} />}
                  label={
                    readingList.is_private
                      ? locale === 'fr' ? 'Collection Privée' : 'Private Collection'
                      : locale === 'fr' ? 'Collection Publique' : 'Public Collection'
                  }
                  size="small"
                  sx={{
                    bgcolor: readingList.is_private ? '#F7EBE8' : '#E8F5E9',
                    color: readingList.is_private ? '#C88A79' : '#2E7D32',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    borderRadius: '8px',
                  }}
                />
                <span className="text-xs text-earth-500">•</span>
                <span className="text-xs text-earth-500 font-medium">
                  {locale === 'fr' ? 'Créée le ' : 'Created '}
                  {new Date(readingList.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <Typography variant="h3" className="font-serif font-bold text-earth-900 tracking-tight leading-snug">
                {readingList.name}
              </Typography>

              {readingList.description && (
                <Typography variant="body1" className="text-earth-600 leading-relaxed text-base sm:text-lg">
                  {readingList.description}
                </Typography>
              )}
            </div>

            {/* Quick Metrics Summary Pill */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 bg-white/80 backdrop-blur-sm border border-cream-200 px-5 py-4 rounded-2xl shadow-sm self-start md:self-auto">
              <div className="flex items-center gap-3 pr-4 border-r border-cream-200">
                <MenuBookRoundedIcon sx={{ color: '#C88A79' }} />
                <div>
                  <Typography variant="caption" className="text-earth-500 font-medium block">
                    {locale === 'fr' ? 'Articles' : 'Saved'}
                  </Typography>
                  <Typography variant="body1" className="font-serif font-bold text-earth-900">
                    {articles.length} {articles.length === 1 ? 'article' : 'articles'}
                  </Typography>
                </div>
              </div>

              <div className="flex items-center gap-3 pl-1">
                <AccessTimeRoundedIcon sx={{ color: '#749D81' }} />
                <div>
                  <Typography variant="caption" className="text-earth-500 font-medium block">
                    {locale === 'fr' ? 'Temps de lecture' : 'Read Time'}
                  </Typography>
                  <Typography variant="body1" className="font-serif font-bold text-earth-900">
                    {totalReadTime} min
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        </Box>

        {/* Search & Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Typography variant="h6" className="font-serif font-bold text-earth-900">
              {locale === 'fr' ? 'Articles dans cette collection' : 'Articles in this Collection'}
            </Typography>
            <span className="text-xs bg-cream-200/60 text-earth-700 font-bold px-2 py-0.5 rounded-full">
              {filteredArticles.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {articles.length > 3 && (
              <TextField
                size="small"
                placeholder={locale === 'fr' ? 'Filtrer les articles...' : 'Filter articles...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon fontSize="small" sx={{ color: '#8C776D' }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  width: { xs: '100%', sm: 220 },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    bgcolor: '#FFFFFF',
                  },
                }}
              />
            )}

            <Link href={`/${locale}/articles`}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ExploreOutlinedIcon />}
                sx={{
                  borderColor: '#C88A79',
                  color: '#C88A79',
                  borderRadius: '12px',
                  fontWeight: 600,
                  textTransform: 'none',
                  px: 2,
                  py: 0.8,
                  '&:hover': {
                    borderColor: '#A66E5E',
                    bgcolor: 'rgba(200, 138, 121, 0.06)',
                  },
                }}
              >
                {locale === 'fr' ? 'Ajouter des articles' : 'Discover More'}
              </Button>
            </Link>
          </div>
        </div>

        {/* Articles Grid or Empty State */}
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map(post => (
              <motion.div key={post.id} layout initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                <ArticleCard post={post} />
              </motion.div>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <Box className="p-12 text-center rounded-3xl bg-white border border-cream-200">
            <Typography variant="body1" className="text-earth-600 italic">
              {locale === 'fr'
                ? `Aucun article ne correspond à "${searchQuery}".`
                : `No articles match "${searchQuery}".`}
            </Typography>
            <Button
              variant="text"
              onClick={() => setSearchQuery('')}
              sx={{ color: '#C88A79', mt: 1, textTransform: 'none', fontWeight: 600 }}
            >
              {locale === 'fr' ? 'Effacer le filtre' : 'Clear search filter'}
            </Button>
          </Box>
        ) : (
          <Box className="p-12 sm:p-16 text-center rounded-3xl bg-white border border-cream-200 max-w-xl mx-auto shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-cream-100 text-terracotta-600 mx-auto flex items-center justify-center">
              <BookmarkIcon fontSize="large" />
            </div>
            <Typography variant="h5" className="font-serif font-bold text-earth-900">
              {locale === 'fr' ? 'Cette collection est paisible et vide' : 'Your collection is peaceful and empty'}
            </Typography>
            <Typography variant="body2" className="text-earth-600 leading-relaxed max-w-md mx-auto">
              {locale === 'fr'
                ? 'Enregistrez des essais et réflexions pour créer votre sanctuaire personnel de lecture.'
                : 'Save mindful essays, daily reflections, and quiet philosophies to curate your personal haven of calm.'}
            </Typography>
            <div className="pt-2">
              <Link href={`/${locale}/articles`}>
                <Button
                  variant="contained"
                  startIcon={<ExploreOutlinedIcon />}
                  sx={{
                    bgcolor: '#C88A79',
                    '&:hover': { bgcolor: '#A66E5E' },
                    px: 3.5,
                    py: 1.2,
                    borderRadius: '12px',
                    fontWeight: 600,
                    textTransform: 'none',
                  }}
                >
                  {locale === 'fr' ? 'Explorer les articles' : 'Browse Mindful Articles'}
                </Button>
              </Link>
            </div>
          </Box>
        )}
      </Container>

      <Snackbar open={Boolean(toastMsg)} autoHideDuration={3500} onClose={() => setToastMsg('')}>
        <Alert severity="success" sx={{ width: '100%', borderRadius: 3 }}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </div>
  );
}
