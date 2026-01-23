import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/api';

interface EmailIntegration {
    id: string;
    provider: string;
    email_address: string;
    sync_enabled: boolean;
    last_synced_at: string | null;
    created_at: string;
}

export function useEmailIntegrations() {
    const { data, isLoading, error, refetch } = useQuery<{ integrations: EmailIntegration[] }>({
        queryKey: ['email-integrations'],
        queryFn: async () => {
            return await apiRequest<{ integrations: EmailIntegration[] }>('/api/email/integrations');
        },
    });

    const hasConnectedEmail = (data?.integrations?.length ?? 0) > 0;

    return {
        integrations: data?.integrations ?? [],
        hasConnectedEmail,
        isLoading,
        error,
        refetch,
    };
}
