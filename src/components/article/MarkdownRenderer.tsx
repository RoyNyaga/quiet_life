'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Typography } from '@mui/material';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-stone max-w-none prose-headings:font-serif prose-headings:font-bold prose-headings:text-earth-900 prose-blockquote:border-l-terracotta-400 prose-blockquote:bg-amber-50/40 prose-blockquote:p-4 prose-blockquote:rounded-r-xl prose-img:rounded-2xl prose-a:text-terracotta-600 font-sans text-earth-800 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <Typography variant="h3" className="font-serif font-bold text-earth-900 mt-8 mb-4">
              {children}
            </Typography>
          ),
          h2: ({ children }) => (
            <Typography variant="h4" className="font-serif font-bold text-earth-900 mt-6 mb-3">
              {children}
            </Typography>
          ),
          h3: ({ children }) => (
            <Typography variant="h5" className="font-serif font-bold text-earth-900 mt-4 mb-2">
              {children}
            </Typography>
          ),
          p: ({ children }) => (
            <Typography variant="body1" className="text-earth-700 leading-relaxed mb-4">
              {children}
            </Typography>
          ),
          blockquote: ({ children }) => (
            <div className="my-6 p-4 border-l-4 border-terracotta-400 bg-amber-50/50 rounded-r-xl font-serif italic text-earth-800 text-lg">
              {children}
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
