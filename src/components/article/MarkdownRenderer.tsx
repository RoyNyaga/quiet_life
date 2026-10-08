'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Pre-process markdown to handle common formatting quirks:
  // 1. Gracefully convert French angle quotes « Quote » into blockquotes
  // 2. Normalize headings missing a space after # (e.g. #heading -> # heading, ##heading -> ## heading)
  // 3. Ensure headings have a preceding blank line if preceded by normal text
  // 4. Ensure lists have a preceding blank line if preceded by normal text
  const processedContent = (content || '')
    .replace(/(?:^|\n)«\s*([^»\n]+)\s*»(?:\n|$)/g, '\n\n> « $1 »\n\n')
    .replace(/(^|\n)(#{1,6})([^\s#\n][^\n]*)/g, '$1$2 $3')
    .replace(/([^\n])\n(#{1,6}\s+[^\n]+)/g, '$1\n\n$2')
    .replace(/([^\n])\n(\s*(?:[0-9]+\.|-|\*|\+)\s+[^\n]+)/g, '$1\n\n$2');

  return (
    <div
      className="article-content max-w-[740px] mx-auto text-[#332B25] antialiased"
      style={{
        fontFamily: "'Inter', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: '1.125rem', // 18px
        lineHeight: 1.9,
        letterSpacing: '0.005em',
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-serif font-bold text-2xl sm:text-3xl md:text-[2rem] text-[#261D17] mt-10 mb-4 tracking-tight leading-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#261D17] mt-10 mb-4 tracking-tight leading-snug border-b border-[#EAE3DA] pb-2.5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-serif font-bold text-lg sm:text-xl text-[#261D17] mt-8 mb-3 leading-snug">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="font-serif font-bold text-base sm:text-lg text-[#261D17] mt-6 mb-2.5">
              {children}
            </h4>
          ),
          p: ({ node, children }: any) => {
            const hasImage = node?.children?.some(
              (child: any) => child.type === 'element' && child.tagName === 'img'
            );
            if (hasImage) {
              return <div className="mb-7 font-normal">{children}</div>;
            }
            return (
              <p className="text-[#362E27] text-[1.125rem] leading-[1.9] mb-7 font-normal">
                {children}
              </p>
            );
          },
          blockquote: ({ children }) => (
            <div className="relative my-8 p-6 sm:p-7 rounded-2xl bg-[#F8F5F0] border-l-4 border-[#C88A79] shadow-xs">
              <div className="absolute top-4 right-4 text-[#D9B5AA] opacity-50 select-none">
                <FormatQuoteIcon fontSize="large" />
              </div>
              <div className="font-serif italic text-lg sm:text-xl text-[#3A2E26] leading-relaxed relative z-10">
                {children}
              </div>
            </div>
          ),
          ul: ({ children }) => (
            <ul
              className="my-6 space-y-3 pl-8 list-disc marker:text-[#C88A79]"
              style={{ listStyleType: 'disc', paddingLeft: '2rem' }}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              className="my-6 space-y-3 pl-8 list-decimal marker:text-[#C88A79] marker:font-bold"
              style={{ listStyleType: 'decimal', paddingLeft: '2rem' }}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li
              className="text-[#362E27] text-[1.125rem] leading-[1.85] pl-1.5"
              style={{ display: 'list-item' }}
            >
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-[#201813]">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic font-serif text-[#312620]">
              {children}
            </em>
          ),
          hr: () => (
            <div className="my-12 flex items-center justify-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C88A79]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#749D81]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#C88A79]" />
            </div>
          ),
          img: ({ src, alt }) => (
            <figure className="my-10">
              <img
                src={src || ''}
                alt={alt || ''}
                className="w-full max-h-[560px] object-cover rounded-3xl shadow-sm border border-[#EAE3DA]"
              />
              {alt && (
                <figcaption className="text-center text-xs text-[#7A695E] mt-2.5 font-medium italic">
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
              className="text-[#C88A79] underline decoration-[#E5C2B6] underline-offset-4 hover:text-[#A66E5E] hover:decoration-[#C88A79] font-medium transition-colors"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-8 overflow-x-auto rounded-2xl border border-[#EAE3DA] bg-white shadow-xs">
              <table className="w-full text-left border-collapse text-sm text-[#332B25]">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-[#FAF7F2] p-3.5 font-bold border-b border-[#EAE3DA] text-[#261D17]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="p-3.5 border-b border-[#F2ECE4]">
              {children}
            </td>
          ),
          code: ({ className, children }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <pre className="my-6 p-5 rounded-2xl bg-[#261E19] text-[#FDFBF7] font-mono text-sm overflow-x-auto leading-relaxed border border-[#3D322B]">
                  <code>{children}</code>
                </pre>
              );
            }
            return (
              <code className="px-1.5 py-0.5 rounded-md bg-[#F2EDE5] text-[#A66E5E] font-mono text-[0.92em] font-semibold">
                {children}
              </code>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
