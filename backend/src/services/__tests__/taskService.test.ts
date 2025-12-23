import { describe, it, expect, vi, beforeEach } from 'vitest';
import { taskService } from '../taskService';
import { createMockTask } from '../../test/helpers';
import { mockSupabaseClient, createMockQueryBuilder } from '../../test/setup';

describe('TaskService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createTask', () => {
        it('should create task successfully', async () => {
            const mockTask = createMockTask();
            const queryBuilder = createMockQueryBuilder(mockTask);

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            const result = await taskService.createTask({
                candidate_id: mockTask.candidate_id,
                user_id: mockTask.user_id,
                title: mockTask.title,
                type: mockTask.type as any,
                module: mockTask.module,
                due_date: mockTask.due_date,
            });

            expect(result).toEqual(mockTask);
            expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks');
        });

        it('should throw error on creation failure', async () => {
            const queryBuilder = createMockQueryBuilder(null, { message: 'Creation failed' });

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            await expect(
                taskService.createTask({
                    candidate_id: 'test-candidate-id',
                    user_id: 'test-user-id',
                    title: 'Test Task',
                    type: 'DEADLINE',
                })
            ).rejects.toThrow('Failed to create task');
        });
    });

    describe('getTask', () => {
        it('should return task when found', async () => {
            const mockTask = createMockTask();
            const queryBuilder = createMockQueryBuilder(mockTask);

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            const result = await taskService.getTask(mockTask.id, mockTask.user_id);

            expect(result).toEqual(mockTask);
        });

        it('should return null when task not found', async () => {
            const queryBuilder = createMockQueryBuilder(null, { code: 'PGRST116' });

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            const result = await taskService.getTask('non-existent-id', 'user-id');

            expect(result).toBeNull();
        });
    });

    describe('getTasks', () => {
        it('should return all tasks for user', async () => {
            const mockTasks = [createMockTask(), createMockTask()];
            const queryBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: mockTasks, error: null }),
            };

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            const result = await taskService.getTasks('user-id');

            expect(result).toEqual(mockTasks);
        });

        it('should filter tasks by status', async () => {
            const mockTasks = [createMockTask({ status: 'completed' })];
            const queryBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: mockTasks, error: null }),
            };

            // Make sure eq returns the builder for chaining
            queryBuilder.eq = vi.fn().mockReturnValue(queryBuilder);

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            const result = await taskService.getTasks('user-id', { status: 'completed' });

            expect(result).toEqual(mockTasks);
            expect(queryBuilder.eq).toHaveBeenCalled();
        });
    });

    describe('updateTask', () => {
        it('should update task successfully', async () => {
            const mockTask = createMockTask({ title: 'Updated Title' });
            const queryBuilder = createMockQueryBuilder(mockTask);

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            const result = await taskService.updateTask(mockTask.id, mockTask.user_id, {
                title: 'Updated Title',
            });

            expect(result.title).toBe('Updated Title');
        });

        it('should throw error when task not found', async () => {
            const queryBuilder = createMockQueryBuilder(null, { code: 'PGRST116' });

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            await expect(
                taskService.updateTask('non-existent-id', 'user-id', { title: 'Updated' })
            ).rejects.toThrow('Task not found or access denied');
        });
    });

    describe('deleteTask', () => {
        it('should delete task successfully', async () => {
            mockSupabaseClient.from = vi.fn().mockReturnValue({
                delete: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                then: vi.fn((callback) => {
                    callback({ error: null });
                    return Promise.resolve({ error: null });
                }),
            });

            await expect(taskService.deleteTask('task-id', 'user-id')).resolves.not.toThrow();
        });
    });

    describe('completeTask', () => {
        it('should mark task as complete', async () => {
            const mockTask = createMockTask({
                status: 'completed',
                completed_at: new Date().toISOString(),
            });
            const queryBuilder = createMockQueryBuilder(mockTask);

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            const result = await taskService.completeTask(mockTask.id, mockTask.user_id);

            expect(result.status).toBe('completed');
            expect(result.completed_at).toBeTruthy();
        });

        it('should throw error when task not found', async () => {
            const queryBuilder = createMockQueryBuilder(null, { code: 'PGRST116' });

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            await expect(
                taskService.completeTask('non-existent-id', 'user-id')
            ).rejects.toThrow('Task not found or access denied');
        });
    });

    describe('getUpcomingTasks', () => {
        it('should return upcoming pending tasks', async () => {
            const mockTasks = [
                createMockTask({ status: 'pending', due_date: new Date(Date.now() + 86400000).toISOString() }),
                createMockTask({ status: 'pending', due_date: new Date(Date.now() + 172800000).toISOString() }),
            ];
            const queryBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                not: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: mockTasks, error: null }),
            };

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            const result = await taskService.getUpcomingTasks('user-id', 10);

            expect(result).toEqual(mockTasks);
        });
    });
});
