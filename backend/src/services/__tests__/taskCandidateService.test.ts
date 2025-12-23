import { describe, it, expect, vi, beforeEach } from 'vitest';
import { taskCandidateService } from '../taskCandidateService';
import { createMockCandidate, createMockTask } from '../../test/helpers';
import { mockSupabaseClient, createMockQueryBuilder } from '../../test/setup';

// Mock taskService
vi.mock('../taskService', () => ({
    taskService: {
        createTask: vi.fn(),
    },
}));

import { taskService } from '../taskService';

describe('TaskCandidateService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getCandidates', () => {
        it('should return all candidates for user', async () => {
            const mockCandidates = [createMockCandidate(), createMockCandidate()];
            const queryBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: mockCandidates, error: null }),
            };

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            const result = await taskCandidateService.getCandidates('user-id');

            expect(result).toEqual(mockCandidates);
        });

        it('should filter candidates by status', async () => {
            const mockCandidates = [createMockCandidate({ status: 'new' })];

            // Create proper chainable builder
            const builder = {
                select: vi.fn(),
                eq: vi.fn(),
                order: vi.fn().mockResolvedValue({ data: mockCandidates, error: null }),
            };

            // Make select and eq chainable - they return the builder itself
            builder.select.mockReturnValue(builder);
            builder.eq.mockReturnValue(builder);

            mockSupabaseClient.from = vi.fn().mockReturnValue(builder);

            const result = await taskCandidateService.getCandidates('user-id', 'new');

            expect(result).toEqual(mockCandidates);
            expect(builder.eq).toHaveBeenCalledTimes(2); // user_id and status
        });
    });

    describe('getCandidate', () => {
        it('should return candidate when found', async () => {
            const mockCandidate = createMockCandidate();
            const queryBuilder = createMockQueryBuilder(mockCandidate);

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            const result = await taskCandidateService.getCandidate(mockCandidate.id, mockCandidate.user_id);

            expect(result).toEqual(mockCandidate);
        });

        it('should return null when candidate not found', async () => {
            const queryBuilder = createMockQueryBuilder(null, { code: 'PGRST116' });

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            const result = await taskCandidateService.getCandidate('non-existent-id', 'user-id');

            expect(result).toBeNull();
        });
    });

    describe('confirmCandidate', () => {
        it('should confirm candidate and create task', async () => {
            const mockCandidate = createMockCandidate();
            const mockTask = createMockTask();
            const updatedCandidate = { ...mockCandidate, status: 'confirmed' };

            // Mock getCandidate call
            const getCandidateBuilder = createMockQueryBuilder(mockCandidate);

            // Mock update call
            const updateBuilder = createMockQueryBuilder(updatedCandidate);

            mockSupabaseClient.from = vi.fn()
                .mockReturnValueOnce(getCandidateBuilder) // First call for getCandidate
                .mockReturnValueOnce(updateBuilder); // Second call for update

            // Mock taskService.createTask
            (taskService.createTask as any).mockResolvedValue(mockTask);

            const result = await taskCandidateService.confirmCandidate(
                mockCandidate.id,
                mockCandidate.user_id
            );

            expect(result.task).toEqual(mockTask);
            expect(result.candidate.status).toBe('confirmed');
            expect(taskService.createTask).toHaveBeenCalled();
        });

        it('should throw error when candidate not found', async () => {
            const queryBuilder = createMockQueryBuilder(null, { code: 'PGRST116' });

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            await expect(
                taskCandidateService.confirmCandidate('non-existent-id', 'user-id')
            ).rejects.toThrow('Candidate not found');
        });

        it('should throw error when candidate already processed', async () => {
            const mockCandidate = createMockCandidate({ status: 'confirmed' });
            const queryBuilder = createMockQueryBuilder(mockCandidate);

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            await expect(
                taskCandidateService.confirmCandidate(mockCandidate.id, mockCandidate.user_id)
            ).rejects.toThrow('Candidate already processed');
        });
    });

    describe('editCandidate', () => {
        it('should edit candidate successfully', async () => {
            const mockCandidate = createMockCandidate({ title: 'Updated Title', status: 'edited' });
            const queryBuilder = createMockQueryBuilder(mockCandidate);

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            const result = await taskCandidateService.editCandidate('candidate-id', 'user-id', {
                title: 'Updated Title',
                type: 'DEADLINE',
            });

            expect(result.title).toBe('Updated Title');
            expect(result.status).toBe('edited');
        });

        it('should throw error when candidate not found', async () => {
            const queryBuilder = createMockQueryBuilder(null, { code: 'PGRST116' });

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            await expect(
                taskCandidateService.editCandidate('non-existent-id', 'user-id', {
                    title: 'Updated',
                    type: 'DEADLINE',
                })
            ).rejects.toThrow('Candidate not found or access denied');
        });
    });

    describe('ignoreCandidate', () => {
        it('should ignore candidate successfully', async () => {
            const mockCandidate = createMockCandidate({ status: 'ignored' });
            const queryBuilder = createMockQueryBuilder(mockCandidate);

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            const result = await taskCandidateService.ignoreCandidate('candidate-id', 'user-id');

            expect(result.status).toBe('ignored');
        });

        it('should ignore candidate with reason', async () => {
            const mockCandidate = createMockCandidate({ status: 'ignored' });
            const queryBuilder = createMockQueryBuilder(mockCandidate);

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            const result = await taskCandidateService.ignoreCandidate(
                'candidate-id',
                'user-id',
                'not_a_task'
            );

            expect(result.status).toBe('ignored');
        });
    });

    describe('getNewCandidates', () => {
        it('should return new candidates sorted by confidence', async () => {
            const mockCandidates = [
                createMockCandidate({ confidence_score: 0.95 }),
                createMockCandidate({ confidence_score: 0.85 }),
            ];

            mockSupabaseClient.from = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                then: vi.fn((callback) => {
                    callback({ data: mockCandidates, error: null });
                    return Promise.resolve({ data: mockCandidates, error: null });
                }),
            });

            const result = await taskCandidateService.getNewCandidates('user-id');

            expect(result).toEqual(mockCandidates);
        });
    });

    describe('getCandidateSource', () => {
        it('should return source message for candidate', async () => {
            const mockCandidate = createMockCandidate();
            const mockSource = {
                subject: 'Assignment Due',
                from_name: 'Professor',
                from_email: 'prof@university.edu',
                received_at: new Date().toISOString(),
                body_snippet: 'Your assignment is due next week',
                urls: ['https://example.com/assignment'],
            };

            const getCandidateBuilder = createMockQueryBuilder(mockCandidate);
            const getSourceBuilder = createMockQueryBuilder(mockSource);

            mockSupabaseClient.from = vi.fn()
                .mockReturnValueOnce(getCandidateBuilder)
                .mockReturnValueOnce(getSourceBuilder);

            const result = await taskCandidateService.getCandidateSource(mockCandidate.id, mockCandidate.user_id);

            expect(result).toEqual(mockSource);
        });

        it('should throw error when candidate not found', async () => {
            const queryBuilder = createMockQueryBuilder(null, { code: 'PGRST116' });

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            await expect(
                taskCandidateService.getCandidateSource('non-existent-id', 'user-id')
            ).rejects.toThrow('Candidate not found');
        });
    });
});
