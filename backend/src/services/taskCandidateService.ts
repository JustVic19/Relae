import { supabaseAdmin } from '../lib/supabase';
import { taskService, CreateTaskInput, TaskType } from './taskService';

export type CandidateType = 'DEADLINE' | 'READING' | 'ADMIN' | 'CHANGE' | 'EVENT';
export type CandidateStatus = 'new' | 'confirmed' | 'edited' | 'ignored';
export type ConfidenceLevel = 'HIGH' | 'MED' | 'LOW';

export interface TaskCandidate {
    id: string;
    source_message_id: string;
    user_id: string;
    type: CandidateType;
    title: string;
    module: string | null;
    due_date: string | null;
    location: string | null;
    confidence: ConfidenceLevel;
    confidence_score: number | null;
    extraction_reasons: any;
    links: string[] | null;
    attachments: any;
    status: CandidateStatus;
    thread_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface EditCandidateInput {
    title?: string;
    type?: CandidateType;
    module?: string | null;
    due_date?: string | null;
    location?: string | null;
}

export interface ConfirmCandidateOverrides {
    title?: string;
    type?: TaskType;
    module?: string | null;
    due_date?: string | null;
    notes?: string | null;
}

export class TaskCandidateService {
    /**
     * Get task candidates for a user
     */
    async getCandidates(userId: string, status?: CandidateStatus): Promise<TaskCandidate[]> {
        let query = supabaseAdmin
            .from('task_candidates')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch candidates: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Get a single candidate by ID
     */
    async getCandidate(candidateId: string, userId: string): Promise<TaskCandidate | null> {
        const { data, error } = await supabaseAdmin
            .from('task_candidates')
            .select('*')
            .eq('id', candidateId)
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to fetch candidate: ${error.message}`);
        }

        return data;
    }

    /**
     * Confirm a candidate and create a task
     */
    async confirmCandidate(
        candidateId: string,
        userId: string,
        overrides?: ConfirmCandidateOverrides
    ): Promise<{ task: any; candidate: TaskCandidate }> {
        // Fetch candidate
        const candidate = await this.getCandidate(candidateId, userId);

        if (!candidate) {
            throw new Error('Candidate not found');
        }

        if (candidate.status !== 'new') {
            throw new Error('Candidate already processed');
        }

        // Create task using TaskService
        const taskInput: CreateTaskInput = {
            candidate_id: candidate.id,
            user_id: userId,
            thread_id: candidate.thread_id,
            title: overrides?.title || candidate.title,
            type: overrides?.type || candidate.type,
            module: overrides?.module !== undefined ? overrides.module : candidate.module,
            due_date: overrides?.due_date !== undefined ? overrides.due_date : candidate.due_date,
            notes: overrides?.notes,
            links: candidate.links || [],
        };

        const task = await taskService.createTask(taskInput);

        // Update candidate status
        const { data: updatedCandidate, error: updateError } = await supabaseAdmin
            .from('task_candidates')
            .update({
                status: 'confirmed',
                updated_at: new Date().toISOString(),
            })
            .eq('id', candidateId)
            .select()
            .single();

        if (updateError) {
            throw new Error(`Failed to update candidate status: ${updateError.message}`);
        }

        return { task, candidate: updatedCandidate };
    }

    /**
     * Edit a candidate before confirming
     */
    async editCandidate(
        candidateId: string,
        userId: string,
        updates: EditCandidateInput
    ): Promise<TaskCandidate> {
        const { data, error } = await supabaseAdmin
            .from('task_candidates')
            .update({
                ...updates,
                status: 'edited',
                updated_at: new Date().toISOString(),
            })
            .eq('id', candidateId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error('Candidate not found or access denied');
            }
            throw new Error(`Failed to edit candidate: ${error.message}`);
        }

        return data;
    }

    /**
     * Ignore a candidate
     */
    async ignoreCandidate(
        candidateId: string,
        userId: string,
        reason?: string
    ): Promise<TaskCandidate> {
        const { data, error } = await supabaseAdmin
            .from('task_candidates')
            .update({
                status: 'ignored',
                updated_at: new Date().toISOString(),
            })
            .eq('id', candidateId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error('Candidate not found or access denied');
            }
            throw new Error(`Failed to ignore candidate: ${error.message}`);
        }

        return data;
    }

    /**
     * Get new candidates (unprocessed)
     */
    async getNewCandidates(userId: string): Promise<TaskCandidate[]> {
        const { data, error } = await supabaseAdmin
            .from('task_candidates')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'new')
            .order('confidence_score', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch new candidates: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Get source message for a candidate
     */
    async getCandidateSource(candidateId: string, userId: string): Promise<any> {
        const candidate = await this.getCandidate(candidateId, userId);

        if (!candidate) {
            throw new Error('Candidate not found');
        }

        const { data: sourceMessage, error } = await supabaseAdmin
            .from('source_messages')
            .select('subject, from_name, from_email, received_at, body_snippet, urls')
            .eq('id', candidate.source_message_id)
            .single();

        if (error) {
            throw new Error(`Failed to fetch source message: ${error.message}`);
        }

        return sourceMessage;
    }
}

export const taskCandidateService = new TaskCandidateService();
