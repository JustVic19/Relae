import { supabase } from '../lib/supabase';

// Base API configuration
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

interface ApiError {
    error: string;
    details?: any;
}

/**
 * Get auth token from current session
 */
async function getAuthToken(): Promise<string | null> {
    const {
        data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
}

/**
 * Make authenticated API request
 */
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await getAuthToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.error || 'API request failed');
    }

    return response.json();
}

/**
 * Save Expo Push Token
 */
export async function savePushToken(token: string): Promise<void> {
    try {
        const response = await fetch(`${BACKEND_URL}/api/notifications/push-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getAuthToken()}`,
            },
            body: JSON.stringify({ token, platform: 'expo' }),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`Failed to save push token: ${response.status} ${text}`);
        } else {
            console.log('Push token saved successfully');
        }
    } catch (error) {
        console.error('Error in savePushToken:', error);
    }
}

// ===== FEED API =====

export interface FeedResponse {
    candidates: any[];
    tasks: any[];
}

export async function getFeed(): Promise<FeedResponse> {
    return apiRequest<FeedResponse>('/api/feed');
}

export async function getNewCandidates(): Promise<{ candidates: any[] }> {
    return apiRequest('/api/feed/new');
}

export async function getUpcomingTasks(): Promise<{ tasks: any[] }> {
    return apiRequest('/api/feed/upcoming');
}

// ===== TASK API =====

export interface Task {
    id: string;
    title: string;
    type: string;
    module: string | null;
    due_date: string | null;
    notes: string | null;
    status: string;
    created_at: string;
}

export async function getTask(taskId: string): Promise<{ task: Task }> {
    return apiRequest(`/api/tasks/${taskId}`);
}

export async function getTasks(filters?: {
    status?: string;
    type?: string;
}): Promise<{ tasks: Task[] }> {
    const queryParams = new URLSearchParams(filters as any).toString();
    return apiRequest(`/api/tasks${queryParams ? `?${queryParams}` : ''}`);
}

export async function updateTask(
    taskId: string,
    updates: {
        title?: string;
        type?: string;
        module?: string;
        due_date?: string;
        notes?: string;
        status?: string;
    }
): Promise<{ task: Task }> {
    return apiRequest(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });
}

export async function deleteTask(taskId: string): Promise<{ success: boolean }> {
    return apiRequest(`/api/tasks/${taskId}`, {
        method: 'DELETE',
    });
}

export async function completeTask(taskId: string): Promise<{ task: Task }> {
    return apiRequest(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
    });
}

// ===== CANDIDATE API =====

export async function confirmCandidate(
    candidateId: string,
    overrides?: {
        title?: string;
        type?: string;
        module?: string;
        due_date?: string;
        notes?: string;
    }
): Promise<{ task: Task }> {
    return apiRequest(`/api/candidates/${candidateId}/confirm`, {
        method: 'POST',
        body: JSON.stringify(overrides || {}),
    });
}

export async function editCandidate(
    candidateId: string,
    updates: {
        title: string;
        type: string;
        module?: string;
        due_date?: string;
    }
): Promise<{ candidate: any }> {
    return apiRequest(`/api/candidates/${candidateId}/edit`, {
        method: 'POST',
        body: JSON.stringify(updates),
    });
}

export async function ignoreCandidate(
    candidateId: string,
    reason?: string
): Promise<{ success: boolean }> {
    return apiRequest(`/api/candidates/${candidateId}/ignore`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
    });
}

export async function getCandidateSource(candidateId: string): Promise<{ source: any }> {
    return apiRequest(`/api/candidates/${candidateId}/source`);
}

// ===== USER API =====

export interface UserProfile {
    id: string;
    email: string;
    created_at: string;
    updated_at: string;
}

export async function getUserProfile(): Promise<{ profile: UserProfile }> {
    return apiRequest('/api/users/me');
}

export async function updateUserProfile(updates: {
    email?: string;
}): Promise<{ profile: UserProfile }> {
    return apiRequest('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });
}

// ===== GROUP API =====

export interface Group {
    id: string;
    name: string;
    description?: string;
    code: string;
    created_at: string;
    role: 'admin' | 'member';
    member_count: number;
}

export interface GroupDetail extends Group {
    members: any[];
    tasks: any[];
}

export async function getUserGroups(): Promise<Group[]> {
    return apiRequest('/api/groups');
}

export async function createGroup(data: { name: string; description?: string }): Promise<Group> {
    return apiRequest('/api/groups', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function joinGroup(code: string): Promise<{ success: boolean; groupId: string }> {
    return apiRequest('/api/groups/join', {
        method: 'POST',
        body: JSON.stringify({ code }),
    });
}

export async function getGroupDetails(groupId: string): Promise<GroupDetail> {
    return apiRequest(`/api/groups/${groupId}`);
}

export async function createGroupTask(
    groupId: string,
    task: { title: string; due_date?: string; assigned_to?: string }
): Promise<Task> {
    return apiRequest(`/api/groups/${groupId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(task),
    });
}
