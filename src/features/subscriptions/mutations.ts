import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { createSubscription } from './api';

export function useSubscribeNewsletter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, origin_post_id }: { email: string; origin_post_id?: string | null }) =>
      createSubscription({ email, origin_post_id }),
    meta: { successMessage: 'notifications.subscribed' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.subscriptions.all });
    },
  });
}
