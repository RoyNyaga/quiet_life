'use client';

import { useState } from 'react';
import { Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Box, Snackbar, Alert } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useApp } from '@/lib/store';

export default function AdminSubscribersPage() {
  const { subscriptions, posts } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const filteredSubs = subscriptions.filter(s => s.email.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleExportCSV = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' + ['Email,Status,Subscribed Date'].concat(subscriptions.map(s => `${s.email},${s.status},${s.created_at}`)).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'quiet_life_subscribers.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMsg('Exported subscriber CSV file!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Typography variant="h4" className="font-serif font-bold text-earth-900">
            Newsletter Subscribers
          </Typography>
          <Typography variant="body2" className="text-earth-600">
            View subscriber emails, source origins, and export subscriber lists for mailing tools.
          </Typography>
        </div>
        <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExportCSV} sx={{ bgcolor: '#749D81', '&:hover': { bgcolor: '#587C64' } }}>
          Export CSV
        </Button>
      </div>

      <Box className="p-6 rounded-3xl bg-white border border-cream-200 shadow-sm space-y-4">
        <TextField
          size="small"
          placeholder="Filter subscribers by email..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full sm:w-80"
        />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="font-bold">Subscriber Email</TableCell>
                <TableCell className="font-bold">Origin Article</TableCell>
                <TableCell className="font-bold">Status</TableCell>
                <TableCell className="font-bold">Date Subscribed</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSubs.map(sub => {
                const originPost = posts.find(p => p.id === sub.origin_post_id);
                return (
                  <TableRow key={sub.id} hover>
                    <TableCell className="font-serif font-semibold text-earth-900">{sub.email}</TableCell>
                    <TableCell className="text-earth-600 text-sm">{originPost ? originPost.title_en : 'Global Footer / Banner'}</TableCell>
                    <TableCell>
                      <Chip label={sub.status} size="small" color={sub.status === 'active' ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell>{new Date(sub.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Snackbar open={Boolean(toastMsg)} autoHideDuration={3000} onClose={() => setToastMsg('')}>
        <Alert severity="success" sx={{ width: '100%' }}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </div>
  );
}
