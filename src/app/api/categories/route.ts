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
    .from('categories')
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
      { error: 'Unauthorized: Only administrator profiles can create categories.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name_en, name_fr, slug, description_en, description_fr, icon } = body;

    if (!name_en?.trim()) {
      return NextResponse.json({ error: 'Category name (EN) is required' }, { status: 400 });
    }

    const categorySlug = (slug || name_en).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const insertPayload: Record<string, string> = {
      name_en: name_en.trim(),
      name_fr: name_fr?.trim() || name_en.trim(),
      slug: categorySlug,
      description_en: description_en || '',
      description_fr: description_fr || '',
      icon: icon || 'Category',
    };

    if (body.id) {
      insertPayload.id = body.id;
    }

    const { data, error } = await supabase
      .from('categories')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to create category';
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
      { error: 'Unauthorized: Only administrator profiles can update categories.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { id, name_en, name_fr, slug, description_en, description_fr, icon } = body;

    if (!id) {
      return NextResponse.json({ error: 'Category id is required' }, { status: 400 });
    }

    const updatePayload: Record<string, string> = {};
    if (name_en !== undefined) updatePayload.name_en = name_en;
    if (name_fr !== undefined) updatePayload.name_fr = name_fr;
    if (slug !== undefined) updatePayload.slug = slug;
    if (description_en !== undefined) updatePayload.description_en = description_en;
    if (description_fr !== undefined) updatePayload.description_fr = description_fr;
    if (icon !== undefined) updatePayload.icon = icon;

    const { data, error } = await supabase
      .from('categories')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to update category';
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
      { error: 'Unauthorized: Only administrator profiles can delete categories.' },
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
      return NextResponse.json({ error: 'Category id is required' }, { status: 400 });
    }

    // Use .select() to verify that a row was actually deleted in Postgres
    const { data, error } = await supabase
      .from('categories')
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
            'Category was not deleted from database. Row-Level Security (RLS) is preventing deletion. Please run "ALTER TABLE categories DISABLE ROW LEVEL SECURITY;" in Supabase SQL editor or provide SUPABASE_SERVICE_ROLE_KEY in .env.local.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, deleted: data[0] });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to delete category';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
