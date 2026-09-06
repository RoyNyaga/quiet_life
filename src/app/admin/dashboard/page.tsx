'use client';

import Link from 'next/link';
import { Typography, Button, Box, Grid, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import AddIcon from '@mui/icons-material/Add';
import { useApp } from '@/lib/store';

export default function AdminDashboardPage() {
  const { posts, subscriptions, categories } = useApp();

  const totalViews = posts.reduce((sum, p) => sum + p.views_count, 0);
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count || 0), 0);

  const stats = [
    { label: 'Total Articles', value: posts.length, icon: <ArticleIcon fontSize="large" sx={{ color: '#C88A79' }} /> },
    { label: 'Total Views', value: totalViews.toLocaleString(), icon: <VisibilityIcon fontSize="large" sx={{ color: '#749D81' }} /> },
    { label: 'Total Likes', value: totalLikes, icon: <FavoriteIcon fontSize="large" sx={{ color: '#E25B45' }} /> },
    { label: 'Subscribers', value: subscriptions.length, icon: <MarkEmailReadIcon fontSize="large" sx={{ color: '#587C64' }} /> },
  ];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Typography variant="h4" className="font-serif font-bold text-earth-900">
            Admin Dashboard
          </Typography>
          <Typography variant="body2" className="text-earth-600">
            Overview of Quiet Life publication metrics and content performance.
          </Typography>
        </div>
        <Link href="/admin/posts/new">
          <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' } }}>
            Create New Article
          </Button>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="rounded-2xl border border-cream-200 bg-white">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <Typography variant="caption" className="text-earth-500 font-bold uppercase tracking-wider block">
                  {stat.label}
                </Typography>
                <Typography variant="h4" className="font-serif font-bold text-earth-900 mt-1">
                  {stat.value}
                </Typography>
              </div>
              <div className="p-3 rounded-2xl bg-cream-50">{stat.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Articles Table */}
      <Box className="p-6 rounded-3xl bg-white border border-cream-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <Typography variant="h6" className="font-serif font-bold text-earth-900">
            Recent Articles
          </Typography>
          <Link href="/admin/posts">
            <Button size="small" sx={{ color: '#C88A79' }}>
              View All Posts
            </Button>
          </Link>
        </div>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="font-bold">Title (EN)</TableCell>
                <TableCell className="font-bold">Category</TableCell>
                <TableCell className="font-bold">Status</TableCell>
                <TableCell className="font-bold">Views</TableCell>
                <TableCell className="font-bold">Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {posts.map(post => {
                const cat = categories.find(c => c.id === post.category_id);
                return (
                  <TableRow key={post.id} hover>
                    <TableCell className="font-serif font-semibold text-earth-900">{post.title_en}</TableCell>
                    <TableCell>{cat?.name_en || 'Wellness'}</TableCell>
                    <TableCell>
                      <Chip label={post.status} size="small" color={post.status === 'published' ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell>{post.views_count}</TableCell>
                    <TableCell>{new Date(post.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </div>
  );
}
