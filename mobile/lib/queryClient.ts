import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Always refetch on mount (data refresh on every visit)
            staleTime: 0,
            // Retry failed requests twice
            retry: 2,
            // Refetch when window regains focus
            refetchOnWindowFocus: true,
            // Refetch on reconnect
            refetchOnReconnect: true,
        },
        mutations: {
            // Retry mutations once on failure
            retry: 1,
        },
    },
});
