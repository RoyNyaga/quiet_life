import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'covers';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Sanitize folder path
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads/[folder]/[filename]
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = file.name?.split('.').pop() || 'webp';
    const filename = `${timestamp}-${random}.${extension}`;

    const uploadsDir = join(process.cwd(), 'public', 'uploads', safeFolder);
    await mkdir(uploadsDir, { recursive: true });

    const filePath = join(uploadsDir, filename);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${safeFolder}/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      size: buffer.length,
      folder: safeFolder,
    });
  } catch (error: any) {
    console.error('Error saving uploaded file:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process file upload' },
      { status: 500 }
    );
  }
}
