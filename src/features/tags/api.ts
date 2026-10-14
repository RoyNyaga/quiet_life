import { createClient } from '@/lib/supabase/client';
import { parseApiResponse } from '@/lib/query/errors';
import type { Tag } from '@/types/database';
import { INITIAL_TAGS } from '@/lib/mockData';

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const supabase = createClient();
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers['Authorization'] = `Bearer ${data.session.access_token}`;
    }
  }
  return headers;
}

export async function fetchTags(): Promise<Tag[]> {
  try {
    const res = await fetch('/api/tags');
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch {
    // fallback to direct Supabase
  }

  const supabase = createClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data && data.length > 0) {
      return data;
    }
  }

  return INITIAL_TAGS;
}

export async function createTag(tag: Partial<Tag>): Promise<Tag> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/tags', {
    method: 'POST',
    headers,
    body: JSON.stringify(tag),
  });
  const json = await parseApiResponse<{ success: boolean; data: Tag }>(res);
  return json.data;
}

export async function updateTag({ id, ...patch }: { id: string } & Partial<Tag>): Promise<Tag> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/tags', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ id, ...patch }),
  });
  const json = await parseApiResponse<{ success: boolean; data: Tag }>(res);
  return json.data;
}

export async function deleteTag(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/tags?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  await parseApiResponse<{ success: boolean }>(res);
}
