'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppBar, Toolbar, Typography, Button, IconButton, Avatar, Menu, MenuItem, Select, FormControl, Drawer, List, ListItem, ListItemButton, ListItemText, Box, Badge } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SpaIcon from '@mui/icons-material/Spa';
import { useApp } from '@/lib/store';
import { DICTIONARY } from '@/lib/i18n';
import { Locale } from '@/types/database';
import { BookmarkDrawer } from '../drawers/BookmarkDrawer';
import { GlobalSearchDrawer } from '../drawers/GlobalSearchDrawer';
import { AuthModal } from '../modals/AuthModal';

export function Navbar() {
  const pathname = usePathname();
  const { locale, setLocale, user, setUser, signOut, readingListItems } = useApp();
  const t = DICTIONARY[locale];

  // Drawers & Modals State
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'signup'>('signup');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenAuth = (mode: 'signin' | 'signup') => {
    setAuthInitialMode(mode);
    setAuthModalOpen(true);
  };

  const navLinks = [
    { label: t.nav.home, href: '/' },
    { label: t.nav.articles, href: '/articles' },
    { label: t.nav.contact, href: '/contact' },
  ];

  return (
    <>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#FDFBF7', borderBottom: '1px solid #E8E2DA' }}>
        <Toolbar className="max-w-7xl mx-auto w-full flex items-center justify-between px-4 py-1">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-earth-900 group">
            <div className="w-10 h-10 rounded-xl bg-terracotta-100 flex items-center justify-center text-terracotta-600 transition-transform group-hover:scale-105">
              <SpaIcon fontSize="medium" />
            </div>
            <div>
              <Typography variant="h6" className="font-serif font-bold text-earth-900 tracking-tight leading-none">
                Quiet Life
              </Typography>
              <Typography variant="caption" className="font-sans text-earth-500 text-[10px] tracking-widest uppercase block">
                Mindful Living
              </Typography>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-sans text-sm font-semibold transition-colors ${
                    isActive ? 'text-terracotta-600 border-b-2 border-terracotta-500 pb-1' : 'text-earth-700 hover:text-terracotta-600'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Admin Dashboard Badge Link (If Admin User) */}
            {user && user.role === 'admin' && (
              <Link href="/admin/dashboard">
                <Button
                  size="small"
                  startIcon={<AdminPanelSettingsIcon />}
                  sx={{
                    bgcolor: 'rgba(116,157,129,0.15)',
                    color: '#587C64',
                    fontWeight: 700,
                    borderRadius: 3,
                    '&:hover': { bgcolor: 'rgba(116,157,129,0.25)' },
                  }}
                >
                  {t.nav.adminDashboard}
                </Button>
              </Link>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Search Trigger */}
            <IconButton onClick={() => setSearchOpen(true)} size="medium" sx={{ color: '#5C4438' }}>
              <SearchIcon />
            </IconButton>

            {/* Bookmark Drawer Trigger */}
            <IconButton onClick={() => setBookmarkOpen(true)} size="medium" sx={{ color: '#5C4438' }}>
              <Badge badgeContent={readingListItems.length} color="primary">
                <BookmarkIcon />
              </Badge>
            </IconButton>

            {/* Locale Selector */}
            <FormControl size="small" sx={{ minWidth: 65 }}>
              <Select
                value={locale}
                onChange={e => setLocale(e.target.value as Locale)}
                variant="standard"
                disableUnderline
                sx={{
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  color: '#5C4438',
                  fontSize: '0.85rem',
                  '& .MuiSelect-select': { py: 0.5, px: 1 },
                }}
              >
                <MenuItem value="en">EN</MenuItem>
                <MenuItem value="fr">FR</MenuItem>
              </Select>
            </FormControl>

            {/* Auth / Profile */}
            {user ? (
              <>
                <IconButton onClick={e => setAnchorEl(e.currentTarget)} size="small">
                  <Avatar src={user.avatar_url || undefined} sx={{ width: 36, height: 36, border: '2px solid #C88A79' }}>
                    {user.full_name.charAt(0)}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                  slotProps={{ paper: { sx: { borderRadius: 3, minWidth: 180, mt: 1 } } }}
                >
                  <MenuItem disabled className="opacity-100 font-bold text-earth-900 border-b border-cream-200">
                    {user.full_name}
                  </MenuItem>
                  <MenuItem onClick={() => setAnchorEl(null)} component={Link} href="/profile">
                    {t.nav.profile}
                  </MenuItem>
                  {user.role === 'admin' && (
                    <MenuItem onClick={() => setAnchorEl(null)} component={Link} href="/admin/dashboard" className="text-sage-700 font-semibold">
                      {t.nav.adminDashboard}
                    </MenuItem>
                  )}
                  <MenuItem
                    onClick={() => {
                      signOut();
                      setAnchorEl(null);
                    }}
                    className="text-red-600"
                  >
                    {t.nav.signOut}
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button size="small" onClick={() => handleOpenAuth('signin')} sx={{ color: '#5C4438' }}>
                  {t.nav.signIn}
                </Button>
                <Button size="small" variant="contained" onClick={() => handleOpenAuth('signup')} sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' } }}>
                  {t.nav.signUp}
                </Button>
              </div>
            )}

            {/* Mobile Menu Icon */}
            <IconButton onClick={() => setMobileMenuOpen(true)} className="md:hidden" sx={{ color: '#5C4438' }}>
              <MenuIcon />
            </IconButton>
          </div>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer Navigation */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        slotProps={{ paper: { sx: { width: 280, p: 3, background: '#FDFBF7' } } }}
      >
        <Box className="flex items-center justify-between pb-4 border-b border-cream-200">
          <Typography variant="h6" className="font-serif font-bold text-earth-900">
            Quiet Life
          </Typography>
          <IconButton onClick={() => setMobileMenuOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <List className="py-4">
          {navLinks.map(link => (
            <ListItem key={link.href} disablePadding>
              <ListItemButton onClick={() => setMobileMenuOpen(false)} component={Link} href={link.href}>
                <ListItemText primary={link.label} slotProps={{ primary: { className: 'font-serif font-medium text-earth-900' } }} />
              </ListItemButton>
            </ListItem>
          ))}
          {user && user.role === 'admin' && (
            <ListItem disablePadding>
              <ListItemButton onClick={() => setMobileMenuOpen(false)} component={Link} href="/admin/dashboard">
                <ListItemText primary={t.nav.adminDashboard} slotProps={{ primary: { className: 'font-serif font-bold text-sage-700' } }} />
              </ListItemButton>
            </ListItem>
          )}
        </List>
      </Drawer>

      {/* Drawers & Modals */}
      <BookmarkDrawer open={bookmarkOpen} onClose={() => setBookmarkOpen(false)} targetPost={null} />
      <GlobalSearchDrawer open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} initialMode={authInitialMode} />
    </>
  );
}
