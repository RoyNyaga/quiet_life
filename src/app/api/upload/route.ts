import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'covers';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = file.name?.split('.').pop() || 'webp';
    const filename = `${timestamp}-${random}.${extension}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Try Supabase Storage if remote credentials are configured (preferred for Netlify serverless)
    try {
      const supabase = createClient();
      if (supabase) {
        const bucket = safeFolder === 'avatars' ? 'avatars' : 'blog-images';
        const storagePath = safeFolder === 'avatars' ? filename : `${safeFolder}/${filename}`;

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(storagePath, buffer, {
            contentType: file.type || 'image/webp',
            upsert: true,
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(storagePath);

          if (publicUrlData?.publicUrl) {
            return NextResponse.json({
              success: true,
              url: publicUrlData.publicUrl,
              size: buffer.length,
              storage: 'supabase',
            });
          }
        }
      }
    } catch (supabaseErr) {
      console.warn('Supabase server upload failed, attempting local fallback:', supabaseErr);
    }

    // 2. Local filesystem fallback (local dev environment)
    try {
      const uploadsDir = join(process.cwd(), 'public', 'uploads', safeFolder);
      await mkdir(uploadsDir, { recursive: true });
      const filePath = join(uploadsDir, filename);
      await writeFile(filePath, buffer);

      const publicUrl = `/uploads/${safeFolder}/${filename}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        size: buffer.length,
        storage: 'local',
      });
    } catch (fsErr: any) {
      // Handles read-only serverless filesystem gracefully
      console.warn('Local filesystem write failed (expected on serverless hosts like Netlify):', fsErr);
      return NextResponse.json(
        {
          error:
            'Serverless filesystem is read-only. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Netlify site settings to enable cloud storage.',
        },
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error('Error handling upload request:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process file upload' },
      { status: 500 }
    );
  }
}
