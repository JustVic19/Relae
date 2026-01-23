import { apiRequest } from './api';

export interface TaskComment {
    id: string;
    task_id: string;
    user_id: string;
    content: string;
    created_at: string;
    user: {
        id: string;
        display_name: string;
        avatar_url: string | null;
    };
}

export const getTaskComments = async (taskId: string): Promise<TaskComment[]> => {
    const response = await apiRequest<{ comments: TaskComment[] }>(`/api/tasks/${taskId}/comments`);
    return response.comments;
};

export const createTaskComment = async (taskId: string, content: string): Promise<TaskComment> => {
    const response = await apiRequest<{ comment: TaskComment }>(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
    });
    return response.comment;
};
