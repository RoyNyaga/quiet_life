import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

async function verifyIsAdmin(request: NextRequest, supabase: NonNullable<ReturnType<typeof getAdminClient>>): Promise<boolean> {
  // 1. Check Bearer token in Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile?.role === 'admin' || user.email?.toLowerCase() === 'nyagaandreroy@gmail.com') {
        return true;
      }
    }
  }

  // 2. Check x-user-role and x-user-id headers
  const roleHeader = request.headers.get('x-user-role');
  const userIdHeader = request.headers.get('x-user-id');
  if (roleHeader === 'admin') {
    if (userIdHeader) {
      if (userIdHeader.startsWith('admin-')) {
        return true;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userIdHeader)
        .single();
      if (profile && profile.role !== 'admin') {
        return false;
      }
    }
    return true;
  }

  return false;
}

export async function GET() {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
  }

  const isAdmin = await verifyIsAdmin(request, supabase);
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized: Only administrator profiles can create tags.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name_en, name_fr, slug } = body;

    if (!name_en?.trim()) {
      return NextResponse.json({ error: 'Tag name (EN) is required' }, { status: 400 });
    }

    const tagSlug = (slug || name_en).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const insertPayload: Record<string, string> = {
      name_en: name_en.trim(),
      name_fr: name_fr?.trim() || name_en.trim(),
      slug: tagSlug,
    };

    if (body.id) {
      insertPayload.id = body.id;
    }

    const { data, error } = await supabase
      .from('tags')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to create tag';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
  }

  const isAdmin = await verifyIsAdmin(request, supabase);
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized: Only administrator profiles can update tags.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { id, name_en, name_fr, slug } = body;

    if (!id) {
      return NextResponse.json({ error: 'Tag id is required' }, { status: 400 });
    }

    const updatePayload: Record<string, string> = {};
    if (name_en !== undefined) updatePayload.name_en = name_en;
    if (name_fr !== undefined) updatePayload.name_fr = name_fr;
    if (slug !== undefined) updatePayload.slug = slug;

    const { data, error } = await supabase
      .from('tags')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to update tag';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
  }

  const isAdmin = await verifyIsAdmin(request, supabase);
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized: Only administrator profiles can delete tags.' },
      { status: 403 }
    );
  }

  try {
    let id = request.nextUrl.searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {
        // query param fallback
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Tag id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Tag was not deleted from database. Row-Level Security (RLS) is preventing deletion. Please run "ALTER TABLE tags DISABLE ROW LEVEL SECURITY;" in Supabase SQL editor or provide SUPABASE_SERVICE_ROLE_KEY in .env.local.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, deleted: data[0] });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to delete tag';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
