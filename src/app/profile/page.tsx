'use client';

import { useState } from 'react';
import { Container, Typography, TextField, Button, Avatar, Box, Tabs, Tab, Snackbar, Alert, Card } from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import DeleteIcon from '@mui/icons-material/Delete';
import { useApp } from '@/lib/store';
import { DICTIONARY } from '@/lib/i18n';
import { ArticleCard } from '@/components/article/ArticleCard';

export default function ProfilePage() {
  const { user, updateUserProfile, locale, readingLists, readingListItems, posts } = useApp();
  const t = DICTIONARY[locale];

  const [activeTab, setActiveTab] = useState(0);

  // Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [toastMsg, setToastMsg] = useState('');

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ full_name: fullName, avatar_url: avatarUrl });
    setToastMsg('Profile updated successfully!');
  };

  const handleUpdateSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMsg('Security settings updated successfully!');
    setCurrentPassword('');
    setNewEmail('');
    setNewPassword('');
  };

  if (!user) {
    return (
      <Container maxWidth="md" className="py-20 text-center">
        <Typography variant="h5" className="font-serif font-bold text-earth-900 mb-2">
          Please Sign In
        </Typography>
        <Typography variant="body1" className="text-earth-600">
          You need to be signed in to view and manage your profile and reading lists.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="py-10 space-y-8">
      {/* Header Banner */}
      <Box className="p-8 rounded-3xl bg-gradient-to-r from-cream-100 to-sage-50 border border-cream-200 flex flex-col sm:flex-row items-center gap-6">
        <Avatar src={user.avatar_url || undefined} sx={{ width: 84, height: 84, border: '3px solid #C88A79' }}>
          {user.full_name.charAt(0)}
        </Avatar>
        <div className="text-center sm:text-left">
          <Typography variant="h4" className="font-serif font-bold text-earth-900">
            {user.full_name}
          </Typography>
          <Typography variant="body2" className="text-earth-600">
            {user.role === 'admin' ? 'Administrator & Editor' : 'Mindful Reader'}
          </Typography>
        </div>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: '#E8E2DA' }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} textColor="primary" indicatorColor="primary">
          <Tab icon={<BookmarkIcon />} iconPosition="start" label="My Reading Lists" />
          <Tab icon={<PersonIcon />} iconPosition="start" label="Edit Profile" />
          <Tab icon={<LockIcon />} iconPosition="start" label="Account Security" />
        </Tabs>
      </Box>

      {/* Tab 0: Reading Lists */}
      {activeTab === 0 && (
        <div className="space-y-8">
          {readingLists.map(list => {
            const listItems = readingListItems.filter(i => i.list_id === list.id);
            const savedPosts = posts.filter(p => listItems.some(i => i.post_id === p.id));

            return (
              <div key={list.id} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-cream-200">
                  <div>
                    <Typography variant="h5" className="font-serif font-bold text-earth-900">
                      {list.name}
                    </Typography>
                    <Typography variant="caption" className="text-earth-500">
                      {savedPosts.length} articles saved
                    </Typography>
                  </div>
                </div>

                {savedPosts.length === 0 ? (
                  <Typography variant="body2" className="text-earth-500 italic py-4">
                    No articles saved to this list yet.
                  </Typography>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {savedPosts.map(post => (
                      <ArticleCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 1: Edit Profile */}
      {activeTab === 1 && (
        <Box className="p-8 rounded-3xl bg-white border border-cream-200 max-w-xl mx-auto space-y-6">
          <Typography variant="h5" className="font-serif font-bold text-earth-900">
            Profile Settings
          </Typography>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <TextField fullWidth label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required />
            <TextField fullWidth label="Avatar Image URL" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} helperText="Enter a direct image link or leave existing" />
            <Button fullWidth variant="contained" type="submit" size="large" sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' }, py: 1.5 }}>
              Save Profile Changes
            </Button>
          </form>
        </Box>
      )}

      {/* Tab 2: Account Security */}
      {activeTab === 2 && (
        <Box className="p-8 rounded-3xl bg-white border border-cream-200 max-w-xl mx-auto space-y-6">
          <Typography variant="h5" className="font-serif font-bold text-earth-900">
            Security & Credentials
          </Typography>
          <form onSubmit={handleUpdateSecurity} className="space-y-4">
            <TextField fullWidth type="password" label="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            <TextField fullWidth type="email" label="New Email Address" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            <TextField fullWidth type="password" label="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <Button fullWidth variant="contained" type="submit" size="large" sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' }, py: 1.5 }}>
              Update Credentials
            </Button>
          </form>
        </Box>
      )}

      <Snackbar open={Boolean(toastMsg)} autoHideDuration={4000} onClose={() => setToastMsg('')}>
        <Alert severity="success" sx={{ width: '100%' }}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
