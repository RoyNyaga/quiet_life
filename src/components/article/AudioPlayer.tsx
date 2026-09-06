'use client';

import { useState } from 'react';
import { Button, LinearProgress, Box, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { useApp } from '@/lib/store';
import { DICTIONARY } from '@/lib/i18n';

interface AudioPlayerProps {
  textToRead: string;
}

export function AudioPlayer({ textToRead }: AudioPlayerProps) {
  const { locale } = useApp();
  const t = DICTIONARY[locale];
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleTogglePlay = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setProgress(0);
    } else {
      const utterance = new SpeechSynthesisUtterance(textToRead.slice(0, 500));
      utterance.lang = locale === 'fr' ? 'fr-FR' : 'en-US';
      utterance.onend = () => {
        setIsPlaying(false);
        setProgress(100);
      };
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
      setProgress(30);
    }
  };

  return (
    <Box className="p-4 rounded-2xl bg-sage-50/50 border border-sage-200 flex flex-col sm:flex-row items-center justify-between gap-4 my-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-sage-600 text-white flex items-center justify-center">
          <VolumeUpIcon />
        </div>
        <div>
          <Typography variant="subtitle2" className="font-serif font-bold text-earth-900">
            {t.article.listenAudio}
          </Typography>
          <Typography variant="caption" className="text-earth-600">
            {isPlaying ? t.article.audioPlaying : 'Mindful Audio Narration'}
          </Typography>
        </div>
      </div>

      <div className="flex-1 w-full max-w-xs">
        <LinearProgress
          variant="determinate"
          value={isPlaying ? 65 : progress}
          sx={{ height: 6, borderRadius: 3, bgcolor: '#E8E2DA', '& .MuiLinearProgress-bar': { bgcolor: '#749D81' } }}
        />
      </div>

      <Button
        variant="contained"
        startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        onClick={handleTogglePlay}
        sx={{ bgcolor: '#749D81', '&:hover': { bgcolor: '#587C64' } }}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </Button>
    </Box>
  );
}
