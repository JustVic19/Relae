import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from '../userService';
import { createMockUser } from '../../test/helpers';
import { mockSupabaseClient, createMockQueryBuilder } from '../../test/setup';

describe('UserService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getUserProfile', () => {
        it('should return user profile when found', async () => {
            const mockUser = createMockUser();
            const queryBuilder = createMockQueryBuilder(mockUser);

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            const result = await userService.getUserProfile(mockUser.id);

            expect(result).toEqual(mockUser);
            expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles');
        });

        it('should return null when user not found', async () => {
            const queryBuilder = createMockQueryBuilder(null, { code: 'PGRST116' });

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            const result = await userService.getUserProfile('non-existent-id');

            expect(result).toBeNull();
        });

        it('should throw error on database error', async () => {
            const queryBuilder = createMockQueryBuilder(null, { message: 'Database error', code: 'ERROR' });

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            await expect(userService.getUserProfile('test-id')).rejects.toThrow('Failed to fetch user profile');
        });
    });

    describe('createUserProfile', () => {
        it('should create user profile successfully', async () => {
            const mockUser = createMockUser();
            const queryBuilder = createMockQueryBuilder(mockUser);

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            const result = await userService.createUserProfile({
                id: mockUser.id,
                email: mockUser.email,
            });

            expect(result).toEqual(mockUser);
            expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles');
        });

        it('should throw error on creation failure', async () => {
            const queryBuilder = createMockQueryBuilder(null, { message: 'Creation failed' });

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            await expect(
                userService.createUserProfile({
                    id: 'test-id',
                    email: 'test@example.com',
                })
            ).rejects.toThrow('Failed to create user profile');
        });
    });

    describe('updateUserProfile', () => {
        it('should update user profile successfully', async () => {
            const mockUser = createMockUser({ email: 'updated@example.com' });
            const queryBuilder = createMockQueryBuilder(mockUser);

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            const result = await userService.updateUserProfile(mockUser.id, {
                email: 'updated@example.com',
            });

            expect(result.email).toBe('updated@example.com');
        });

        it('should throw error when user not found', async () => {
            const queryBuilder = createMockQueryBuilder(null, { code: 'PGRST116' });

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            await expect(
                userService.updateUserProfile('non-existent-id', { email: 'test@example.com' })
            ).rejects.toThrow('User profile not found');
        });
    });

    describe('deleteUserProfile', () => {
        it('should delete user profile successfully', async () => {
            const queryBuilder = {
                delete: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ error: null }),
            };

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            await expect(userService.deleteUserProfile('test-id')).resolves.not.toThrow();
        });

        it('should throw error on deletion failure', async () => {
            const queryBuilder = {
                delete: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ error: { message: 'Deletion failed' } }),
            };

            mockSupabaseClient.from = vi.fn().mockReturnValue(queryBuilder);

            await expect(userService.deleteUserProfile('test-id')).rejects.toThrow('Failed to delete user profile');
        });
    });
});
