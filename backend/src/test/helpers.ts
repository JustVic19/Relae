import { v4 as uuidv4 } from 'uuid';

/**
 * Create a mock user for testing
 */
export function createMockUser(overrides?: any) {
    return {
        id: uuidv4(),
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides,
    };
}

/**
 * Create a mock task for testing
 */
export function createMockTask(overrides?: any) {
    return {
        id: uuidv4(),
        candidate_id: uuidv4(),
        user_id: uuidv4(),
        thread_id: null,
        title: 'Test Assignment',
        type: 'DEADLINE',
        module: 'CS101',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        notes: null,
        links: [],
        status: 'pending',
        created_at: new Date().toISOString(),
        completed_at: null,
        ...overrides,
    };
}

/**
 * Create a mock task candidate for testing
 */
export function createMockCandidate(overrides?: any) {
    return {
        id: uuidv4(),
        source_message_id: uuidv4(),
        user_id: uuidv4(),
        type: 'DEADLINE',
        title: 'Assignment Due',
        module: 'CS101',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: null,
        confidence: 'HIGH',
        confidence_score: 0.95,
        extraction_reasons: {},
        links: [],
        attachments: null,
        status: 'new',
        thread_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides,
    };
}

/**
 * Sleep helper for async tests
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
