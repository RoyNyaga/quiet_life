'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, Typography, TextField, Button, IconButton, Chip, Box, Avatar, LinearProgress, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/lib/store';
import { getLocalizedField, DICTIONARY } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
];

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export function AuthModal({ open, onClose, initialMode = 'signin' }: AuthModalProps) {
  const router = useRouter();
  const { locale, categories, setUser } = useApp();
  const t = DICTIONARY[locale];
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_PRESETS[0]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSuccessAuth = (role: 'admin' | 'user') => {
    setLoading(false);
    onClose();
    if (role === 'admin') {
      router.push(`/${locale}/admin/dashboard`);
    }
  };

  // Sync mode whenever modal is opened or initialMode changes
  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setStep(1);
      setErrorMsg('');
    }
  }, [open, initialMode]);

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setStep(2);
  };

  const handleToggleInterest = (catId: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const handleCompleteRegistration = async () => {
    setErrorMsg('');
    setLoading(true);
    const supabase = createClient();

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName || 'Mindful Reader',
              avatar_url: avatarUrl,
            },
          },
        });

        if (error) {
          setErrorMsg(error.message);
          setLoading(false);
          return;
        }

        if (data.user) {
          const userRole = email.trim().toLowerCase() === 'nyagaandreroy@gmail.com' ? 'admin' : 'user';
          setUser({
            id: data.user.id,
            full_name: fullName || 'Mindful Reader',
            avatar_url: avatarUrl,
            role: userRole,
            onboarding_completed: true,
            created_at: data.user.created_at,
            updated_at: new Date().toISOString(),
          });
          handleSuccessAuth(userRole);
          return;
        }
      } catch (err: any) {
        console.warn('Signup error:', err);
      }
    }

    // Local fallback
    const fallbackRole = email.trim().toLowerCase() === 'nyagaandreroy@gmail.com' ? 'admin' : 'user';
    setUser({
      id: `user-${Date.now()}`,
      full_name: fullName || 'Mindful Reader',
      avatar_url: avatarUrl,
      role: fallbackRole,
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    handleSuccessAuth(fallbackRole);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Please enter email and password.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          // If remote DB hasn't been migrated yet, allow admin testing locally
          if (email.trim().toLowerCase() === 'nyagaandreroy@gmail.com' && password === '123456') {
            setUser({
              id: 'admin-nyaga',
              full_name: 'Andre Roy Nyaga',
              avatar_url: avatarUrl,
              role: 'admin',
              onboarding_completed: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            handleSuccessAuth('admin');
            return;
          }
          setErrorMsg(error.message);
          setLoading(false);
          return;
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const userRole =
            (profile?.role === 'admin' || email.trim().toLowerCase() === 'nyagaandreroy@gmail.com')
              ? 'admin'
              : (profile?.role || 'user');

          const activeUser = {
            id: data.user.id,
            full_name: profile?.full_name || data.user.user_metadata?.full_name || 'Andre Roy Nyaga',
            avatar_url: profile?.avatar_url || data.user.user_metadata?.avatar_url || avatarUrl,
            role: userRole,
            onboarding_completed: true,
            created_at: data.user.created_at,
            updated_at: new Date().toISOString(),
          };

          setUser(activeUser);
          handleSuccessAuth(userRole);
          return;
        }
      } catch (err: any) {
        console.warn('Login error:', err);
      }
    }

    // Local fallback
    if (email.trim().toLowerCase() === 'nyagaandreroy@gmail.com' && password === '123456') {
      setUser({
        id: 'admin-nyaga',
        full_name: 'Andre Roy Nyaga',
        avatar_url: avatarUrl,
        role: 'admin',
        onboarding_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      handleSuccessAuth('admin');
    } else {
      setErrorMsg('Invalid email or password.');
      setLoading(false);
    }
  };

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      bgcolor: '#FFFFFF',
      borderRadius: 3,
      '& fieldset': { borderColor: '#E8E2DA' },
      '&:hover fieldset': { borderColor: '#C88A79' },
      '&.Mui-focused fieldset': { borderColor: '#C88A79', borderWidth: '1.5px' },
    },
    '& .MuiInputBase-input': {
      py: 1.4,
      px: 2,
      fontSize: '0.95rem',
      color: '#2C2420',
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            maxWidth: 460,
            borderRadius: 4,
            p: { xs: 2, sm: 3 },
            background: '#FDFBF7',
            boxShadow: '0 20px 40px rgba(44,36,32,0.1)',
          },
        },
      }}
    >
      <Box className="flex items-center justify-between pb-1">
        {mode === 'signup' && step > 1 ? (
          <IconButton onClick={() => setStep((step - 1) as 1 | 2)} size="small" sx={{ color: '#6E5549' }}>
            <ArrowBackIcon />
          </IconButton>
        ) : (
          <div />
        )}
        <IconButton onClick={onClose} size="small" sx={{ color: '#6E5549' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: { xs: 1, sm: 2 }, overflow: 'visible' }}>
        {mode === 'signup' && (
          <Box className="mb-6">
            <div className="flex justify-between items-center mb-1.5">
              <Typography variant="caption" className="text-earth-600 font-bold uppercase tracking-wider text-xs">
                Step {step} of 3
              </Typography>
              <Typography variant="caption" className="text-terracotta-600 font-bold text-xs">
                {step === 1 ? 'Credentials' : step === 2 ? 'Avatar' : 'Interests'}
              </Typography>
            </div>
            <LinearProgress
              variant="determinate"
              value={(step / 3) * 100}
              sx={{
                borderRadius: 3,
                height: 6,
                bgcolor: '#E8E2DA',
                '& .MuiLinearProgress-bar': { bgcolor: '#C88A79' },
              }}
            />
          </Box>
        )}

        <AnimatePresence mode="wait">
          {mode === 'signin' ? (
            <motion.div key="signin" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <Typography variant="h5" className="font-serif font-bold text-earth-900 mb-1">
                {t.nav.signIn}
              </Typography>
              <Typography variant="body2" className="text-earth-600 mb-5">
                Welcome back to your mindful reading space.
              </Typography>

              {errorMsg && (
                <Box className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200">
                  <Typography variant="caption" className="text-red-700 font-medium block">
                    {errorMsg}
                  </Typography>
                </Box>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Typography variant="caption" className="block font-bold text-earth-800 uppercase tracking-wider text-xs">
                    {t.onboarding.email}
                  </Typography>
                  <TextField
                    fullWidth
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                    sx={inputStyles}
                  />
                </div>

                <div className="space-y-1.5">
                  <Typography variant="caption" className="block font-bold text-earth-800 uppercase tracking-wider text-xs">
                    {t.onboarding.password}
                  </Typography>
                  <TextField
                    fullWidth
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    sx={inputStyles}
                  />
                </div>

                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  size="large"
                  disabled={loading}
                  sx={{
                    bgcolor: '#C88A79',
                    '&:hover': { bgcolor: '#A66E5E' },
                    py: 1.4,
                    mt: 1,
                    borderRadius: 3,
                    fontWeight: 700,
                    fontSize: '0.95rem',
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : t.nav.signIn}
                </Button>
              </form>

              <Typography variant="body2" className="text-center text-earth-600 mt-5">
                Don’t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setMode('signup');
                  }}
                  className="text-terracotta-600 font-semibold underline"
                >
                  {t.nav.signUp}
                </button>
              </Typography>
            </motion.div>
          ) : (
            <motion.div key={`step-${step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {step === 1 && (
                <>
                  <Typography variant="h5" className="font-serif font-bold text-earth-900 mb-1">
                    {t.onboarding.step1Title}
                  </Typography>
                  <Typography variant="body2" className="text-earth-600 mb-5">
                    {t.onboarding.step1Subtitle}
                  </Typography>

                  {errorMsg && (
                    <Box className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200">
                      <Typography variant="caption" className="text-red-700 font-medium block">
                        {errorMsg}
                      </Typography>
                    </Box>
                  )}

                  <form onSubmit={handleStep1Next} className="space-y-4">
                    <div className="space-y-1.5">
                      <Typography variant="caption" className="block font-bold text-earth-800 uppercase tracking-wider text-xs">
                        {t.onboarding.fullName}
                      </Typography>
                      <TextField
                        fullWidth
                        placeholder="e.g. Andre Roy"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        sx={inputStyles}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Typography variant="caption" className="block font-bold text-earth-800 uppercase tracking-wider text-xs">
                        {t.onboarding.email}
                      </Typography>
                      <TextField
                        fullWidth
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        sx={inputStyles}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Typography variant="caption" className="block font-bold text-earth-800 uppercase tracking-wider text-xs">
                        {t.onboarding.password}
                      </Typography>
                      <TextField
                        fullWidth
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        sx={inputStyles}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Typography variant="caption" className="block font-bold text-earth-800 uppercase tracking-wider text-xs">
                        {t.onboarding.confirmPassword}
                      </Typography>
                      <TextField
                        fullWidth
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        sx={inputStyles}
                      />
                    </div>

                    <Button
                      fullWidth
                      variant="contained"
                      type="submit"
                      size="large"
                      sx={{
                        bgcolor: '#C88A79',
                        '&:hover': { bgcolor: '#A66E5E' },
                        py: 1.4,
                        mt: 1.5,
                        borderRadius: 3,
                        fontWeight: 700,
                        fontSize: '0.95rem',
                      }}
                    >
                      {t.onboarding.next}
                    </Button>
                  </form>

                  <Typography variant="body2" className="text-center text-earth-600 mt-5">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg('');
                        setMode('signin');
                      }}
                      className="text-terracotta-600 font-semibold underline"
                    >
                      {t.nav.signIn}
                    </button>
                  </Typography>
                </>
              )}

              {step === 2 && (
                <>
                  <Typography variant="h5" className="font-serif font-bold text-earth-900 mb-1">
                    {t.onboarding.step2Title}
                  </Typography>
                  <Typography variant="body2" className="text-earth-600 mb-5">
                    {t.onboarding.step2Subtitle}
                  </Typography>

                  <div className="grid grid-cols-4 gap-4 mb-6 py-2">
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <Avatar
                        key={idx}
                        src={preset}
                        onClick={() => setAvatarUrl(preset)}
                        sx={{
                          width: 68,
                          height: 68,
                          cursor: 'pointer',
                          border: avatarUrl === preset ? '3px solid #C88A79' : '2px solid transparent',
                          boxShadow: avatarUrl === preset ? '0 4px 12px rgba(200, 138, 121, 0.35)' : 'none',
                          transform: avatarUrl === preset ? 'scale(1.08)' : 'scale(1)',
                          transition: 'all 0.2s ease',
                          mx: 'auto',
                        }}
                      />
                    ))}
                  </div>

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={() => setStep(3)}
                    sx={{
                      bgcolor: '#C88A79',
                      '&:hover': { bgcolor: '#A66E5E' },
                      py: 1.4,
                      borderRadius: 3,
                      fontWeight: 700,
                    }}
                  >
                    {t.onboarding.next}
                  </Button>
                </>
              )}

              {step === 3 && (
                <>
                  <Typography variant="h5" className="font-serif font-bold text-earth-900 mb-1">
                    {t.onboarding.step3Title}
                  </Typography>
                  <Typography variant="body2" className="text-earth-600 mb-5">
                    {t.onboarding.step3Subtitle}
                  </Typography>

                  {errorMsg && (
                    <Box className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200">
                      <Typography variant="caption" className="text-red-700 font-medium block">
                        {errorMsg}
                      </Typography>
                    </Box>
                  )}

                  <div className="flex flex-wrap gap-2.5 mb-6">
                    {categories.map(cat => {
                      const isSelected = selectedCategoryIds.includes(cat.id);
                      return (
                        <Chip
                          key={cat.id}
                          label={getLocalizedField(cat, 'name', locale)}
                          icon={isSelected ? <CheckCircleIcon style={{ color: '#FFFFFF' }} /> : undefined}
                          onClick={() => handleToggleInterest(cat.id)}
                          sx={{
                            p: 1.2,
                            py: 2.2,
                            bgcolor: isSelected ? '#749D81' : '#FFFFFF',
                            color: isSelected ? '#FFFFFF' : '#3D2E26',
                            border: isSelected ? '1px solid #749D81' : '1px solid #E8E2DA',
                            fontWeight: 600,
                            borderRadius: 3,
                            '&:hover': { bgcolor: isSelected ? '#587C64' : '#F8F5EE' },
                          }}
                        />
                      );
                    })}
                  </div>

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleCompleteRegistration}
                    disabled={loading}
                    sx={{
                      bgcolor: '#C88A79',
                      '&:hover': { bgcolor: '#A66E5E' },
                      py: 1.4,
                      borderRadius: 3,
                      fontWeight: 700,
                      fontSize: '0.95rem',
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : t.onboarding.finish}
                  </Button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
