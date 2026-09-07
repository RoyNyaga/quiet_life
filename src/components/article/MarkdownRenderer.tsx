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
            <Typography component="div" variant="body1" className="text-earth-700 leading-relaxed mb-4">
              {children}
            </Typography>
          ),
          blockquote: ({ children }) => (
            <div className="my-6 p-4 border-l-4 border-terracotta-400 bg-amber-50/50 rounded-r-xl font-serif italic text-earth-800 text-lg">
              {children}
            </div>
          ),
          img: ({ src, alt }) => (
            <figure className="my-8">
              <img
                src={src || ''}
                alt={alt || ''}
                className="w-full max-h-[550px] object-cover rounded-2xl shadow-md border border-cream-200"
              />
              {alt && (
                <figcaption className="text-center text-xs text-earth-500 mt-2 italic">
                  {alt}
                </figcaption>
              )}
            </figure>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="text-terracotta-600 hover:text-terracotta-700 underline font-medium transition-colors"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto rounded-2xl border border-cream-200 bg-white shadow-xs">
              <table className="w-full text-left border-collapse text-sm text-earth-800">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-cream-100/80 p-3 font-bold border-b border-cream-200 text-earth-900">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="p-3 border-b border-cream-100">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
