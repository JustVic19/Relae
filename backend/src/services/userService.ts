import { supabaseAdmin } from '../lib/supabase';

export interface UserProfile {
    id: string;
    email: string;
    created_at: string;
    updated_at: string;
}

export interface CreateUserProfileInput {
    id: string;
    email: string;
}

export interface UpdateUserProfileInput {
    email?: string;
}

export class UserService {
    /**
     * Get user profile by ID
     */
    async getUserProfile(userId: string): Promise<UserProfile | null> {
        const { data, error } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found
                return null;
            }
            throw new Error(`Failed to fetch user profile: ${error.message}`);
        }

        return data;
    }

    /**
     * Create a new user profile
     */
    async createUserProfile(input: CreateUserProfileInput): Promise<UserProfile> {
        const { data, error } = await supabaseAdmin
            .from('user_profiles')
            .insert({
                id: input.id,
                email: input.email,
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create user profile: ${error.message}`);
        }

        return data;
    }

    /**
     * Update user profile
     */
    async updateUserProfile(userId: string, updates: UpdateUserProfileInput): Promise<UserProfile> {
        const { data, error } = await supabaseAdmin
            .from('user_profiles')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error('User profile not found');
            }
            throw new Error(`Failed to update user profile: ${error.message}`);
        }

        return data;
    }

    /**
     * Delete user profile
     */
    async deleteUserProfile(userId: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from('user_profiles')
            .delete()
            .eq('id', userId);

        if (error) {
            throw new Error(`Failed to delete user profile: ${error.message}`);
        }
    }
}

export const userService = new UserService();
