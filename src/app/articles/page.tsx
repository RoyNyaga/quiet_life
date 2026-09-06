'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Container, Typography, TextField, InputAdornment, Chip, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useApp } from '@/lib/store';
import { getLocalizedField, DICTIONARY } from '@/lib/i18n';
import { ArticleCard } from '@/components/article/ArticleCard';

function ArticlesContent() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get('category');
  const { locale, posts, categories } = useApp();
  const t = DICTIONARY[locale];

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'likes'>('latest');

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // Category Filter
      if (selectedCategory !== 'all') {
        const catObj = categories.find(c => c.slug === selectedCategory || c.id === selectedCategory);
        if (catObj && post.category_id !== catObj.id) return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const title = getLocalizedField(post, 'title', locale).toLowerCase();
        const excerpt = getLocalizedField(post, 'excerpt', locale).toLowerCase();
        if (!title.includes(q) && !excerpt.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'popular') return b.views_count - a.views_count;
      if (sortBy === 'likes') return (b.likes_count || 0) - (a.likes_count || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [posts, selectedCategory, searchQuery, sortBy, categories, locale]);

  return (
    <Container maxWidth="lg" className="py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <Typography variant="h3" className="font-serif font-bold text-earth-900">
          {t.nav.articles}
        </Typography>
        <Typography variant="body1" className="text-earth-600 max-w-xl mx-auto">
          Explore thoughtful reflections, practical strategies, and guided practices for mindful living.
        </Typography>
      </div>

      {/* Filter Toolbar */}
      <Box className="p-4 rounded-2xl bg-white border border-cream-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
          <TextField
            size="small"
            placeholder={t.nav.searchPlaceholder}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full sm:w-80"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#C88A79' }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 3 },
              },
            }}
          />

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <FormControl size="small" className="w-40">
              <InputLabel>Sort By</InputLabel>
              <Select value={sortBy} label="Sort By" onChange={e => setSortBy(e.target.value as any)} sx={{ borderRadius: 3 }}>
                <MenuItem value="latest">Latest</MenuItem>
                <MenuItem value="popular">Most Popular</MenuItem>
                <MenuItem value="likes">Most Liked</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-cream-100">
          <Typography variant="caption" className="text-earth-500 font-bold uppercase tracking-wider mr-1">
            Categories:
          </Typography>
          <Chip
            label="All Topics"
            onClick={() => setSelectedCategory('all')}
            size="small"
            sx={{
              bgcolor: selectedCategory === 'all' ? '#C88A79' : '#FDFBF7',
              color: selectedCategory === 'all' ? '#FFFFFF' : '#3D2E26',
              fontWeight: 600,
            }}
          />
          {categories.map(cat => {
            const isSelected = selectedCategory === cat.slug || selectedCategory === cat.id;
            return (
              <Chip
                key={cat.id}
                label={getLocalizedField(cat, 'name', locale)}
                onClick={() => setSelectedCategory(isSelected ? 'all' : cat.slug)}
                size="small"
                sx={{
                  bgcolor: isSelected ? '#749D81' : '#FDFBF7',
                  color: isSelected ? '#FFFFFF' : '#3D2E26',
                  fontWeight: 600,
                }}
              />
            );
          })}
        </div>
      </Box>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <Typography variant="body2" className="text-earth-600 font-semibold">
          Showing {filteredPosts.length} articles
        </Typography>
      </div>

      {/* Articles Grid */}
      {filteredPosts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-cream-200 my-8">
          <Typography variant="h6" className="font-serif text-earth-600 italic">
            No articles match your current search filters.
          </Typography>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredPosts.map(post => (
            <ArticleCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </Container>
  );
}

export default function ArticlesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading articles...</div>}>
      <ArticlesContent />
    </Suspense>
  );
}
