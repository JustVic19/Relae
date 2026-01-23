import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

export class GroupService {
    constructor(private supabase: SupabaseClient) { }

    // Generate a short 6-character code for joining
    private generateGroupCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    async createGroup(userId: string, name: string, description?: string) {
        // 1. Create the group
        const groupCode = this.generateGroupCode();

        const { data: group, error: groupError } = await this.supabase
            .from('groups')
            .insert({
                name,
                description,
                code: groupCode,
                admin_id: userId
            })
            .select()
            .single();

        if (groupError) throw groupError;

        // 2. Add creator as admin member
        const { error: memberError } = await this.supabase
            .from('group_members')
            .insert({
                group_id: group.id,
                user_id: userId,
                role: 'admin'
            });

        if (memberError) {
            // Rollback (delete group) if member creation fails - simplified for MVP
            await this.supabase.from('groups').delete().eq('id', group.id);
            throw memberError;
        }

        return group;
    }

    async getUserGroups(userId: string) {
        // Fetch groups the user belongs to
        const { data, error } = await this.supabase
            .from('group_members')
            .select(`
                group:groups (
                    id,
                    name,
                    description,
                    code,
                    created_at,
                    member_count:group_members(count)
                ),
                role,
                joined_at
            `)
            .eq('user_id', userId);

        if (error) throw error;

        // Flatten structure for easier consumption
        return data.map((membership: any) => ({
            ...membership.group,
            role: membership.role,
            joined_at: membership.joined_at,
            // Extract count from the array format Supabase returns: [{ count: 5 }]
            member_count: membership.group.member_count?.[0]?.count || 0
        }));
    }

    async getGroupDetails(groupId: string) {
        // Fetch group info + members + tasks
        const { data: group, error: groupError } = await this.supabase
            .from('groups')
            .select('*')
            .eq('id', groupId)
            .single();

        if (groupError) throw groupError;

        const { data: members, error: membersError } = await this.supabase
            .from('group_members')
            .select(`
                user:user_profiles (
                    id,
                    display_name,
                    avatar_url,
                    email
                ),
                role,
                joined_at
            `)
            .eq('group_id', groupId);

        if (membersError) throw membersError;

        // Fetch tasks
        const { data: tasks, error: tasksError } = await this.supabase
            .from('tasks')
            .select(`
                *,
                assignee:user_profiles!tasks_assigned_to_fkey(
                    id,
                    display_name,
                    avatar_url
                )
            `)
            .eq('group_id', groupId)
            .order('created_at', { ascending: false });

        if (tasksError) throw tasksError;

        return {
            ...group,
            members: members.map((m: any) => ({
                ...m.user,
                role: m.role,
                joined_at: m.joined_at
            })),
            tasks: tasks || []
        };
    }

    async joinGroupByCode(userId: string, code: string) {
        // 1. Find group by code
        const { data: group, error: findError } = await this.supabase
            .from('groups')
            .select('id')
            .eq('code', code.toUpperCase())
            .single();

        if (findError || !group) throw new Error('Invalid group code');

        // 2. Check if already a member
        const { data: existing } = await this.supabase
            .from('group_members')
            .select('role')
            .eq('group_id', group.id)
            .eq('user_id', userId)
            .single();

        if (existing) throw new Error('Already a member of this group');

        // 3. Add to members
        const { error: joinError } = await this.supabase
            .from('group_members')
            .insert({
                group_id: group.id,
                user_id: userId,
                role: 'member'
            });

        if (joinError) throw joinError;

        return { success: true, groupId: group.id };
    }
}
