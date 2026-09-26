'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Button,
  IconButton,
  Drawer,
  CircularProgress,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArticleIcon from '@mui/icons-material/Article';
import CategoryIcon from '@mui/icons-material/Category';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PeopleIcon from '@mui/icons-material/People';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SpaIcon from '@mui/icons-material/Spa';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { DICTIONARY } from '@/lib/i18n';
import { useApp } from '@/lib/store';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, locale, isAuthReady } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const t = DICTIONARY[locale]?.admin || DICTIONARY.en.admin;

  // Wait for auth initialization
  if (!isAuthReady) {
    return (
      <Box className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <CircularProgress sx={{ color: '#C88A79' }} />
      </Box>
    );
  }

  // Protect Admin section
  if (!user || user.role !== 'admin') {
    return (
      <Box className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#FDFBF7]">
        <Typography variant="h5" className="font-serif font-bold text-earth-900 text-xl sm:text-2xl mb-2">
          {t.accessRestricted}
        </Typography>
        <Typography variant="body1" className="text-earth-600 mb-6 max-w-md">
          {t.accessRestrictedDesc}
        </Typography>
        <Button variant="contained" onClick={() => router.push(`/${locale}`)} sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' } }}>
          {t.returnHome}
        </Button>
      </Box>
    );
  }

  const adminMenu = [
    { label: t.dashboard, href: `/${locale}/admin/dashboard`, icon: <DashboardIcon /> },
    { label: t.posts, href: `/${locale}/admin/posts`, icon: <ArticleIcon /> },
    { label: t.categories, href: `/${locale}/admin/categories`, icon: <CategoryIcon /> },
    { label: t.tags, href: `/${locale}/admin/tags`, icon: <LocalOfferIcon /> },
    { label: t.users, href: `/${locale}/admin/users`, icon: <PeopleIcon /> },
    { label: t.subscribers, href: `/${locale}/admin/subscribers`, icon: <MarkEmailReadIcon /> },
  ];

  const renderSidebarContent = (isMobile: boolean = false) => (
    <div className="flex flex-col justify-between h-full">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/${locale}/admin/dashboard`}
            onClick={() => {
              if (isMobile) setMobileOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 text-earth-900"
          >
            <div className="w-9 h-9 rounded-xl bg-sage-100 flex items-center justify-center text-sage-700">
              <SpaIcon />
            </div>
            <div>
              <Typography variant="subtitle1" className="font-serif font-bold text-earth-900 leading-none">
                Quiet Life
              </Typography>
              <Typography variant="caption" className="text-sage-700 font-bold uppercase tracking-wider text-[10px]">
                {t.portal}
              </Typography>
            </div>
          </Link>

          {isMobile && (
            <IconButton
              onClick={() => setMobileOpen(false)}
              size="small"
              sx={{ color: '#5C4438' }}
              aria-label="close drawer"
            >
              <CloseIcon />
            </IconButton>
          )}
        </div>

        <List className="space-y-1 p-0">
          {adminMenu.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <ListItem key={item.href} disablePadding>
                <ListItemButton
                  component={Link}
                  href={item.href}
                  onClick={() => {
                    if (isMobile) setMobileOpen(false);
                  }}
                  sx={{
                    borderRadius: 3,
                    bgcolor: isActive ? 'rgba(116,157,129,0.15)' : 'transparent',
                    color: isActive ? '#587C64' : '#5C4438',
                    fontWeight: isActive ? 700 : 500,
                    '&:hover': { bgcolor: 'rgba(116,157,129,0.1)' },
                  }}
                >
                  <ListItemIcon sx={{ color: isActive ? '#587C64' : '#8C7A70', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} slotProps={{ primary: { className: 'text-sm font-medium' } }} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </div>

      <div className="pt-4 border-t border-cream-200 space-y-3">
        <Link href={`/${locale}`} onClick={() => { if (isMobile) setMobileOpen(false); }}>
          <Button fullWidth size="small" startIcon={<ArrowBackIcon />} sx={{ color: '#5C4438' }}>
            {t.backToSite}
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F5EE] flex flex-col md:flex-row">
      {/* Mobile Top App Bar with Sidebar Toggle */}
      <header className="md:hidden bg-white border-b border-cream-200 px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconButton
            onClick={() => setMobileOpen(true)}
            edge="start"
            aria-label="open admin menu"
            sx={{ color: '#5C4438' }}
          >
            <MenuIcon />
          </IconButton>
          <Link href={`/${locale}/admin/dashboard`} className="flex items-center gap-2 text-earth-900">
            <div className="w-8 h-8 rounded-xl bg-sage-100 flex items-center justify-center text-sage-700">
              <SpaIcon fontSize="small" />
            </div>
            <div>
              <Typography variant="subtitle2" className="font-serif font-bold text-earth-900 leading-none">
                Quiet Life
              </Typography>
              <Typography variant="caption" className="text-sage-700 font-bold uppercase tracking-wider text-[9px] block">
                Admin Portal
              </Typography>
            </div>
          </Link>
        </div>

        <Link href={`/${locale}`}>
          <Button size="small" startIcon={<ArrowBackIcon />} sx={{ color: '#5C4438', textTransform: 'none', fontSize: '12px' }}>
            Site
          </Button>
        </Link>
      </header>

      {/* Mobile Slide-Out Drawer */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        slotProps={{
          paper: {
            sx: {
              width: 280,
              bgcolor: '#FFFFFF',
              borderRight: '1px solid #E8E2DA',
              p: 2,
            },
          },
        }}
      >
        {renderSidebarContent(true)}
      </Drawer>

      {/* Desktop Persistent Sidebar */}
      <aside className="w-64 bg-white border-r border-cream-200 hidden md:flex flex-col justify-between p-4 sticky top-0 h-screen shrink-0">
        {renderSidebarContent(false)}
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 max-w-6xl overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
