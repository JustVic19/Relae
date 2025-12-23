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
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
