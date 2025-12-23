import { vi } from 'vitest';

// Mock Supabase client
export const mockSupabaseClient = {
    from: vi.fn(),
    auth: {
        getUser: vi.fn(),
        getSession: vi.fn(),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChange: vi.fn(() => ({
            data: { subscription: { unsubscribe: vi.fn() } },
        })),
    },
};

// Mock query builder
export function createMockQueryBuilder(mockData: any, mockError: any = null) {
    const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockData, error: mockError }),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockData, error: mockError }),
        then: vi.fn().mockResolvedValue({ data: mockData, error: mockError }),
    };

    // Make it chainable
    Object.keys(queryBuilder).forEach((key) => {
        if (typeof queryBuilder[key as keyof typeof queryBuilder] === 'function' && key !== 'single' && key !== 'maybeSingle' && key !== 'then') {
            queryBuilder[key as keyof typeof queryBuilder] = vi.fn().mockReturnValue(queryBuilder);
        }
    });

    return queryBuilder;
}

// Mock Supabase admin client
vi.mock('../lib/supabase', () => ({
    supabaseAdmin: mockSupabaseClient,
    supabase: mockSupabaseClient,
}));
