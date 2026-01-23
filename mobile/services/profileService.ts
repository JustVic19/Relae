import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export interface UserProfile {
    id: string;
    display_name: string;
    email: string;
    avatar_url: string | null;
    created_at: string;
}

export interface UserStats {
    user_id: string;
    total_completed: number;
    current_streak: number;
    best_streak: number;
    last_completion_date: string | null;
    created_at: string;
    updated_at: string;
}

export interface Achievement {
    id: string;
    user_id: string;
    achievement_type: string;
    unlocked_at: string;
    created_at: string;
}

/**
 * Get user profile
 */
export async function getProfile(): Promise<UserProfile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('user_profiles')
        .select('id, display_name, email, avatar_url, created_at')
        .eq('id', user.id)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update display name
 */
export async function updateDisplayName(displayName: string): Promise<UserProfile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('user_profiles')
        .update({ display_name: displayName })
        .eq('id', user.id)
        .select('id, display_name, email, avatar_url, created_at')
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update avatar URL
 */
export async function updateAvatarUrl(avatarUrl: string): Promise<UserProfile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('user_profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id)
        .select('id, display_name, email, avatar_url, created_at')
        .single();

    if (error) throw error;
    return data;
}

/**
 * Upload avatar image to Supabase Storage
 */
export async function uploadAvatarImage(uri: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    console.log('Starting image manipulation...');
    // Resize image to 512x512
    const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    console.log('Image manipulated:', manipulatedImage.uri);

    // Read file as ArrayBuffer (works better in React Native)
    const response = await fetch(manipulatedImage.uri);
    const arrayBuffer = await response.arrayBuffer();

    console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);

    if (arrayBuffer.byteLength === 0) {
        throw new Error('Image processing failed - empty file');
    }

    console.log('Uploading to Supabase Storage...');

    const fileName = `${user.id}.jpg`;

    // Upload using ArrayBuffer instead of blob
    const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: true,
            cacheControl: '3600',
        });

    if (error) {
        console.error('Upload error:', error);
        throw error;
    }

    console.log('Upload successful:', data);

    // Get public URL with cache buster
    const timestamp = Date.now();
    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

    const urlWithCacheBuster = `${publicUrl}?t=${timestamp}`;

    console.log('Public URL:', urlWithCacheBuster);
    return urlWithCacheBuster;
}

/**
 * Pick image from device
 */
export async function pickImage(): Promise<string | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
        throw new Error('Permission to access camera roll is required!');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
    });

    if (result.canceled) {
        return null;
    }

    return result.assets[0].uri;
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<UserStats> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Get user achievements
 */
export async function getUserAchievements(): Promise<Achievement[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Delete account
 */
export async function deleteAccount(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id);

    if (error) throw error;
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}
