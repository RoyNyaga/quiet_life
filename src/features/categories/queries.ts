import { queryOptions, useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { fetchCategories } from './api';
import type { Category } from '@/types/database';

export const categoriesQueryOptions = () =>
  queryOptions<Category[]>({
    queryKey: qk.categories.all,
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

export function useCategories() {
  return useQuery(categoriesQueryOptions());
}
