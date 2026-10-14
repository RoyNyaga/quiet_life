import { queryOptions, useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import {
  fetchReadingLists,
  fetchReadingListItems,
  fetchReadingListById,
  fetchArticlesForReadingList,
} from './api';
import type { ReadingList, ReadingListItem, Post } from '@/types/database';

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

export const readingListDetailQueryOptions = (listId: string) =>
  queryOptions<ReadingList | null>({
    queryKey: qk.readingLists.detail(listId),
    queryFn: () => fetchReadingListById(listId),
    enabled: Boolean(listId),
    staleTime: 60 * 1000,
  });

export function useReadingList(listId: string) {
  return useQuery(readingListDetailQueryOptions(listId));
}

export const readingListArticlesQueryOptions = (listId: string) =>
  queryOptions<Post[]>({
    queryKey: qk.readingLists.articles(listId),
    queryFn: () => fetchArticlesForReadingList(listId),
    enabled: Boolean(listId),
    staleTime: 60 * 1000,
  });

export function useReadingListArticles(listId: string) {
  return useQuery(readingListArticlesQueryOptions(listId));
}
