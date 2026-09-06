'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Box, Dialog } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useApp } from '@/lib/store';
import { MarkdownRenderer } from '@/components/article/MarkdownRenderer';
import { Post } from '@/types/database';

export default function AdminPostsPage() {
  const { posts, categories, deletePost } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [previewPost, setPreviewPost] = useState<Post | null>(null);

  const filteredPosts = posts.filter(p => p.title_en.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Typography variant="h4" className="font-serif font-bold text-earth-900">
            Posts Management
          </Typography>
          <Typography variant="body2" className="text-earth-600">
            Create, edit, preview draft, and publish mindful articles.
          </Typography>
        </div>
        <Link href="/admin/posts/new">
          <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' } }}>
            Create Article
          </Button>
        </Link>
      </div>

      <Box className="p-6 rounded-3xl bg-white border border-cream-200 shadow-sm space-y-4">
        <TextField
          size="small"
          placeholder="Filter posts by title..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full sm:w-80"
        />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="font-bold">Article Title</TableCell>
                <TableCell className="font-bold">Category</TableCell>
                <TableCell className="font-bold">Status</TableCell>
                <TableCell className="font-bold">Translations</TableCell>
                <TableCell className="font-bold">Views</TableCell>
                <TableCell className="font-bold text-right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPosts.map(post => {
                const cat = categories.find(c => c.id === post.category_id);
                const hasFr = Boolean(post.title_fr && post.content_markdown_fr);

                return (
                  <TableRow key={post.id} hover>
                    <TableCell className="font-serif font-semibold text-earth-900">{post.title_en}</TableCell>
                    <TableCell>{cat?.name_en || 'Wellness'}</TableCell>
                    <TableCell>
                      <Chip label={post.status} size="small" color={post.status === 'published' ? 'success' : 'warning'} />
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
                      <IconButton component={Link} href={`/admin/posts/new?edit=${post.id}`} size="small">
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
