'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, Typography, TextField, Button, IconButton, Chip, Box, LinearProgress, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/lib/store';
import { getLocalizedField, DICTIONARY } from '@/lib/i18n';
import { useSignIn, useSignUp } from '@/features/auth/mutations';
import { useCategories } from '@/features/categories';
import { getErrorMessage } from '@/lib/query/errors';
import { AvatarUploader } from '@/components/auth/AvatarUploader';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  promptMessage?: string;
}

export function AuthModal({ open, onClose, initialMode = 'signin', promptMessage }: AuthModalProps) {
  const router = useRouter();
  const { locale, setNotification } = useApp();
  const { data: categories = [] } = useCategories();
  const t = DICTIONARY[locale];
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // React Query Auth Mutations
  const signInMutation = useSignIn();
  const signUpMutation = useSignUp();
  const isSubmitting = signInMutation.isPending || signUpMutation.isPending;

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSuccessAuth = (role: 'admin' | 'user') => {
    onClose();
    if (role === 'admin') {
      router.push(`/${locale}/admin/dashboard`);
      router.refresh();
    } else {
      router.refresh();
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
    try {
      const result = await signUpMutation.mutateAsync({
        email: email.trim(),
        password,
        fullName: fullName.trim() || 'Mindful Reader',
        avatarUrl: avatarUrl || null,
      });

      if (result.needsEmailConfirmation) {
        setNotification({
          type: 'info',
          message: t.auth.checkEmail,
        });
        onClose();
        return;
      }

      if (result.profile) {
        handleSuccessAuth(result.profile.role);
      }
    } catch (err: unknown) {
      console.warn('Signup error:', err);
      setErrorMsg(getErrorMessage(err, locale));
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg(t.errors.invalidCredentials);
      return;
    }

    try {
      const result = await signInMutation.mutateAsync({
        email: email.trim(),
        password,
      });
      handleSuccessAuth(result.profile.role);
    } catch (err: unknown) {
      console.warn('Login error:', err);
      setErrorMsg(getErrorMessage(err, locale));
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

              {promptMessage && (
                <Box className="p-3 mb-4 rounded-xl bg-amber-50/90 border border-amber-200/90">
                  <Typography variant="body2" className="text-amber-900 font-medium text-xs sm:text-sm">
                    {promptMessage}
                  </Typography>
                </Box>
              )}

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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                    sx={inputStyles}
                  />
                </div>

                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  size="large"
                  disabled={isSubmitting}
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
                  {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t.nav.signIn}
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

                  {promptMessage && (
                    <Box className="p-3 mb-4 rounded-xl bg-amber-50/90 border border-amber-200/90">
                      <Typography variant="body2" className="text-amber-900 font-medium text-xs sm:text-sm">
                        {promptMessage}
                      </Typography>
                    </Box>
                  )}

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
                    {locale === 'fr' ? 'Photo de profil' : 'Profile Photo'}
                  </Typography>
                  <Typography variant="body2" className="text-earth-600 mb-3">
                    {locale === 'fr'
                      ? 'Téléversez une photo de profil (format 1:1). Elle sera automatiquement recadrée et compressée.'
                      : 'Upload your profile photo. It will be cropped to a 1:1 square and compressed to WebP.'}
                  </Typography>

                  <AvatarUploader
                    value={avatarUrl}
                    onChange={url => setAvatarUrl(url)}
                    label={locale === 'fr' ? 'Photo de profil' : 'Profile Photo'}
                    helperText={
                      locale === 'fr'
                        ? 'Optionnel. Recadrage carré 1:1 et compression automatique WebP.'
                        : 'Optional. 1:1 square crop with automatic WebP compression.'
                    }
                  />

                  <div className="flex items-center gap-3 mt-5">
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => setStep(1)}
                      sx={{
                        color: '#5C4438',
                        borderColor: '#E8E2DA',
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 3,
                        px: 3,
                        py: 1.3,
                      }}
                    >
                      {locale === 'fr' ? 'Retour' : 'Back'}
                    </Button>
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
                  </div>
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
                    disabled={isSubmitting}
                    sx={{
                      bgcolor: '#C88A79',
                      '&:hover': { bgcolor: '#A66E5E' },
                      py: 1.4,
                      borderRadius: 3,
                      fontWeight: 700,
                      fontSize: '0.95rem',
                    }}
                  >
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t.onboarding.finish}
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
