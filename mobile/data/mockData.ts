export type TaskType = 'DEADLINE' | 'READING' | 'ADMIN' | 'CHANGE' | 'EVENT';

export type ConfidenceBand = 'HIGH' | 'MED' | 'LOW';

export interface TaskCandidate {
    id: string;
    title: string;
    type: TaskType;
    module?: string;
    dueDate?: string;
    dueTime?: string;
    confidence: ConfidenceBand;
    source: {
        from: string;
        timestamp: string;
    };
    links?: string[];
    notes?: string;
    status: 'new' | 'confirmed' | 'ignored';
}

export const mockTasks: TaskCandidate[] = [
    {
        id: '1',
        title: 'Submit Lab Report 2',
        type: 'DEADLINE',
        module: 'CS101',
        dueDate: 'Dec 22',
        dueTime: '2:00 PM',
        confidence: 'HIGH',
        source: {
            from: 'prof.smith@uni.ac.uk',
            timestamp: '2h ago',
        },
        links: ['portal.uni.ac.uk/submit/cs101'],
        status: 'new',
    },
    {
        id: '2',
        title: 'Read Chapter 4: Neural Networks',
        type: 'READING',
        module: 'AI202',
        dueDate: 'Dec 23',
        dueTime: '11:59 PM',
        confidence: 'MED',
        source: {
            from: 'ai-course@uni.ac.uk',
            timestamp: '5h ago',
        },
        status: 'new',
    },
    {
        id: '3',
        title: 'Room change: Lecture moved to Hall B',
        type: 'CHANGE',
        module: 'MATH150',
        confidence: 'LOW',
        source: {
            from: 'admin@uni.ac.uk',
            timestamp: '1d ago',
        },
        status: 'new',
    },
    {
        id: '4',
        title: 'Complete Problem Set 3',
        type: 'DEADLINE',
        module: 'MATH150',
        dueDate: 'Dec 24',
        dueTime: '5:00 PM',
        confidence: 'HIGH',
        source: {
            from: 'math-dept@uni.ac.uk',
            timestamp: '3h ago',
        },
        status: 'confirmed',
    },
    {
        id: '5',
        title: 'Review lecture slides Week 5',
        type: 'READING',
        module: 'CS101',
        dueDate: 'Dec 21',
        dueTime: '9:00 AM',
        confidence: 'MED',
        source: {
            from: 'prof.smith@uni.ac.uk',
            timestamp: '6h ago',
        },
        status: 'confirmed',
    },
];
