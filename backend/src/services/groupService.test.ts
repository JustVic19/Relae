import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GroupService } from './groupService';

// Mock Supabase Client
const mockSupabase = {
    from: vi.fn(),
};

describe('GroupService', () => {
    let service: GroupService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new GroupService(mockSupabase as any);
    });

    it('should create a group and add creator as admin', async () => {
        const userId = 'user-123';
        const groupName = 'Study Group';
        const mockGroup = { id: 'group-123', name: groupName, code: 'ABC123' };

        // Mock chain for create group
        const insertGroupMock = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockGroup, error: null }),
            }),
        });

        // Mock chain for add member
        const insertMemberMock = vi.fn().mockResolvedValue({ error: null });

        mockSupabase.from.mockImplementation((table) => {
            if (table === 'groups') return { insert: insertGroupMock };
            if (table === 'group_members') return { insert: insertMemberMock };
            return {};
        });

        const result = await service.createGroup(userId, groupName);

        expect(result).toEqual(mockGroup);
        expect(insertGroupMock).toHaveBeenCalledWith(expect.objectContaining({
            name: groupName,
            admin_id: userId,
            code: expect.any(String),
        }));
        expect(insertMemberMock).toHaveBeenCalledWith({
            group_id: mockGroup.id,
            user_id: userId,
            role: 'admin',
        });
    });
});
