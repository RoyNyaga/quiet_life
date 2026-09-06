'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Typography, TextField, Button, MenuItem, Select, FormControl, InputLabel, Tabs, Tab, Box, Dialog } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useApp } from '@/lib/store';
import { MarkdownRenderer } from '@/components/article/MarkdownRenderer';
import { PostStatus } from '@/types/database';

function PostEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { posts, categories, createPost, updatePost, locale } = useApp();

  const [activeLangTab, setActiveLangTab] = useState<0 | 1>(0);

  // Form Fields
  const [titleEn, setTitleEn] = useState('');
  const [titleFr, setTitleFr] = useState('');
  const [slug, setSlug] = useState('');
  const [excerptEn, setExcerptEn] = useState('');
  const [excerptFr, setExcerptFr] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [contentFr, setContentFr] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [coverImageUrl, setCoverImageUrl] = useState('https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80');
  const [readTime, setReadTime] = useState(5);
  const [status, setStatus] = useState<PostStatus>('published');
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  useEffect(() => {
    if (editId) {
      const existing = posts.find(p => p.id === editId);
      if (existing) {
        setTitleEn(existing.title_en);
        setTitleFr(existing.title_fr || '');
        setSlug(existing.slug);
        setExcerptEn(existing.excerpt_en || '');
        setExcerptFr(existing.excerpt_fr || '');
        setContentEn(existing.content_markdown_en);
        setContentFr(existing.content_markdown_fr || '');
        if (existing.category_id) setCategoryId(existing.category_id);
        if (existing.cover_image_url) setCoverImageUrl(existing.cover_image_url);
        setReadTime(existing.read_time_minutes);
        setStatus(existing.status);
      }
    }
  }, [editId, posts]);

  const handleTitleEnChange = (val: string) => {
    setTitleEn(val);
    if (!editId) {
      const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim() || !contentEn.trim()) return;

    if (editId) {
      updatePost(editId, {
        title_en: titleEn,
        title_fr: titleFr,
        slug: slug || `article-${Date.now()}`,
        excerpt_en: excerptEn,
        excerpt_fr: excerptFr,
        content_markdown_en: contentEn,
        content_markdown_fr: contentFr,
        category_id: categoryId,
        cover_image_url: coverImageUrl,
        read_time_minutes: readTime,
        status,
      });
    } else {
      createPost({
        title_en: titleEn,
        title_fr: titleFr,
        slug: slug || `article-${Date.now()}`,
        excerpt_en: excerptEn,
        excerpt_fr: excerptFr,
        content_markdown_en: contentEn,
        content_markdown_fr: contentFr,
        category_id: categoryId,
        cover_image_url: coverImageUrl,
        read_time_minutes: readTime,
        status,
      });
    }

    router.push(`/${locale}/admin/posts`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h4" className="font-serif font-bold text-earth-900">
            {editId ? 'Edit Article' : 'Create New Article'}
          </Typography>
          <Typography variant="body2" className="text-earth-600">
            Write markdown content, configure cover images, and provide multi-language titles.
          </Typography>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outlined" startIcon={<VisibilityIcon />} onClick={() => setPreviewOpen(true)} sx={{ color: '#5C4438', borderColor: '#E8E2DA' }}>
            Preview Draft
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' } }}>
            Save & Publish
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Metadata Grid */}
        <Box className="p-6 rounded-3xl bg-white border border-cream-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select value={categoryId} label="Category" onChange={e => setCategoryId(e.target.value)}>
                {categories.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name_en}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Publish Status</InputLabel>
              <Select value={status} label="Publish Status" onChange={e => setStatus(e.target.value as PostStatus)}>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="draft">Draft (Unlisted)</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextField fullWidth size="small" label="Custom URL Slug" value={slug} onChange={e => setSlug(e.target.value)} helperText="e.g. slowing-down-daily" />
            <TextField fullWidth size="small" type="number" label="Read Time (Minutes)" value={readTime} onChange={e => setReadTime(Number(e.target.value))} />
            <TextField fullWidth size="small" label="Cover Image URL" value={coverImageUrl} onChange={e => setCoverImageUrl(e.target.value)} />
          </div>
        </Box>

        {/* Localized Content Section */}
        <Box className="p-6 rounded-3xl bg-white border border-cream-200 shadow-sm space-y-4">
          <div className="border-b border-cream-200">
            <Tabs value={activeLangTab} onChange={(_, val) => setActiveLangTab(val)} textColor="primary" indicatorColor="primary">
              <Tab label="English (Default)" />
              <Tab label="French Translation (Optional)" />
            </Tabs>
          </div>

          {activeLangTab === 0 ? (
            <div className="space-y-4 pt-2">
              <TextField fullWidth label="Article Title (English)" value={titleEn} onChange={e => handleTitleEnChange(e.target.value)} required />
              <TextField fullWidth multiline rows={2} label="Short Excerpt (English)" value={excerptEn} onChange={e => setExcerptEn(e.target.value)} />
              <TextField
                fullWidth
                multiline
                rows={12}
                label="Markdown Content (English)"
                value={contentEn}
                onChange={e => setContentEn(e.target.value)}
                required
                helperText="Supports markdown syntax: # Headings, **bold**, > quotes, - lists."
              />
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <TextField fullWidth label="Article Title (French)" value={titleFr} onChange={e => setTitleFr(e.target.value)} />
              <TextField fullWidth multiline rows={2} label="Short Excerpt (French)" value={excerptFr} onChange={e => setExcerptFr(e.target.value)} />
              <TextField
                fullWidth
                multiline
                rows={12}
                label="Markdown Content (French)"
                value={contentFr}
                onChange={e => setContentFr(e.target.value)}
                helperText="Optional translation. Falls back to English if left empty."
              />
            </div>
          )}
        </Box>
      </form>

      {/* Live Draft Preview Modal */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { p: 4, borderRadius: 4 } } }}>
        <div className="space-y-6">
          <Typography variant="caption" className="text-terracotta-600 font-bold uppercase tracking-wider">
            Public Draft Preview
          </Typography>
          <Typography variant="h3" className="font-serif font-bold text-earth-900">
            {titleEn || 'Untitled Article'}
          </Typography>
          {coverImageUrl && <img src={coverImageUrl} alt="" className="w-full h-64 object-cover rounded-2xl" />}
          <MarkdownRenderer content={contentEn || '*No markdown content entered yet.*'} />
          <Button variant="outlined" onClick={() => setPreviewOpen(false)} fullWidth>
            Close Preview
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

export default function PostEditorPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading editor...</div>}>
      <PostEditorContent />
    </Suspense>
  );
}
