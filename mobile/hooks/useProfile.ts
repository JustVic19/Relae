import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getProfile,
    updateDisplayName,
    updateAvatarUrl,
    uploadAvatarImage,
    pickImage,
    getUserStats,
    getUserAchievements,
    getDeepInsights,
    logout,
    UserProfile,
    UserStats,
    Achievement,
    DeepInsights,
} from '../services/profileService';

/**
 * Hook to fetch user profile
 */
export function useProfile() {
    const { data: profile, isLoading, error, refetch } = useQuery<UserProfile>({
        queryKey: ['profile'],
        queryFn: getProfile,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        profile,
        isLoading,
        error,
        refetch,
    };
}

/**
 * Hook for profile mutations
 */
export function useProfileMutations() {
    const queryClient = useQueryClient();

    const updateNameMutation = useMutation({
        mutationFn: (displayName: string) => updateDisplayName(displayName),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
    });

    const updateAvatarMutation = useMutation({
        mutationFn: (avatarUrl: string) => updateAvatarUrl(avatarUrl),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
    });

    const uploadImageMutation = useMutation({
        mutationFn: async (uri: string) => {
            console.log('Starting image upload:', uri);
            const publicUrl = await uploadAvatarImage(uri);
            console.log('Image uploaded, public URL:', publicUrl);
            const result = await updateAvatarUrl(publicUrl);
            console.log('Avatar URL updated in profile:', result);
            return result;
        },
        onSuccess: async (data) => {
            console.log('Upload mutation success, invalidating queries');
            await queryClient.invalidateQueries({ queryKey: ['profile'] });
            // Force immediate refetch
            await queryClient.refetchQueries({ queryKey: ['profile'] });
        },
        onError: (error) => {
            console.error('Upload mutation error:', error);
        },
    });

    const logoutMutation = useMutation({
        mutationFn: logout,
        onSuccess: () => {
            queryClient.clear(); // Clear all cached data on logout
        },
    });

    return {
        updateDisplayName: updateNameMutation.mutate,
        updateAvatar: updateAvatarMutation.mutate,
        uploadImage: uploadImageMutation.mutateAsync, // Use mutateAsync to await completion
        logout: logoutMutation.mutate,
        isUpdating: updateNameMutation.isPending || updateAvatarMutation.isPending || uploadImageMutation.isPending,
        isLoggingOut: logoutMutation.isPending,
    };
}

/**
 * Hook to fetch user stats
 */
export function useUserStats() {
    const { data: stats, isLoading } = useQuery<UserStats>({
        queryKey: ['userStats'],
        queryFn: getUserStats,
        staleTime: 60 * 1000, // 1 minute
    });

    return {
        stats,
        isLoading,
    };
}

/**
 * Hook to fetch user achievements
 */
export function useAchievements() {
    const { data: achievements, isLoading } = useQuery<Achievement[]>({
        queryKey: ['achievements'],
        queryFn: getUserAchievements,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        achievements: achievements || [],
        isLoading,
    };
}

/**
 * Hook to fetch deep productivity insights (Pro feature)
 */
export function useDeepInsights() {
    const { data: insights, isLoading, error } = useQuery<DeepInsights>({
        queryKey: ['deepInsights'],
        queryFn: getDeepInsights,
        staleTime: 60 * 1000, // 1 minute
    });

    return {
        insights,
        isLoading,
        error,
    };
}
