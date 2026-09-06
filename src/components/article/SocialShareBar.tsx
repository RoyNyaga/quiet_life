'use client';

import { useState, useEffect } from 'react';
import { IconButton, Tooltip, Snackbar, Alert, Box, Chip, Typography } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import FacebookIcon from '@mui/icons-material/Facebook';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LanguageIcon from '@mui/icons-material/Language';
import { Post, Locale } from '@/types/database';
import { useApp } from '@/lib/store';
import { getLocalizedField } from '@/lib/i18n';
import { BookmarkDrawer } from '../drawers/BookmarkDrawer';

interface SocialShareBarProps {
  post: Post;
}

export function SocialShareBar({ post }: SocialShareBarProps) {
  const { locale, readingListItems, togglePostLike } = useApp();
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [shareLocale, setShareLocale] = useState<Locale>(locale);

  useEffect(() => {
    setShareLocale(locale);
  }, [locale]);

  const hasFrenchTranslation = Boolean(post.title_fr && post.content_markdown_fr);
  const title = getLocalizedField(post, 'title', shareLocale);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${origin}/${shareLocale}/articles/${post.slug}`;

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} - ${shareUrl}`)}`;
    window.open(url, '_blank');
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(shareUrl);
      setToastMsg(`Copied ${shareLocale.toUpperCase()} link to clipboard!`);
    }
  };

  const isSaved = readingListItems.some(i => i.post_id === post.id);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Box className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-cream-200 shadow-sm w-fit">
          <Tooltip title="Like Article">
            <IconButton onClick={() => togglePostLike(post.id)} color={post.user_has_liked ? 'error' : 'default'} size="small">
              <FavoriteIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={`Share on WhatsApp (${shareLocale.toUpperCase()})`}>
            <IconButton onClick={handleShareWhatsApp} sx={{ color: '#25D366' }} size="small">
              <WhatsAppIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={`Share on Facebook (${shareLocale.toUpperCase()})`}>
            <IconButton onClick={handleShareFacebook} sx={{ color: '#1877F2' }} size="small">
              <FacebookIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={`Copy ${shareLocale.toUpperCase()} Link`}>
            <IconButton onClick={handleCopyLink} sx={{ color: '#5C4438' }} size="small">
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Save to Reading List">
            <IconButton onClick={() => setBookmarkOpen(true)} sx={{ color: isSaved ? '#C88A79' : '#5C4438' }} size="small">
              {isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Language Prioritization Toggle */}
        <Box className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-cream-50 border border-cream-200 text-xs text-earth-700">
          <LanguageIcon fontSize="small" sx={{ color: '#8A6E60' }} />
          <span className="font-semibold text-[11px] uppercase tracking-wider text-earth-600">Share as:</span>
          <Chip
            label="EN"
            size="small"
            onClick={() => setShareLocale('en')}
            sx={{
              height: 22,
              fontSize: '0.75rem',
              fontWeight: 700,
              bgcolor: shareLocale === 'en' ? '#C88A79' : 'transparent',
              color: shareLocale === 'en' ? '#FFFFFF' : '#6E5549',
              cursor: 'pointer',
            }}
          />
          {hasFrenchTranslation && (
            <Chip
              label="FR"
              size="small"
              onClick={() => setShareLocale('fr')}
              sx={{
                height: 22,
                fontSize: '0.75rem',
                fontWeight: 700,
                bgcolor: shareLocale === 'fr' ? '#749D81' : 'transparent',
                color: shareLocale === 'fr' ? '#FFFFFF' : '#6E5549',
                cursor: 'pointer',
              }}
            />
          )}
        </Box>
      </div>

      <BookmarkDrawer open={bookmarkOpen} onClose={() => setBookmarkOpen(false)} targetPost={post} />

      <Snackbar open={Boolean(toastMsg)} autoHideDuration={3000} onClose={() => setToastMsg('')}>
        <Alert severity="success" sx={{ width: '100%' }}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </>
  );
}
