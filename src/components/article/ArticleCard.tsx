'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, Typography, Chip, Button, IconButton, Box } from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import FavoriteIcon from '@mui/icons-material/Favorite';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { motion } from 'framer-motion';
import { Post } from '@/types/database';
import { useApp } from '@/lib/store';
import { getLocalizedField, DICTIONARY } from '@/lib/i18n';
import { BookmarkDrawer } from '../drawers/BookmarkDrawer';

interface ArticleCardProps {
  post: Post;
  featured?: boolean;
}

export function ArticleCard({ post, featured = false }: ArticleCardProps) {
  const { locale, categories, readingListItems, togglePostLike } = useApp();
  const t = DICTIONARY[locale];
  const [bookmarkOpen, setBookmarkOpen] = useState(false);

  const title = getLocalizedField(post, 'title', locale);
  const excerpt = getLocalizedField(post, 'excerpt', locale);
  const category = categories.find(c => c.id === post.category_id);
  const categoryName = category ? getLocalizedField(category, 'name', locale) : 'Wellness';

  const isSaved = readingListItems.some(item => item.post_id === post.id);

  if (featured) {
    return (
      <>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }}>
          <Card className="overflow-hidden rounded-3xl border border-cream-200 bg-white grid grid-cols-1 md:grid-cols-2 gap-0 shadow-lg">
            <div className="relative h-64 md:h-full min-h-[320px]">
              <img src={post.cover_image_url || ''} alt={title} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4">
                <Chip label={categoryName} sx={{ bgcolor: '#749D81', color: '#FFFFFF', fontWeight: 700 }} />
              </div>
            </div>
            <div className="p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 text-xs text-earth-500 mb-3">
                  <span className="flex items-center gap-1">
                    <AccessTimeIcon fontSize="small" /> {post.read_time_minutes} {t.article.minRead}
                  </span>
                  <span className="flex items-center gap-1">
                    <VisibilityIcon fontSize="small" /> {post.views_count} {t.article.views}
                  </span>
                </div>
                <Link href={`/${locale}/articles/${post.slug}`}>
                  <Typography variant="h4" className="font-serif font-bold text-earth-900 hover:text-terracotta-600 transition-colors mb-3 line-clamp-2">
                    {title}
                  </Typography>
                </Link>
                <Typography variant="body1" className="text-earth-600 line-clamp-3 mb-6 leading-relaxed">
                  {excerpt}
                </Typography>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-cream-200">
                <Link href={`/${locale}/articles/${post.slug}`}>
                  <Button variant="contained" sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' } }}>
                    {t.home.readArticle}
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <IconButton onClick={() => togglePostLike(post.id)} color={post.user_has_liked ? 'error' : 'default'}>
                    <FavoriteIcon />
                  </IconButton>
                  <IconButton onClick={() => setBookmarkOpen(true)} sx={{ color: isSaved ? '#C88A79' : '#5C4438' }}>
                    {isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                  </IconButton>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
        <BookmarkDrawer open={bookmarkOpen} onClose={() => setBookmarkOpen(false)} targetPost={post} />
      </>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }} className="h-full">
        <Card className="overflow-hidden rounded-2xl border border-cream-200 bg-white flex flex-col h-full hover:shadow-xl transition-all">
          <div className="relative h-48 w-full">
            <img src={post.cover_image_url || ''} alt={title} className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3">
              <Chip label={categoryName} size="small" sx={{ bgcolor: '#749D81', color: '#FFFFFF', fontWeight: 600, fontSize: '0.75rem' }} />
            </div>
          </div>

          <div className="p-5 flex flex-col flex-1 justify-between">
            <div>
              <div className="flex items-center gap-3 text-xs text-earth-500 mb-2">
                <span>{post.read_time_minutes} min read</span>
                <span>•</span>
                <span>{post.views_count} views</span>
              </div>
              <Link href={`/${locale}/articles/${post.slug}`}>
                <Typography variant="h6" className="font-serif font-bold text-earth-900 hover:text-terracotta-600 transition-colors mb-2 line-clamp-2 leading-snug">
                  {title}
                </Typography>
              </Link>
              <Typography variant="body2" className="text-earth-600 line-clamp-3 mb-4 leading-relaxed">
                {excerpt}
              </Typography>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-cream-200 mt-auto">
              <Link href={`/${locale}/articles/${post.slug}`}>
                <Typography variant="caption" className="font-sans font-bold text-terracotta-600 uppercase tracking-wider hover:underline">
                  {t.home.readArticle} →
                </Typography>
              </Link>
              <div className="flex items-center gap-1">
                <IconButton onClick={() => togglePostLike(post.id)} size="small" color={post.user_has_liked ? 'error' : 'default'}>
                  <FavoriteIcon fontSize="small" />
                </IconButton>
                <IconButton onClick={() => setBookmarkOpen(true)} size="small" sx={{ color: isSaved ? '#C88A79' : '#5C4438' }}>
                  {isSaved ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                </IconButton>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
      <BookmarkDrawer open={bookmarkOpen} onClose={() => setBookmarkOpen(false)} targetPost={post} />
    </>
  );
}
