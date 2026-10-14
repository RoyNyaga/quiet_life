import { queryOptions, useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { fetchReadingLists, fetchReadingListItems } from './api';
import type { ReadingList, ReadingListItem } from '@/types/database';

export const readingListsQueryOptions = (userId?: string | null) =>
  queryOptions<ReadingList[]>({
    queryKey: qk.readingLists.byUser(userId),
    queryFn: () => (userId ? fetchReadingLists(userId) : Promise.resolve([])),
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });

export function useReadingLists(userId?: string | null) {
  return useQuery(readingListsQueryOptions(userId));
}

export const readingListItemsQueryOptions = (userId?: string | null) =>
  queryOptions<ReadingListItem[]>({
    queryKey: qk.readingLists.items(userId),
    queryFn: () => (userId ? fetchReadingListItems(userId) : Promise.resolve([])),
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });

export function useReadingListItems(userId?: string | null) {
  return useQuery(readingListItemsQueryOptions(userId));
}
