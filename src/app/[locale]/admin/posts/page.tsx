'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Box, Dialog } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { DICTIONARY, getLocalizedField } from '@/lib/i18n';
import { useApp } from '@/lib/store';
import { MarkdownRenderer } from '@/components/article/MarkdownRenderer';
import { Post } from '@/types/database';

export default function AdminPostsPage() {
  const { posts, categories, deletePost, locale } = useApp();
  const t = DICTIONARY[locale]?.admin || DICTIONARY.en.admin;
  const [searchQuery, setSearchQuery] = useState('');
  const [previewPost, setPreviewPost] = useState<Post | null>(null);

  const filteredPosts = posts.filter(p => {
    // Search across both locales so a post isn't hidden just because its
    // title in the current locale is empty (e.g. created on /fr with no EN title).
    const titleLocale = getLocalizedField(p, 'title', locale).toLowerCase();
    const titleEn = (p.title_en || '').toLowerCase();
    const titleFr = (p.title_fr || '').toLowerCase();
    const searchable = titleLocale || titleEn || titleFr;
    const q = searchQuery.toLowerCase();
    return q === '' || searchable.includes(q) || titleEn.includes(q) || titleFr.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Typography variant="h4" className="font-serif font-bold text-earth-900 text-xl sm:text-2xl md:text-3xl leading-snug">
            {t.posts}
          </Typography>
          <Typography variant="body2" className="text-earth-600">
            {t.postsDesc}
          </Typography>
        </div>
        <Link href={`/${locale}/admin/posts/new`}>
          <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' } }}>
            {t.createPost}
          </Button>
        </Link>
      </div>

      <Box className="p-6 rounded-3xl bg-white border border-cream-200 shadow-sm space-y-4">
        <TextField
          size="small"
          placeholder={t.filterPosts}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full sm:w-80"
        />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="font-bold">{t.articleTitle}</TableCell>
                <TableCell className="font-bold">{t.category}</TableCell>
                <TableCell className="font-bold">{t.status}</TableCell>
                <TableCell className="font-bold">{t.translations}</TableCell>
                <TableCell className="font-bold">{t.views}</TableCell>
                <TableCell className="font-bold text-right">{t.actions}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPosts.map(post => {
                const cat = categories.find(c => c.id === post.category_id);
                const hasFr = Boolean(post.title_fr && post.content_markdown_fr);
                const titleDisplay = getLocalizedField(post, 'title', locale);
                const catDisplay = cat ? getLocalizedField(cat, 'name', locale) : 'Wellness';
                const statusLabel = post.status === 'published' ? t.published : post.status === 'draft' ? t.draft : t.archived;

                return (
                  <TableRow key={post.id} hover>
                    <TableCell className="font-serif font-semibold text-earth-900">{titleDisplay}</TableCell>
                    <TableCell>{catDisplay}</TableCell>
                    <TableCell>
                      <Chip label={statusLabel} size="small" color={post.status === 'published' ? 'success' : 'warning'} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Chip label="EN" size="small" color="primary" />
                        {hasFr && <Chip label="FR" size="small" color="secondary" />}
                      </div>
                    </TableCell>
                    <TableCell>{post.views_count}</TableCell>
                    <TableCell className="text-right">
                      <IconButton onClick={() => setPreviewPost(post)} size="small">
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton component={Link} href={`/${locale}/admin/posts/new?edit=${post.id}`} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => deletePost(post.id)} size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Draft Preview Modal */}
      <Dialog open={Boolean(previewPost)} onClose={() => setPreviewPost(null)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { p: 4, borderRadius: 4 } } }}>
        {previewPost && (
          <div className="space-y-6">
            <Typography variant="caption" className="text-terracotta-600 font-bold uppercase tracking-wider">
              Draft Preview Mode
            </Typography>
            <Typography variant="h3" className="font-serif font-bold text-earth-900">
              {previewPost.title_en}
            </Typography>
            {previewPost.cover_image_url && <img src={previewPost.cover_image_url} alt="" className="w-full h-64 object-cover rounded-2xl" />}
            <MarkdownRenderer content={previewPost.content_markdown_en} />
            <Button variant="outlined" onClick={() => setPreviewPost(null)} fullWidth>
              Close Preview
            </Button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
