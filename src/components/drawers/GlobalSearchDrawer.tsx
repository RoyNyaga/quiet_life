'use client';

import { useState } from 'react';
import { Drawer, TextField, InputAdornment, Typography, IconButton, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { getLocalizedField, DICTIONARY } from '@/lib/i18n';

interface GlobalSearchDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearchDrawer({ open, onClose }: GlobalSearchDrawerProps) {
  const { posts, categories, locale } = useApp();
  const t = DICTIONARY[locale];
  const [query, setQuery] = useState('');

  const filteredPosts = posts.filter(p => {
    const title = getLocalizedField(p, 'title', locale).toLowerCase();
    const excerpt = getLocalizedField(p, 'excerpt', locale).toLowerCase();
    const q = query.toLowerCase().trim();
    return title.includes(q) || excerpt.includes(q);
  });

  return (
    <Drawer
      anchor="top"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { p: 4, background: '#FDFBF7', maxHeight: '85vh' } } }}
    >
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <Typography variant="h6" className="font-serif font-bold text-earth-800">
            Search Quiet Life
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>

        <TextField
          fullWidth
          autoFocus
          placeholder={t.nav.searchPlaceholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#C88A79' }} />
                </InputAdornment>
              ),
              sx: { borderRadius: 4, bgcolor: '#FFFFFF' },
            },
          }}
        />

        {/* Quick Categories */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <Typography variant="caption" className="text-earth-500 font-semibold uppercase tracking-wider">
            Topics:
          </Typography>
          {categories.map(cat => (
            <Chip
              key={cat.id}
              label={getLocalizedField(cat, 'name', locale)}
              onClick={() => {
                setQuery(getLocalizedField(cat, 'name', locale));
              }}
              size="small"
              sx={{ bgcolor: 'rgba(139,175,150,0.15)', color: '#587C64', fontWeight: 600 }}
            />
          ))}
        </div>

        {/* Search Results */}
        <div className="mt-6 space-y-4 max-h-96 overflow-y-auto pr-2">
          {query.trim() && filteredPosts.length === 0 && (
            <Typography variant="body2" className="text-earth-500 italic py-4 text-center">
              No mindful articles match your search.
            </Typography>
          )}

          {filteredPosts.map(post => (
            <Link key={post.id} href={`/articles/${post.slug}`} onClick={onClose} className="block group">
              <div className="p-4 rounded-2xl bg-white border border-cream-200 hover:border-terracotta-300 transition-all flex items-center gap-4">
                <img src={post.cover_image_url || ''} alt="" className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1 overflow-hidden">
                  <Typography variant="subtitle1" className="font-serif font-bold text-earth-900 group-hover:text-terracotta-600 transition-colors">
                    {getLocalizedField(post, 'title', locale)}
                  </Typography>
                  <Typography variant="body2" className="text-earth-600 line-clamp-1">
                    {getLocalizedField(post, 'excerpt', locale)}
                  </Typography>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Drawer>
  );
}
