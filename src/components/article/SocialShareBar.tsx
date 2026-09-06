'use client';

import { useState } from 'react';
import { IconButton, Tooltip, Snackbar, Alert, Box } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import FacebookIcon from '@mui/icons-material/Facebook';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Post } from '@/types/database';
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

  const title = getLocalizedField(post, 'title', locale);
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

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
      setToastMsg('Article link copied to clipboard!');
    }
  };

  const isSaved = readingListItems.some(i => i.post_id === post.id);

  return (
    <>
      <Box className="flex items-center gap-2 p-2 rounded-2xl bg-white border border-cream-200 shadow-sm w-fit">
        <Tooltip title="Like Article">
          <IconButton onClick={() => togglePostLike(post.id)} color={post.user_has_liked ? 'error' : 'default'}>
            <FavoriteIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Share on WhatsApp">
          <IconButton onClick={handleShareWhatsApp} sx={{ color: '#25D366' }}>
            <WhatsAppIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Share on Facebook">
          <IconButton onClick={handleShareFacebook} sx={{ color: '#1877F2' }}>
            <FacebookIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Copy Link">
          <IconButton onClick={handleCopyLink} sx={{ color: '#5C4438' }}>
            <ContentCopyIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Save to Reading List">
          <IconButton onClick={() => setBookmarkOpen(true)} sx={{ color: isSaved ? '#C88A79' : '#5C4438' }}>
            {isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <BookmarkDrawer open={bookmarkOpen} onClose={() => setBookmarkOpen(false)} targetPost={post} />

      <Snackbar open={Boolean(toastMsg)} autoHideDuration={3000} onClose={() => setToastMsg('')}>
        <Alert severity="success" sx={{ width: '100%' }}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </>
  );
}
