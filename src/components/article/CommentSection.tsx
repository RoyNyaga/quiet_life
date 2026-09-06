'use client';

import { useState } from 'react';
import { Typography, TextField, Button, Avatar, IconButton, Box } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ReplyIcon from '@mui/icons-material/Reply';
import { useApp } from '@/lib/store';
import { Comment } from '@/types/database';
import { DICTIONARY } from '@/lib/i18n';

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { locale, comments, addComment, toggleCommentLike, user } = useApp();
  const t = DICTIONARY[locale];

  // Comment Form State
  const [content, setContent] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [replyParentId, setReplyParentId] = useState<string | null>(null);

  const postComments = comments.filter(c => c.post_id === postId && !c.parent_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    addComment({
      post_id: postId,
      content: content.trim(),
      guest_name: user ? user.full_name : guestName.trim() || 'Mindful Guest',
      guest_email: user ? undefined : guestEmail.trim(),
      parent_id: replyParentId,
    });

    setContent('');
    setGuestName('');
    setGuestEmail('');
    setReplyParentId(null);
  };

  return (
    <div className="mt-12 pt-8 border-t border-cream-200">
      <Typography variant="h5" className="font-serif font-bold text-earth-900 mb-6">
        {t.article.comments} ({comments.filter(c => c.post_id === postId).length})
      </Typography>

      {/* Main Comment Box */}
      <Box className="p-6 rounded-2xl bg-white border border-cream-200 shadow-sm mb-8">
        <Typography variant="subtitle1" className="font-serif font-bold text-earth-900 mb-3">
          {t.article.leaveComment}
        </Typography>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!user && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                fullWidth
                size="small"
                label={t.article.guestName}
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                required
              />
              <TextField
                fullWidth
                size="small"
                type="email"
                label={t.article.guestEmail}
                value={guestEmail}
                onChange={e => setGuestEmail(e.target.value)}
                required
              />
            </div>
          )}

          {user && (
            <div className="flex items-center gap-3 mb-2">
              <Avatar src={user.avatar_url || undefined} sx={{ width: 32, height: 32 }}>
                {user.full_name.charAt(0)}
              </Avatar>
              <Typography variant="body2" className="font-semibold text-earth-900">
                Commenting as {user.full_name}
              </Typography>
            </div>
          )}

          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder={t.article.commentPlaceholder}
            value={content}
            onChange={e => setContent(e.target.value)}
            required
          />

          <div className="flex items-center justify-between">
            {replyParentId && (
              <Button size="small" onClick={() => setReplyParentId(null)} sx={{ color: '#8C7A70' }}>
                Cancel Reply
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' }, ml: 'auto' }}
            >
              {t.article.submitComment}
            </Button>
          </div>
        </form>
      </Box>

      {/* Comment List */}
      <div className="space-y-4">
        {postComments.map(comment => {
          const replies = comments.filter(c => c.parent_id === comment.id);
          const authorName = comment.profiles ? comment.profiles.full_name : comment.guest_name || 'Anonymous Reader';
          const avatar = comment.profiles?.avatar_url;

          return (
            <div key={comment.id} className="p-4 rounded-xl bg-white border border-cream-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar src={avatar || undefined} sx={{ bgcolor: '#C88A79', width: 36, height: 36 }}>
                    {authorName.charAt(0)}
                  </Avatar>
                  <div>
                    <Typography variant="subtitle2" className="font-serif font-bold text-earth-900">
                      {authorName}
                    </Typography>
                    <Typography variant="caption" className="text-earth-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </Typography>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <IconButton onClick={() => toggleCommentLike(comment.id)} size="small" color={comment.user_has_liked ? 'error' : 'default'}>
                    <FavoriteIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="caption" className="text-earth-600 font-semibold">
                    {comment.likes_count}
                  </Typography>
                  <IconButton onClick={() => setReplyParentId(comment.id)} size="small" sx={{ ml: 1, color: '#5C4438' }}>
                    <ReplyIcon fontSize="small" />
                  </IconButton>
                </div>
              </div>

              <Typography variant="body2" className="text-earth-700 mt-2 pl-12 leading-relaxed">
                {comment.content}
              </Typography>

              {/* Nested Reply List */}
              {replies.length > 0 && (
                <div className="mt-3 ml-12 space-y-3 pt-3 border-t border-cream-100">
                  {replies.map(reply => (
                    <div key={reply.id} className="p-3 rounded-lg bg-cream-50">
                      <div className="flex items-center justify-between">
                        <Typography variant="caption" className="font-serif font-bold text-earth-900">
                          {reply.profiles ? reply.profiles.full_name : reply.guest_name}
                        </Typography>
                        <IconButton onClick={() => toggleCommentLike(reply.id)} size="small" color={reply.user_has_liked ? 'error' : 'default'}>
                          <FavoriteIcon fontSize="small" />
                        </IconButton>
                      </div>
                      <Typography variant="body2" className="text-earth-700 text-xs mt-1">
                        {reply.content}
                      </Typography>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
