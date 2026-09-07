'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Container, Typography, Chip, Avatar, Box, Alert } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useApp } from '@/lib/store';
import { getLocalizedField, DICTIONARY } from '@/lib/i18n';
import { MarkdownRenderer } from '@/components/article/MarkdownRenderer';
import { SocialShareBar } from '@/components/article/SocialShareBar';
import { CommentSection } from '@/components/article/CommentSection';
import { ArticleCard } from '@/components/article/ArticleCard';

export default function ArticleShowPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { posts, categories, locale, incrementViews } = useApp();
  const t = DICTIONARY[locale];

  const post = posts.find(p => p.slug === slug || p.id === slug);

  // Trigger view count increment once on mount
  useEffect(() => {
    if (post) {
      incrementViews(post.id);
    }
  }, [post?.id]);

  if (!post) {
    return (
      <Container maxWidth="md" className="py-20 text-center space-y-4">
        <Typography variant="h4" className="font-serif font-bold text-earth-900">
          Article Not Found
        </Typography>
        <Typography variant="body1" className="text-earth-600">
          The mindful article you are looking for may have been moved or removed.
        </Typography>
        <Link href={`/${locale}/articles`} className="inline-block mt-4 text-terracotta-600 font-bold underline">
          ← Back to All Articles
        </Link>
      </Container>
    );
  }

  const title = getLocalizedField(post, 'title', locale);
  const excerpt = getLocalizedField(post, 'excerpt', locale);
  const contentMarkdown = getLocalizedField(post, 'content_markdown', locale);
  const category = categories.find(c => c.id === post.category_id);
  const categoryName = category ? getLocalizedField(category, 'name', locale) : 'Wellness';
  const authorName = post.profiles?.full_name || 'Andre Roy Nyaga';
  const authorAvatar = post.profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

  const isFrenchFallback = locale === 'fr' && !post.content_markdown_fr;
  const relatedPosts = posts.filter(p => p.id !== post.id && p.category_id === post.category_id).slice(0, 3);

  return (
    <article className="py-10">
      <Container maxWidth="md" className="px-4 space-y-8">
        {/* Navigation Back */}
        <Link href={`/${locale}/articles`} className="inline-flex items-center gap-2 text-earth-600 hover:text-terracotta-600 font-semibold text-sm transition-colors">
          <ArrowBackIcon fontSize="small" /> Back to Articles
        </Link>

        {/* Header Metadata */}
        <div className="space-y-4">
          <Chip label={categoryName} sx={{ bgcolor: '#749D81', color: '#FFFFFF', fontWeight: 700 }} />

          <Typography variant="h3" className="font-serif font-bold text-earth-900 text-3xl sm:text-5xl leading-tight">
            {title}
          </Typography>

          {excerpt && (
            <Typography variant="h6" className="font-sans font-normal text-earth-600 text-lg leading-relaxed">
              {excerpt}
            </Typography>
          )}

          {/* Author & Stats */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-b border-cream-200 py-3">
            <div className="flex items-center gap-3">
              <Avatar src={authorAvatar} sx={{ width: 44, height: 44, border: '2px solid #C88A79' }} />
              <div>
                <Typography variant="subtitle2" className="font-serif font-bold text-earth-900">
                  {authorName}
                </Typography>
                <Typography variant="caption" className="text-earth-500">
                  Mindfulness Contributor
                </Typography>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-earth-600">
              <span className="flex items-center gap-1">
                <CalendarTodayIcon fontSize="small" /> {new Date(post.published_at || post.created_at).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <AccessTimeIcon fontSize="small" /> {post.read_time_minutes} min read
              </span>
              <span className="flex items-center gap-1">
                <VisibilityIcon fontSize="small" /> {post.views_count} views
              </span>
            </div>
          </div>
        </div>

        {/* Fallback translation notice */}
        {isFrenchFallback && (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            {t.article.englishOnlyNotice}
          </Alert>
        )}

        {/* Cover Image */}
        {post.cover_image_url && (
          <div className="w-full h-80 sm:h-96 rounded-3xl overflow-hidden shadow-md">
            <img src={post.cover_image_url} alt={title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Sticky Social Share Bar with Language Prioritization */}
        <div className="sticky top-20 z-10 my-4 flex justify-end">
          <SocialShareBar post={post} />
        </div>

        {/* Article Body */}
        <MarkdownRenderer content={contentMarkdown} />

        {/* Author Bio Footer */}
        <Box className="p-6 rounded-2xl bg-white border border-cream-200 flex items-center gap-4 my-10">
          <Avatar src={authorAvatar} sx={{ width: 64, height: 64 }} />
          <div>
            <Typography variant="subtitle1" className="font-serif font-bold text-earth-900">
              Written by {authorName}
            </Typography>
            <Typography variant="body2" className="text-earth-600 text-sm mt-1">
              Passionate wellness essayist dedicated to exploring peaceful daily habits, single-tasking, and purposeful inner growth.
            </Typography>
          </div>
        </Box>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <div className="mt-12 pt-8 border-t border-cream-200 space-y-6">
            <Typography variant="h5" className="font-serif font-bold text-earth-900">
              {t.article.relatedArticles}
            </Typography>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map(rel => (
                <ArticleCard key={rel.id} post={rel} />
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <CommentSection postId={post.id} />
      </Container>
    </article>
  );
}
