import { createClient } from '@/lib/supabase/client';
import { AppError, throwIfError, parseApiResponse } from '@/lib/query/errors';
import type { Category } from '@/types/database';
import { INITIAL_CATEGORIES } from '@/lib/mockData';

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

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch('/api/categories');
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch {
    // fall back to direct Supabase read
  }

  const supabase = createClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data && data.length > 0) {
      return data;
    }
  }

  return INITIAL_CATEGORIES;
}

export async function createCategory(cat: Partial<Category>): Promise<Category> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers,
    body: JSON.stringify(cat),
  });
  const json = await parseApiResponse<{ success: boolean; data: Category }>(res);
  return json.data;
}

export async function updateCategory({ id, ...patch }: { id: string } & Partial<Category>): Promise<Category> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/categories', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ id, ...patch }),
  });
  const json = await parseApiResponse<{ success: boolean; data: Category }>(res);
  return json.data;
}

export async function deleteCategory(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  await parseApiResponse<{ success: boolean }>(res);
}
