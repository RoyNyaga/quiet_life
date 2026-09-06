'use client';

import { useState } from 'react';
import { Container, Typography, TextField, Button, Accordion, AccordionSummary, AccordionDetails, Snackbar, Alert, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SendIcon from '@mui/icons-material/Send';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useApp } from '@/lib/store';
import { DICTIONARY } from '@/lib/i18n';

export default function ContactPage() {
  const { locale } = useApp();
  const t = DICTIONARY[locale];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMsg('Thank you for reaching out! We will respond to your inquiry shortly.');
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  const faqs = [
    {
      q: 'What is Quiet Life all about?',
      a: 'Quiet Life is a wellness and personal development publication focusing on mindfulness, intentional living, stress reduction, and slow living.',
    },
    {
      q: 'Can I contribute an article or guest essay?',
      a: 'We welcome original essays on mindfulness, health, and personal growth! Use our contact form to submit your outline or concept.',
    },
    {
      q: 'How do newsletter subscriptions work?',
      a: 'Subscribing is completely free and requires only an email address. You will receive curated weekly reflections without spam.',
    },
    {
      q: 'Is Quiet Life available in multiple languages?',
      a: 'Yes! You can toggle between English and French at any time using the language selector in the top right navigation bar.',
    },
  ];

  return (
    <Container maxWidth="lg" className="py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <Typography variant="h3" className="font-serif font-bold text-earth-900">
          Get in Touch
        </Typography>
        <Typography variant="body1" className="text-earth-600">
          Have a question, feedback, or collaboration idea? We’d love to hear from you.
        </Typography>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Contact Form */}
        <Box className="p-8 rounded-3xl bg-white border border-cream-200 shadow-sm space-y-6">
          <Typography variant="h5" className="font-serif font-bold text-earth-900">
            Send us a Message
          </Typography>

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField fullWidth label="Your Name" value={name} onChange={e => setName(e.target.value)} required />
            <TextField fullWidth type="email" label="Your Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <TextField fullWidth label="Subject" value={subject} onChange={e => setSubject(e.target.value)} required />
            <TextField fullWidth multiline rows={4} label="Message" value={message} onChange={e => setMessage(e.target.value)} required />
            <Button fullWidth variant="contained" type="submit" size="large" endIcon={<SendIcon />} sx={{ bgcolor: '#C88A79', '&:hover': { bgcolor: '#A66E5E' }, py: 1.5 }}>
              Send Message
            </Button>
          </form>
        </Box>

        {/* Contact Info & FAQ */}
        <div className="space-y-8">
          <Box className="p-6 rounded-2xl bg-sage-50/60 border border-sage-200 space-y-4">
            <Typography variant="h6" className="font-serif font-bold text-earth-900">
              Community Contact
            </Typography>
            <div className="flex items-center gap-3 text-earth-700 text-sm">
              <EmailIcon sx={{ color: '#749D81' }} />
              <span>contact@quietlife.com</span>
            </div>
            <div className="flex items-center gap-3 text-earth-700 text-sm">
              <LocationOnIcon sx={{ color: '#749D81' }} />
              <span>Montreal, Canada & Remote Worldwide</span>
            </div>
          </Box>

          <div className="space-y-3">
            <Typography variant="h6" className="font-serif font-bold text-earth-900">
              Frequently Asked Questions
            </Typography>
            {faqs.map((faq, idx) => (
              <Accordion key={idx} elevation={0} sx={{ border: '1px solid #E8E2DA', borderRadius: '12px !important', '&:before': { display: 'none' }, mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2" className="font-serif font-bold text-earth-900">
                    {faq.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" className="text-earth-600">
                    {faq.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </div>
        </div>
      </div>

      <Snackbar open={Boolean(toastMsg)} autoHideDuration={4000} onClose={() => setToastMsg('')}>
        <Alert severity="success" sx={{ width: '100%' }}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
