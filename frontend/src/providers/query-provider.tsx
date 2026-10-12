'use client';

import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from '@/components/ui/toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    mutationCache: new MutationCache({
      onSuccess: (data: any, variables: any, context: any, mutation: any) => {
        const disableToast = mutation.meta?.disableToast;
        if (disableToast) return;
        
        toast.add({
          type: 'success',
          title: mutation.meta?.successMessage || data?.message || 'Success',
          description: mutation.meta?.successDescription || 'The operation completed successfully.',
        });
      },
      onError: (error: any, variables: any, context: any, mutation: any) => {
        const disableToast = mutation.meta?.disableToast;
        if (disableToast) return;
        
        toast.add({
          type: 'error',
          title: mutation.meta?.errorMessage || 'An error occurred',
          description: error?.message || 'Something went wrong while processing your request.',
        });
      }
    })
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
