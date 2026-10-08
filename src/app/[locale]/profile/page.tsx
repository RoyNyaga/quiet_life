'use client';

import { useState, useMemo, useTransition, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Typography,
  TextField,
  Button,
  Avatar,
  Box,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  IconButton,
  Chip,
  Tooltip,
  Switch,
  FormControlLabel,
  InputAdornment,
  Card,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkAddRoundedIcon from '@mui/icons-material/BookmarkAddRounded';
import BookmarkRemoveOutlinedIcon from '@mui/icons-material/BookmarkRemoveOutlined';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import CollectionsBookmarkRoundedIcon from '@mui/icons-material/CollectionsBookmarkRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { motion, AnimatePresence } from 'framer-motion';

import { useApp } from '@/lib/store';
import { DICTIONARY, getLocalizedField } from '@/lib/i18n';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { createClient } from '@/lib/supabase/client';
import { ReadingList, Post } from '@/types/database';

const TAB_KEYS = ['reading-list', 'edit-profile', 'account-security'] as const;
type TabKey = (typeof TAB_KEYS)[number];

function ProfileContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const {
    user,
    updateUserProfile,
    locale,
    readingLists,
    readingListItems,
    posts,
    categories,
    createReadingList,
    updateReadingList,
    deleteReadingList,
    removeReadingListItem,
  } = useApp();

  const t = DICTIONARY[locale];

  // Map URL tab parameter to active tab index
  const currentTabParam = searchParams.get('tab')?.toLowerCase() || 'reading-list';
  const activeTab = useMemo(() => {
    if (['edit-profile', 'edit_profile', 'profile'].includes(currentTabParam)) return 1;
    if (['account-security', 'account_security', 'security'].includes(currentTabParam)) return 2;
    return 0; // default: reading-list
  }, [currentTabParam]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    const targetKey: TabKey = TAB_KEYS[newValue] || 'reading-list';
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', targetKey);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  // Toast feedback state
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const showToast = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setToast({ open: true, message, severity });
  };

  // -------------------------------------------------------------
  // Reading Lists Tab States
  // -------------------------------------------------------------
  const [listSearchQuery, setListSearchQuery] = useState('');

  // Create List Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListIsPrivate, setNewListIsPrivate] = useState(true);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Edit List Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<ReadingList | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPrivate, setEditIsPrivate] = useState(true);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete List Confirmation Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<ReadingList | null>(null);

  // Articles Drawer State
  const selectedListIdParam = searchParams.get('list');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<ReadingList | null>(null);
  const [drawerArticleSearch, setDrawerArticleSearch] = useState('');

  // Auto-open drawer if `list` param matches on mount / URL update
  useMemo(() => {
    if (selectedListIdParam && readingLists.length > 0) {
      const found = readingLists.find(l => l.id === selectedListIdParam);
      if (found) {
        setSelectedList(found);
        setDrawerOpen(true);
      }
    }
  }, [selectedListIdParam, readingLists]);

  const openListDrawer = (list: ReadingList) => {
    setSelectedList(list);
    setDrawerOpen(true);
    setDrawerArticleSearch('');
    // Optionally update URL param
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'reading-list');
    params.set('list', list.id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const closeListDrawer = () => {
    setDrawerOpen(false);
    setSelectedList(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('list');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Helper to get articles for a given list
  const getArticlesForList = (listId: string): Post[] => {
    const listItems = readingListItems.filter(i => i.list_id === listId);
    return posts.filter(p => listItems.some(i => i.post_id === p.id));
  };

  // Filtered reading lists
  const filteredReadingLists = useMemo(() => {
    if (!listSearchQuery.trim()) return readingLists;
    const query = listSearchQuery.toLowerCase();
    return readingLists.filter(
      l => l.name.toLowerCase().includes(query) || (l.description && l.description.toLowerCase().includes(query))
    );
  }, [readingLists, listSearchQuery]);

  // Handle Create List
  const handleCreateListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setIsSubmittingCreate(true);
    try {
      const created = createReadingList(newListName.trim(), newListDescription.trim(), newListIsPrivate);
      setNewListName('');
      setNewListDescription('');
      setNewListIsPrivate(true);
      setCreateModalOpen(false);
      showToast(`Collection "${created.name}" created successfully!`);
    } catch {
      showToast('Failed to create reading list.', 'error');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Handle Open Edit Modal
  const handleOpenEditModal = (list: ReadingList, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingList(list);
    setEditName(list.name);
    setEditDescription(list.description || '');
    setEditIsPrivate(list.is_private);
    setEditModalOpen(true);
  };

  // Handle Save Edit
  const handleEditListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingList || !editName.trim()) return;

    setIsSubmittingEdit(true);
    try {
      updateReadingList(editingList.id, {
        name: editName.trim(),
        description: editDescription.trim(),
        is_private: editIsPrivate,
      });

      // Update active list if it's currently open in drawer
      if (selectedList?.id === editingList.id) {
        setSelectedList({
          ...selectedList,
          name: editName.trim(),
          description: editDescription.trim(),
          is_private: editIsPrivate,
        });
      }

      setEditModalOpen(false);
      setEditingList(null);
      showToast(`Updated "${editName.trim()}" successfully.`);
    } catch {
      showToast('Failed to update reading list.', 'error');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handle Open Delete Dialog
  const handleOpenDeleteDialog = (list: ReadingList, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setListToDelete(list);
    setDeleteDialogOpen(true);
  };

  // Handle Confirm Delete
  const handleConfirmDelete = () => {
    if (!listToDelete) return;
    const deletedName = listToDelete.name;
    deleteReadingList(listToDelete.id);
    if (selectedList?.id === listToDelete.id) {
      closeListDrawer();
    }
    setDeleteDialogOpen(false);
    setListToDelete(null);
    showToast(`Collection "${deletedName}" removed.`);
  };

  // Handle Remove Article from List
  const handleRemoveArticleFromList = (listId: string, postId: string, postTitle: string) => {
    removeReadingListItem(listId, postId);
    showToast(`Removed "${postTitle}" from this collection.`);
  };

  // Quick Preset Creators for Empty State
  const handleCreatePreset = (presetName: string, presetDesc: string) => {
    createReadingList(presetName, presetDesc, true);
    showToast(`Created "${presetName}" collection!`);
  };

  // -------------------------------------------------------------
  // Edit Profile Tab States
  // -------------------------------------------------------------
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      updateUserProfile({ full_name: fullName.trim(), avatar_url: avatarUrl });
      showToast('Profile information updated successfully!');
    } catch {
      showToast('Error updating profile.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // -------------------------------------------------------------
  // Account Security Tab States
  // -------------------------------------------------------------
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword) {
      if (newPassword.length < 6) {
        showToast('New password must be at least 6 characters.', 'error');
        return;
      }
      if (newPassword !== confirmPassword) {
        showToast('New passwords do not match.', 'error');
        return;
      }
    }

    setIsSavingSecurity(true);
    try {
      const supabase = createClient();
      if (supabase && user && !user.id.startsWith('guest')) {
        const updatePayload: { password?: string; email?: string } = {};
        if (newPassword) updatePayload.password = newPassword;
        if (newEmail) updatePayload.email = newEmail;

        if (Object.keys(updatePayload).length > 0) {
          const { error } = await supabase.auth.updateUser(updatePayload);
          if (error) {
            showToast(error.message, 'error');
            setIsSavingSecurity(false);
            return;
          }
        }
      }

      showToast('Security settings updated successfully!');
      setCurrentPassword('');
      setNewEmail('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      showToast('Failed to update credentials. Please try again.', 'error');
    } finally {
      setIsSavingSecurity(false);
    }
  };

  // If not signed in
  if (!user) {
    return (
      <Container maxWidth="md" className="py-24 text-center">
        <Box className="p-12 rounded-3xl bg-white border border-cream-200 shadow-sm max-w-lg mx-auto">
          <Avatar sx={{ width: 64, height: 64, bgcolor: '#F7EBE8', color: '#C88A79', mx: 'auto', mb: 3 }}>
            <LockIcon fontSize="large" />
          </Avatar>
          <Typography variant="h5" className="font-serif font-bold text-earth-900 mb-2">
            Please Sign In
          </Typography>
          <Typography variant="body1" className="text-earth-600 mb-6">
            You need to be signed in to manage your mindful profile, reading collections, and security credentials.
          </Typography>
          <Link href={`/${locale}`}>
            <Button variant="contained" sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' }, px: 4, py: 1.2 }}>
              Return to Home
            </Button>
          </Link>
        </Box>
      </Container>
    );
  }

  // Articles inside active drawer
  const activeDrawerArticles = selectedList ? getArticlesForList(selectedList.id) : [];
  const filteredDrawerArticles = activeDrawerArticles.filter(post => {
    if (!drawerArticleSearch.trim()) return true;
    const q = drawerArticleSearch.toLowerCase();
    const title = getLocalizedField(post, 'title', locale).toLowerCase();
    return title.includes(q);
  });

  const totalSavedCount = readingListItems.length;

  return (
    <Container maxWidth="lg" className="py-10 space-y-8">
      {/* Profile Header Banner */}
      <Box className="p-8 rounded-3xl bg-gradient-to-r from-cream-100 via-cream-50 to-sage-50 border border-cream-200 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <Avatar
            src={user.avatar_url || undefined}
            sx={{
              width: 88,
              height: 88,
              border: '3px solid #C88A79',
              boxShadow: '0 4px 14px rgba(200, 138, 121, 0.25)',
              fontSize: '2rem',
              bgcolor: '#F7EBE8',
              color: '#C88A79',
            }}
          >
            {user.full_name?.charAt(0) || 'U'}
          </Avatar>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <Typography variant="h4" className="font-serif font-bold text-earth-900">
                {user.full_name}
              </Typography>
              <Chip
                label={user.role === 'admin' ? 'Administrator' : 'Reader'}
                size="small"
                sx={{
                  bgcolor: user.role === 'admin' ? '#749D81' : '#E8E2DA',
                  color: user.role === 'admin' ? '#FFFFFF' : '#5C4438',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
            </div>
            <Typography variant="body2" className="text-earth-600">
              {user.role === 'admin'
                ? 'Curator, Editor & System Administrator'
                : 'Mindful Reader • Exploring Tranquility & Balance'}
            </Typography>
          </div>
        </div>

        {/* Quick Collections Metric Pill */}
        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-cream-200 px-5 py-3 rounded-2xl shadow-sm">
          <CollectionsBookmarkRoundedIcon sx={{ color: '#C88A79' }} />
          <div>
            <Typography variant="caption" className="text-earth-500 font-medium block">
              Saved Collections
            </Typography>
            <Typography variant="body2" className="font-serif font-bold text-earth-900">
              {readingLists.length} lists • {totalSavedCount} articles
            </Typography>
          </div>
        </div>
      </Box>

      {/* Tabs Bar with URL Parameters */}
      <Box sx={{ borderBottom: 1, borderColor: '#E8E2DA' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              minHeight: 52,
              px: { xs: 2, sm: 3 },
            },
            '& .Mui-selected': {
              color: '#C88A79 !important',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#C88A79',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab
            icon={<BookmarkIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label="Reading Lists"
            id="tab-reading-list"
          />
          <Tab
            icon={<PersonIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label="Edit Profile"
            id="tab-edit-profile"
          />
          <Tab
            icon={<LockIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label="Account Security"
            id="tab-account-security"
          />
        </Tabs>
      </Box>

      {/* ========================================================= */}
      {/* TAB 0: READING LISTS */}
      {/* ========================================================= */}
      {activeTab === 0 && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-cream-200">
            <div>
              <div className="flex items-center gap-2">
                <BookmarkIcon sx={{ color: '#C88A79' }} />
                <Typography variant="h6" className="font-serif font-bold text-earth-900">
                  My Reading Collections
                </Typography>
              </div>
              <Typography variant="body2" className="text-earth-600 text-sm">
                Organize and savor your favorite essays into themed personal libraries.
              </Typography>
            </div>

            <div className="flex items-center gap-3">
              {readingLists.length > 2 && (
                <TextField
                  size="small"
                  placeholder="Filter lists..."
                  value={listSearchQuery}
                  onChange={e => setListSearchQuery(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchRoundedIcon fontSize="small" sx={{ color: '#8C776D' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    width: { xs: '100%', sm: 200 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      bgcolor: '#FAF7F2',
                    },
                  }}
                />
              )}

              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={() => setCreateModalOpen(true)}
                sx={{
                  bgcolor: '#C88A79',
                  '&:hover': { bgcolor: '#A66E5E' },
                  px: 2.5,
                  py: 1,
                  borderRadius: '12px',
                  fontWeight: 600,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 3px 10px rgba(200, 138, 121, 0.25)',
                }}
              >
                New List
              </Button>
            </div>
          </div>

          {/* Reading Lists Grid */}
          {filteredReadingLists.length === 0 ? (
            readingLists.length === 0 ? (
              /* Empty State when zero lists exist */
              <Box className="p-12 text-center rounded-3xl bg-white border border-dashed border-cream-300 space-y-6">
                <Avatar sx={{ width: 72, height: 72, bgcolor: '#F7EBE8', color: '#C88A79', mx: 'auto' }}>
                  <AutoStoriesOutlinedIcon sx={{ fontSize: 36 }} />
                </Avatar>
                <div className="max-w-md mx-auto space-y-2">
                  <Typography variant="h5" className="font-serif font-bold text-earth-900">
                    No Reading Lists Yet
                  </Typography>
                  <Typography variant="body2" className="text-earth-600 leading-relaxed">
                    Cultivate mindful reading habits. Create custom collections like &quot;Morning Meditations&quot; or &quot;Deep Focus&quot; to save articles for quiet moments.
                  </Typography>
                </div>

                <div className="pt-2">
                  <Button
                    variant="contained"
                    startIcon={<BookmarkAddRoundedIcon />}
                    onClick={() => setCreateModalOpen(true)}
                    sx={{
                      bgcolor: '#C88A79',
                      '&:hover': { bgcolor: '#A66E5E' },
                      px: 3.5,
                      py: 1.2,
                      borderRadius: '14px',
                      fontWeight: 600,
                      textTransform: 'none',
                    }}
                  >
                    Create Your First Reading List
                  </Button>
                </div>

                {/* Quick starter presets */}
                <div className="pt-4 border-t border-cream-200 max-w-lg mx-auto">
                  <Typography variant="caption" className="text-earth-500 uppercase tracking-wider block mb-3 font-semibold">
                    Or start with a curated theme:
                  </Typography>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Chip
                      clickable
                      label="+ Morning Reflections"
                      onClick={() => handleCreatePreset('Morning Reflections', 'Inspiring thoughts to start the day with clarity.')}
                      sx={{ bgcolor: '#FAF7F2', borderColor: '#E8E2DA', '&:hover': { bgcolor: '#F7EBE8' } }}
                    />
                    <Chip
                      clickable
                      label="+ Evening Wind-Down"
                      onClick={() => handleCreatePreset('Evening Wind-Down', 'Soothing reads for tranquility and restorative sleep.')}
                      sx={{ bgcolor: '#FAF7F2', borderColor: '#E8E2DA', '&:hover': { bgcolor: '#F7EBE8' } }}
                    />
                    <Chip
                      clickable
                      label="+ Philosophy & Stillness"
                      onClick={() => handleCreatePreset('Philosophy & Stillness', 'Timeless insights into mindfulness and slow living.')}
                      sx={{ bgcolor: '#FAF7F2', borderColor: '#E8E2DA', '&:hover': { bgcolor: '#F7EBE8' } }}
                    />
                  </div>
                </div>
              </Box>
            ) : (
              /* Search with no results */
              <Box className="p-10 text-center rounded-3xl bg-white border border-cream-200">
                <Typography variant="h6" className="font-serif text-earth-900 mb-1">
                  No matching lists found
                </Typography>
                <Typography variant="body2" className="text-earth-500 mb-4">
                  No reading lists matched your search query &quot;{listSearchQuery}&quot;.
                </Typography>
                <Button size="small" variant="outlined" onClick={() => setListSearchQuery('')}>
                  Clear Filter
                </Button>
              </Box>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReadingLists.map(list => {
                const listArticles = getArticlesForList(list.id);
                const coverThumbnails = listArticles
                  .map(a => a.cover_image_url)
                  .filter((url): url is string => Boolean(url))
                  .slice(0, 3);

                return (
                  <motion.div
                    key={list.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Card
                      onClick={() => openListDrawer(list)}
                      className="group cursor-pointer rounded-3xl border border-cream-200 bg-white hover:border-terracotta-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden h-full"
                    >
                      {/* Top Visual Collage / Cover Banner */}
                      <div className="relative h-36 bg-gradient-to-br from-cream-100 to-cream-200 border-b border-cream-100 overflow-hidden flex items-center justify-center p-3">
                        {coverThumbnails.length > 0 ? (
                          <div className="flex items-center justify-center -space-x-4 w-full h-full">
                            {coverThumbnails.map((thumb, idx) => (
                              <img
                                key={idx}
                                src={thumb}
                                alt=""
                                className="w-20 h-24 rounded-xl object-cover border-2 border-white shadow-md transform transition-transform group-hover:scale-105"
                                style={{
                                  zIndex: coverThumbnails.length - idx,
                                  transform: `rotate(${idx === 0 ? '-4deg' : idx === 1 ? '2deg' : '6deg'})`,
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center space-y-1">
                            <MenuBookRoundedIcon sx={{ fontSize: 32, color: '#C88A79', opacity: 0.6 }} />
                            <Typography variant="caption" className="text-earth-400 block font-medium">
                              Empty Collection
                            </Typography>
                          </div>
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <Chip
                            size="small"
                            icon={list.is_private ? <LockIcon sx={{ fontSize: '13px !important' }} /> : <PublicIcon sx={{ fontSize: '13px !important' }} />}
                            label={list.is_private ? 'Private' : 'Public'}
                            sx={{
                              bgcolor: 'rgba(255, 255, 255, 0.92)',
                              backdropFilter: 'blur(4px)',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              color: list.is_private ? '#5C4438' : '#749D81',
                              height: 24,
                            }}
                          />
                        </div>

                        <div className="absolute top-3 right-3">
                          <Chip
                            size="small"
                            label={`${listArticles.length} ${listArticles.length === 1 ? 'article' : 'articles'}`}
                            sx={{
                              bgcolor: 'rgba(255, 255, 255, 0.92)',
                              backdropFilter: 'blur(4px)',
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              color: '#2C2623',
                              height: 24,
                            }}
                          />
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <Typography
                            variant="h6"
                            className="font-serif font-bold text-earth-900 group-hover:text-terracotta-600 transition-colors line-clamp-1 mb-1"
                          >
                            {list.name}
                          </Typography>
                          <Typography variant="body2" className="text-earth-600 text-sm line-clamp-2 min-h-[40px] leading-relaxed">
                            {list.description || <span className="italic text-earth-400">No description provided.</span>}
                          </Typography>
                        </div>

                        {/* Card Bottom Actions */}
                        <div className="pt-3 border-t border-cream-100 flex items-center justify-between">
                          <Button
                            size="small"
                            endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: '16px !important' }} />}
                            onClick={e => {
                              e.stopPropagation();
                              openListDrawer(list);
                            }}
                            sx={{
                              color: '#C88A79',
                              fontWeight: 600,
                              textTransform: 'none',
                              p: 0,
                              '&:hover': { bgcolor: 'transparent', color: '#A66E5E' },
                            }}
                          >
                            View Articles
                          </Button>

                          <div className="flex items-center gap-1">
                            <Tooltip title="Edit Collection">
                              <IconButton
                                size="small"
                                onClick={e => handleOpenEditModal(list, e)}
                                sx={{
                                  color: '#8C776D',
                                  '&:hover': { color: '#C88A79', bgcolor: '#F7EBE8' },
                                }}
                              >
                                <EditRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Collection">
                              <IconButton
                                size="small"
                                onClick={e => handleOpenDeleteDialog(list, e)}
                                sx={{
                                  color: '#8C776D',
                                  '&:hover': { color: '#D32F2F', bgcolor: '#FDECEA' },
                                }}
                              >
                                <DeleteOutlineRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: EDIT PROFILE */}
      {/* ========================================================= */}
      {activeTab === 1 && (
        <Box className="p-8 rounded-3xl bg-white border border-cream-200 max-w-xl mx-auto space-y-6 shadow-sm">
          <div className="border-b border-cream-200 pb-4">
            <Typography variant="h5" className="font-serif font-bold text-earth-900">
              Profile Settings
            </Typography>
            <Typography variant="body2" className="text-earth-600">
              Customize how your profile appears to readers and editors.
            </Typography>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <TextField
              fullWidth
              label="Full Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              slotProps={{
                input: {
                  sx: { borderRadius: '12px' },
                },
              }}
            />

            <ImageUploader
              label="Profile Picture / Avatar"
              value={avatarUrl}
              onChange={url => setAvatarUrl(url)}
              aspectRatio="1:1"
              folder="avatars"
              helperText="Upload and crop your profile avatar. Saved into the avatars storage bucket."
            />

            <div className="bg-cream-50 p-4 rounded-2xl border border-cream-200 space-y-1">
              <Typography variant="caption" className="text-earth-500 font-semibold block uppercase tracking-wider">
                Account Role
              </Typography>
              <div className="flex items-center gap-2">
                <Chip
                  label={user.role === 'admin' ? 'Administrator' : 'Mindful Reader'}
                  size="small"
                  sx={{
                    bgcolor: user.role === 'admin' ? '#749D81' : '#C88A79',
                    color: '#FFFFFF',
                    fontWeight: 700,
                  }}
                />
                <Typography variant="caption" className="text-earth-600">
                  {user.role === 'admin'
                    ? 'Full editorial and management privileges.'
                    : 'Standard reading, commenting, and bookmarking access.'}
                </Typography>
              </div>
            </div>

            <Button
              fullWidth
              variant="contained"
              type="submit"
              size="large"
              disabled={isSavingProfile}
              sx={{
                bgcolor: '#C88A79',
                '&:hover': { bgcolor: '#A66E5E' },
                py: 1.5,
                borderRadius: '14px',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
              }}
            >
              {isSavingProfile ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Save Profile Changes'}
            </Button>
          </form>
        </Box>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ACCOUNT SECURITY */}
      {/* ========================================================= */}
      {activeTab === 2 && (
        <Box className="p-8 rounded-3xl bg-white border border-cream-200 max-w-xl mx-auto space-y-6 shadow-sm">
          <div className="border-b border-cream-200 pb-4">
            <div className="flex items-center gap-2">
              <SecurityRoundedIcon sx={{ color: '#C88A79' }} />
              <Typography variant="h5" className="font-serif font-bold text-earth-900">
                Security & Credentials
              </Typography>
            </div>
            <Typography variant="body2" className="text-earth-600 mt-1">
              Manage your password and authentication credentials safely.
            </Typography>
          </div>

          <form onSubmit={handleUpdateSecurity} className="space-y-5">
            <TextField
              fullWidth
              type="password"
              label="Current Password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password to verify"
              slotProps={{
                input: {
                  sx: { borderRadius: '12px' },
                },
              }}
            />

            <TextField
              fullWidth
              type="email"
              label="New Email Address"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="Leave blank to keep unchanged"
              slotProps={{
                input: {
                  sx: { borderRadius: '12px' },
                },
              }}
            />

            <TextField
              fullWidth
              type="password"
              label="New Password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              slotProps={{
                input: {
                  sx: { borderRadius: '12px' },
                },
              }}
            />

            <TextField
              fullWidth
              type="password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              slotProps={{
                input: {
                  sx: { borderRadius: '12px' },
                },
              }}
            />

            {/* Advice notice */}
            <div className="p-4 bg-cream-50 rounded-2xl border border-cream-200 flex items-start gap-3">
              <LockIcon sx={{ color: '#C88A79', fontSize: 20, mt: 0.25 }} />
              <Typography variant="caption" className="text-earth-600 leading-relaxed">
                Ensure your password is at least 6 characters and includes a blend of letters, numbers, and symbols for mindful privacy.
              </Typography>
            </div>

            <Button
              fullWidth
              variant="contained"
              type="submit"
              size="large"
              disabled={isSavingSecurity}
              sx={{
                bgcolor: '#C88A79',
                '&:hover': { bgcolor: '#A66E5E' },
                py: 1.5,
                borderRadius: '14px',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
              }}
            >
              {isSavingSecurity ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Update Credentials'}
            </Button>
          </form>
        </Box>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE READING LIST */}
      {/* ========================================================= */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '24px',
              p: 1,
              bgcolor: '#FDFBF7',
              border: '1px solid #E8E2DA',
            },
          },
        }}
      >
        <DialogTitle className="flex items-center justify-between pb-2 border-b border-cream-200">
          <div className="flex items-center gap-2">
            <Avatar sx={{ bgcolor: '#F7EBE8', color: '#C88A79', width: 36, height: 36 }}>
              <BookmarkAddRoundedIcon fontSize="small" />
            </Avatar>
            <div>
              <Typography variant="h6" className="font-serif font-bold text-earth-900 leading-tight">
                Create Reading List
              </Typography>
              <Typography variant="caption" className="text-earth-500">
                Curate a new collection of mindful articles.
              </Typography>
            </div>
          </div>
          <IconButton size="small" onClick={() => setCreateModalOpen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleCreateListSubmit}>
          <DialogContent className="space-y-4 pt-4">
            <TextField
              fullWidth
              autoFocus
              label="Collection Name"
              placeholder="e.g., Morning Mindful Reads, Philosophy, Sleep"
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              required
              slotProps={{
                input: { sx: { borderRadius: '12px' } },
              }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description (Optional)"
              placeholder="What kind of reflections and thoughts belong in this collection?"
              value={newListDescription}
              onChange={e => setNewListDescription(e.target.value)}
              slotProps={{
                input: { sx: { borderRadius: '12px' } },
              }}
            />

            <Box className="p-3 bg-white rounded-xl border border-cream-200 flex items-center justify-between">
              <div>
                <Typography variant="body2" className="font-semibold text-earth-900">
                  Private Collection
                </Typography>
                <Typography variant="caption" className="text-earth-500">
                  Only you will be able to see and access this collection.
                </Typography>
              </div>
              <Switch
                checked={newListIsPrivate}
                onChange={e => setNewListIsPrivate(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#C88A79' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#C88A79' },
                }}
              />
            </Box>
          </DialogContent>

          <DialogActions className="p-4 pt-2 border-t border-cream-200 gap-2">
            <Button
              variant="outlined"
              onClick={() => setCreateModalOpen(false)}
              sx={{ borderRadius: '12px', textTransform: 'none', color: '#5C4438', borderColor: '#E8E2DA' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmittingCreate || !newListName.trim()}
              sx={{
                bgcolor: '#C88A79',
                '&:hover': { bgcolor: '#A66E5E' },
                borderRadius: '12px',
                fontWeight: 600,
                textTransform: 'none',
                px: 3,
              }}
            >
              {isSubmittingCreate ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Create List'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL: EDIT READING LIST */}
      {/* ========================================================= */}
      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '24px',
              p: 1,
              bgcolor: '#FDFBF7',
              border: '1px solid #E8E2DA',
            },
          },
        }}
      >
        <DialogTitle className="flex items-center justify-between pb-2 border-b border-cream-200">
          <div className="flex items-center gap-2">
            <Avatar sx={{ bgcolor: '#F7EBE8', color: '#C88A79', width: 36, height: 36 }}>
              <EditRoundedIcon fontSize="small" />
            </Avatar>
            <div>
              <Typography variant="h6" className="font-serif font-bold text-earth-900 leading-tight">
                Edit Reading List
              </Typography>
              <Typography variant="caption" className="text-earth-500">
                Update collection title, description, or visibility.
              </Typography>
            </div>
          </div>
          <IconButton size="small" onClick={() => setEditModalOpen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleEditListSubmit}>
          <DialogContent className="space-y-4 pt-4">
            <TextField
              fullWidth
              autoFocus
              label="Collection Name"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              required
              slotProps={{
                input: { sx: { borderRadius: '12px' } },
              }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description (Optional)"
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              slotProps={{
                input: { sx: { borderRadius: '12px' } },
              }}
            />

            <Box className="p-3 bg-white rounded-xl border border-cream-200 flex items-center justify-between">
              <div>
                <Typography variant="body2" className="font-semibold text-earth-900">
                  Private Collection
                </Typography>
                <Typography variant="caption" className="text-earth-500">
                  {editIsPrivate ? 'Only you can see this collection.' : 'Anyone with link can view this collection.'}
                </Typography>
              </div>
              <Switch
                checked={editIsPrivate}
                onChange={e => setEditIsPrivate(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#C88A79' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#C88A79' },
                }}
              />
            </Box>
          </DialogContent>

          <DialogActions className="p-4 pt-2 border-t border-cream-200 gap-2">
            <Button
              variant="outlined"
              onClick={() => setEditModalOpen(false)}
              sx={{ borderRadius: '12px', textTransform: 'none', color: '#5C4438', borderColor: '#E8E2DA' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmittingEdit || !editName.trim()}
              sx={{
                bgcolor: '#C88A79',
                '&:hover': { bgcolor: '#A66E5E' },
                borderRadius: '12px',
                fontWeight: 600,
                textTransform: 'none',
                px: 3,
              }}
            >
              {isSubmittingEdit ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG: CONFIRM DELETE READING LIST */}
      {/* ========================================================= */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '24px',
              p: 2,
              bgcolor: '#FFFFFF',
            },
          },
        }}
      >
        <DialogTitle className="flex items-center gap-3 pb-2">
          <Avatar sx={{ bgcolor: '#FDECEA', color: '#D32F2F', width: 40, height: 40 }}>
            <WarningAmberRoundedIcon />
          </Avatar>
          <Typography variant="h6" className="font-serif font-bold text-earth-900">
            Delete Collection?
          </Typography>
        </DialogTitle>
        <DialogContent className="pt-2">
          <Typography variant="body2" className="text-earth-600 leading-relaxed">
            Are you sure you want to delete &quot;<strong>{listToDelete?.name}</strong>&quot;? The saved articles will remain intact in the Quiet Life publication, but this collection will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions className="pt-3 gap-2">
          <Button
            variant="outlined"
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ borderRadius: '12px', textTransform: 'none', color: '#5C4438', borderColor: '#E8E2DA' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
          >
            Delete Collection
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========================================================= */}
      {/* DRAWER: ARTICLES INSIDE SELECTED LIST */}
      {/* ========================================================= */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={closeListDrawer}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 500, md: 560 },
              bgcolor: '#FDFBF7',
              p: { xs: 2.5, sm: 3.5 },
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        {selectedList && (
          <div className="flex flex-col h-full">
            {/* Drawer Header */}
            <div className="pb-4 border-b border-cream-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Chip
                    size="small"
                    icon={selectedList.is_private ? <LockIcon sx={{ fontSize: '13px !important' }} /> : <PublicIcon sx={{ fontSize: '13px !important' }} />}
                    label={selectedList.is_private ? 'Private' : 'Public'}
                    sx={{
                      bgcolor: '#FAF7F2',
                      borderColor: '#E8E2DA',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  />
                  <Chip
                    size="small"
                    label={`${activeDrawerArticles.length} saved`}
                    sx={{ bgcolor: '#F7EBE8', color: '#C88A79', fontWeight: 700, fontSize: '0.75rem' }}
                  />
                </div>

                <div className="flex items-center gap-1">
                  <Tooltip title="Edit Collection">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenEditModal(selectedList)}
                      sx={{ color: '#8C776D', '&:hover': { color: '#C88A79', bgcolor: '#F7EBE8' } }}
                    >
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Collection">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDeleteDialog(selectedList)}
                      sx={{ color: '#8C776D', '&:hover': { color: '#D32F2F', bgcolor: '#FDECEA' } }}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <IconButton size="small" onClick={closeListDrawer} sx={{ ml: 1 }}>
                    <CloseRoundedIcon />
                  </IconButton>
                </div>
              </div>

              <Typography variant="h5" className="font-serif font-bold text-earth-900 leading-tight mb-1">
                {selectedList.name}
              </Typography>
              {selectedList.description && (
                <Typography variant="body2" className="text-earth-600 leading-relaxed text-sm">
                  {selectedList.description}
                </Typography>
              )}

              {/* Filter inside drawer if 3+ articles */}
              {activeDrawerArticles.length > 2 && (
                <div className="mt-3">
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search in this collection..."
                    value={drawerArticleSearch}
                    onChange={e => setDrawerArticleSearch(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchRoundedIcon fontSize="small" sx={{ color: '#8C776D' }} />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: '12px', bgcolor: '#FFFFFF' },
                      },
                    }}
                  />
                </div>
              )}
            </div>

            {/* Drawer Body: Article List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {filteredDrawerArticles.length === 0 ? (
                activeDrawerArticles.length === 0 ? (
                  <div className="py-16 text-center space-y-4">
                    <Avatar sx={{ width: 64, height: 64, bgcolor: '#F7EBE8', color: '#C88A79', mx: 'auto' }}>
                      <BookmarkBorderIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <div className="max-w-xs mx-auto space-y-1">
                      <Typography variant="h6" className="font-serif font-semibold text-earth-900">
                        This list is empty
                      </Typography>
                      <Typography variant="body2" className="text-earth-500 text-sm">
                        Browse mindful articles and click the bookmark icon to save them to &quot;{selectedList.name}&quot;.
                      </Typography>
                    </div>
                    <Link href={`/${locale}/articles`}>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{
                          borderColor: '#C88A79',
                          color: '#C88A79',
                          borderRadius: '12px',
                          textTransform: 'none',
                          mt: 1,
                        }}
                      >
                        Explore Mindful Articles
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <Typography variant="body2" className="text-earth-500 italic">
                      No articles found matching &quot;{drawerArticleSearch}&quot;.
                    </Typography>
                  </div>
                )
              ) : (
                filteredDrawerArticles.map(article => {
                  const title = getLocalizedField(article, 'title', locale);
                  const category = categories.find(c => c.id === article.category_id);
                  const categoryName = category ? getLocalizedField(category, 'name', locale) : 'Wellness';

                  return (
                    <motion.div
                      key={article.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group p-3.5 rounded-2xl bg-white border border-cream-200 hover:border-terracotta-200 hover:shadow-md transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {article.cover_image_url ? (
                          <img
                            src={article.cover_image_url}
                            alt=""
                            className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-cream-100"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-cream-100 flex items-center justify-center flex-shrink-0 text-earth-400">
                            <MenuBookRoundedIcon fontSize="small" />
                          </div>
                        )}

                        <div className="overflow-hidden space-y-1">
                          <Chip
                            label={categoryName}
                            size="small"
                            sx={{
                              bgcolor: '#EBF2ED',
                              color: '#587C64',
                              fontWeight: 700,
                              fontSize: '0.65rem',
                              height: 20,
                            }}
                          />
                          <Link href={`/${locale}/articles/${article.slug}`}>
                            <Typography
                              variant="body2"
                              className="font-serif font-bold text-earth-900 group-hover:text-terracotta-600 transition-colors truncate block"
                            >
                              {title}
                            </Typography>
                          </Link>
                          <div className="flex items-center gap-3 text-xs text-earth-500">
                            <span className="flex items-center gap-1">
                              <AccessTimeRoundedIcon sx={{ fontSize: 13 }} />
                              {article.read_time_minutes} min read
                            </span>
                            <span className="flex items-center gap-1">
                              <VisibilityRoundedIcon sx={{ fontSize: 13 }} />
                              {article.views_count}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link href={`/${locale}/articles/${article.slug}`}>
                          <Tooltip title="Read Article">
                            <IconButton
                              size="small"
                              sx={{
                                color: '#C88A79',
                                '&:hover': { bgcolor: '#F7EBE8' },
                              }}
                            >
                              <OpenInNewRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Link>
                        <Tooltip title="Remove from list">
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveArticleFromList(selectedList.id, article.id, title)}
                            sx={{
                              color: '#8C776D',
                              '&:hover': { color: '#D32F2F', bgcolor: '#FDECEA' },
                            }}
                          >
                            <BookmarkRemoveOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer */}
            <div className="pt-3 border-t border-cream-200 flex items-center justify-between">
              <Typography variant="caption" className="text-earth-500">
                Quiet Life • Mindful Reader
              </Typography>
              <Button
                size="small"
                variant="text"
                onClick={closeListDrawer}
                sx={{ color: '#5C4438', fontWeight: 600, textTransform: 'none' }}
              >
                Close Drawer
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Snackbar feedback */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast(prev => ({ ...prev, open: false }))}
          sx={{
            width: '100%',
            borderRadius: '12px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
            fontWeight: 500,
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <Container maxWidth="lg" className="py-12 space-y-6">
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 6 }} />
          <Skeleton variant="rectangular" height={50} sx={{ borderRadius: 2 }} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
            <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 4 }} />
            <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 4 }} />
            <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 4 }} />
          </div>
        </Container>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
