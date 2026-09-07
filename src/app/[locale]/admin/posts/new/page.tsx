'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Box,
  Dialog,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useApp } from '@/lib/store';
import { MarkdownRenderer } from '@/components/article/MarkdownRenderer';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { MarkdownEditor } from '@/components/admin/MarkdownEditor';
import { PostStatus } from '@/types/database';

function PostEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { posts, categories, tags, createPost, updatePost, locale } = useApp();

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
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState('');
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
        setReadTime(existing.read_time_minutes || 5);
        setStatus(existing.status);
        if (existing.post_tags && existing.post_tags.length > 0) {
          setSelectedTagIds(existing.post_tags.map(pt => pt.tags?.id).filter(Boolean) as string[]);
        }
      }
    }
  }, [editId, posts]);

  const handleTitleEnChange = (val: string) => {
    setTitleEn(val);
    if (!editId) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleTagsChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedTagIds(typeof value === 'string' ? value.split(',') : value);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!titleEn.trim() || !contentEn.trim()) {
      alert('Please provide at least an English title and markdown content.');
      return;
    }

    const assignedTags = tags
      .filter(t => selectedTagIds.includes(t.id))
      .map(t => ({ tags: t }));

    const postPayload = {
      title_en: titleEn,
      title_fr: titleFr,
      slug: slug || `article-${Date.now()}`,
      excerpt_en: excerptEn,
      excerpt_fr: excerptFr,
      content_markdown_en: contentEn,
      content_markdown_fr: contentFr,
      category_id: categoryId,
      cover_image_url: coverImageUrl || null,
      read_time_minutes: readTime || 5,
      status,
      post_tags: assignedTags,
    };

    if (editId) {
      updatePost(editId, postPayload);
    } else {
      createPost(postPayload);
    }

    router.push(`/${locale}/admin/posts`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href={`/${locale}/admin/posts`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-earth-500 hover:text-terracotta-600 transition-colors mb-1"
          >
            <ArrowBackIcon fontSize="inherit" /> Back to Articles
          </Link>
          <Typography variant="h4" className="font-serif font-bold text-earth-900">
            {editId ? 'Edit Article' : 'Create New Article'}
          </Typography>
          <Typography variant="body2" className="text-earth-600">
            Write markdown content, crop & compress cover images, and publish in English and French.
          </Typography>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={() => setPreviewOpen(true)}
            sx={{ color: '#5C4438', borderColor: '#E8E2DA', textTransform: 'none', fontWeight: 600 }}
          >
            Preview Draft
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{
              bgcolor: '#C88A79',
              '&:hover': { bgcolor: '#A66E5E' },
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
          >
            {editId ? 'Update Article' : 'Save & Publish'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Cover Image Uploader & Compressor */}
        <Box className="p-6 rounded-3xl bg-white border border-cream-200 shadow-sm">
          <ImageUploader
            label="Article Cover Image"
            value={coverImageUrl}
            onChange={url => setCoverImageUrl(url)}
            aspectRatio="16:9"
            folder="covers"
            helperText="Upload a high-resolution cover photo. You can crop it to 16:9 and it will automatically compress to WebP before storing."
          />
        </Box>

        {/* Core Metadata Grid */}
        <Box className="p-6 rounded-3xl bg-white border border-cream-200 shadow-sm space-y-4">
          <Typography variant="subtitle2" className="font-serif font-bold text-earth-900">
            Article Settings & Taxonomy
          </Typography>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryId}
                label="Category"
                onChange={e => setCategoryId(e.target.value)}
              >
                {categories.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name_en}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Publish Status</InputLabel>
              <Select
                value={status}
                label="Publish Status"
                onChange={e => setStatus(e.target.value as PostStatus)}
              >
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="draft">Draft (Unlisted)</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextField
              fullWidth
              size="small"
              label="Custom URL Slug"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              helperText="e.g. slowing-down-daily"
            />
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Read Time (Minutes)"
              value={readTime}
              onChange={e => setReadTime(Math.max(1, Number(e.target.value)))}
              helperText="Auto-calculated from content"
            />
            <FormControl fullWidth size="small">
              <InputLabel>Tags</InputLabel>
              <Select
                multiple
                value={selectedTagIds}
                onChange={handleTagsChange}
                input={<OutlinedInput label="Tags" />}
                renderValue={selected => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map(tagId => {
                      const tag = tags.find(t => t.id === tagId);
                      return (
                        <Chip
                          key={tagId}
                          label={tag ? tag.name_en : tagId}
                          size="small"
                          sx={{ bgcolor: '#F0EAE1', color: '#5C4438', height: 22, fontSize: '0.7rem' }}
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {tags.map(tag => (
                  <MenuItem key={tag.id} value={tag.id}>
                    {tag.name_en}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </Box>

        {/* Localized Content Section */}
        <Box className="p-6 rounded-3xl bg-white border border-cream-200 shadow-sm space-y-5">
          <div className="border-b border-cream-200">
            <Tabs
              value={activeLangTab}
              onChange={(_, val) => setActiveLangTab(val)}
              textColor="primary"
              indicatorColor="primary"
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                },
              }}
            >
              <Tab label="English (Default)" />
              <Tab label="French Translation (Optional)" />
            </Tabs>
          </div>

          {activeLangTab === 0 ? (
            <div className="space-y-4 pt-2">
              <TextField
                fullWidth
                label="Article Title (English)"
                value={titleEn}
                onChange={e => handleTitleEnChange(e.target.value)}
                placeholder="e.g. The Art of Unhurried Mornings"
                required
              />
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Short Excerpt (English)"
                value={excerptEn}
                onChange={e => setExcerptEn(e.target.value)}
                placeholder="A brief summary for previews and social share cards..."
              />
              <div className="space-y-2">
                <Typography variant="caption" className="font-semibold text-earth-700 block">
                  Article Body (Markdown)
                </Typography>
                <MarkdownEditor
                  value={contentEn}
                  onChange={setContentEn}
                  minHeight="380px"
                  onSyncReadTime={mins => setReadTime(mins)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <TextField
                fullWidth
                label="Article Title (French)"
                value={titleFr}
                onChange={e => setTitleFr(e.target.value)}
                placeholder="e.g. L'art des matins paisibles"
              />
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Short Excerpt (French)"
                value={excerptFr}
                onChange={e => setExcerptFr(e.target.value)}
                placeholder="Un bref résumé pour les aperçus et réseaux sociaux..."
              />
              <div className="space-y-2">
                <Typography variant="caption" className="font-semibold text-earth-700 block">
                  Article Body - Translation (Markdown)
                </Typography>
                <MarkdownEditor
                  value={contentFr}
                  onChange={setContentFr}
                  minHeight="380px"
                />
              </div>
            </div>
          )}
        </Box>
      </form>

      {/* Live Draft Preview Modal */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              p: 4,
              borderRadius: 4,
              bgcolor: '#FAF8F5',
              border: '1px solid #EAE3DA',
            },
          },
        }}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-cream-200 pb-3">
            <Typography variant="caption" className="text-terracotta-600 font-bold uppercase tracking-wider">
              Public Draft Preview
            </Typography>
            <Chip label={`${readTime} min read`} size="small" sx={{ bgcolor: '#EFEBE6', color: '#5C4438', fontWeight: 600 }} />
          </div>

          <Typography variant="h3" className="font-serif font-bold text-earth-900">
            {titleEn || 'Untitled Article'}
          </Typography>

          {coverImageUrl && (
            <div className="w-full h-80 rounded-2xl overflow-hidden shadow-md">
              <img src={coverImageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          {excerptEn && (
            <Typography variant="subtitle1" className="text-earth-600 italic border-l-2 border-terracotta-400 pl-4">
              {excerptEn}
            </Typography>
          )}

          <div className="bg-white p-6 rounded-2xl border border-cream-200">
            <MarkdownRenderer content={contentEn || '*No markdown content entered yet.*'} />
          </div>

          <Button
            variant="outlined"
            onClick={() => setPreviewOpen(false)}
            fullWidth
            sx={{ color: '#5C4438', borderColor: '#E8E2DA' }}
          >
            Close Preview
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

export default function PostEditorPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-earth-600">Loading editor...</div>}>
      <PostEditorContent />
    </Suspense>
  );
}
