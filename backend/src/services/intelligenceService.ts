import OpenAI from 'openai';
import { ContentItem } from './googleService';
import { usageService } from './usageService';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface TaskCandidate {
    title: string;
    type: 'DEADLINE' | 'READING' | 'ADMIN' | 'EVENT';
    module?: string;
    due_date?: string; // ISO string
    confidence: number; // 0-1
    reasoning: string;
    source_id: string; // ID of the email/event
}

class IntelligenceService {
    async extractTasks(items: ContentItem[], userId: string): Promise<TaskCandidate[]> {
        if (items.length === 0) return [];

        // CHECK LIMITS BEFORE PROCESSING
        await usageService.checkAndIncrementAiUsage(userId);

        // Process in batches if necessary, but for 20-40 items we might be able to do one big prompt
        // or a few parallel calls. Let's do one call per item for better accuracy, or batches of 5.
        // Batches of 5 seems efficient.

        const candidates: TaskCandidate[] = [];
        const batchSize = 5;

        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const contentText = batch.map((item, _idx) => `
ID: ${item.id}
Type: ${item.type}
Title: ${item.title}
Date: ${item.date.toISOString()}
Body snippet: ${item.body.slice(0, 500)}...
---`).join('\n');

            try {
                const completion = await openai.chat.completions.create({
                    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
                    messages: [
                        {
                            role: 'system',
                            content: `You an AI assistant for a student app called Relae. Your job is to extract actionable TASKS from emails and calendar events.
                            
Ignore items that are:
- Promotional / Spam
- Newsletters
- General receipts
- Completed notifications

Look for:
- Assignments / Homework (Type: DEADLINE)
- Exams / Tests (Type: EVENT or DEADLINE)
- Meetings / Classes (Type: EVENT)
- Required readings (Type: READING)
- Admin forms to fill out (Type: ADMIN)

For each actionable item found, output a JSON object.
Return ONLY a valid JSON array of objects.

Schema:
{
    "source_id": "ID of the item",
    "title": "Concise task title",
    "type": "DEADLINE" | "READING" | "ADMIN" | "EVENT",
    "module": "Course code or name if detected (e.g. CS101)",
    "due_date": "ISO 8601 date string if a deadline/time is mentioned. Otherwise null.",
    "confidence": 0.0 to 1.0 (how sure you are this is a task),
    "reasoning": "Brief explanation"
}
`
                        },
                        {
                            role: 'user',
                            content: `Analyze these items:\n${contentText}`
                        }
                    ],
                    response_format: { type: "json_object" }
                });

                const result = completion.choices[0].message.content;
                if (result) {
                    const parsed = JSON.parse(result);
                    // Handle wrapped response keys if any (e.g. { "tasks": [...] })
                    const tasks = Array.isArray(parsed) ? parsed : (parsed.tasks || parsed.items || []);
                    candidates.push(...tasks);
                }

            } catch (error) {
                console.error('Error in intelligence extraction:', error);

                // Fallback to regex extraction for this batch
                const fallbackTasks = this.extractTasksRegex(batch);
                candidates.push(...fallbackTasks);
            }
        }

        // Filter low confidence
        return candidates.filter(c => c.confidence > 0.4); // Lower threshold for regex
    }

    /**
     * Fallback extraction using simple keyword matching
     */
    private extractTasksRegex(items: ContentItem[]): TaskCandidate[] {
        const candidates: TaskCandidate[] = [];

        for (const item of items) {
            const text = `${item.title}\n${item.body}`.toLowerCase();

            // 1. Detect Type
            let type: TaskCandidate['type'] | null = null;
            let confidence = 0.5;

            if (text.includes('exam') || text.includes('test') || text.includes('midterm') || text.includes('final')) {
                type = 'EVENT';
                confidence = 0.8;
            } else if (text.includes('due') || text.includes('deadline') || text.includes('assignment') || text.includes('submission')) {
                type = 'DEADLINE';
                confidence = 0.8;
            } else if (text.includes('reading') || text.includes('read chapter')) {
                type = 'READING';
                confidence = 0.7;
            } else if (text.includes('form') || text.includes('sign') || text.includes('register')) {
                type = 'ADMIN';
                confidence = 0.7;
            }

            // If it's a calendar event, it's likely an event or deadline
            if (!type && (item.source === 'gcal' || item.source === 'outlook_cal')) {
                type = 'EVENT';
                confidence = 0.9;
            }

            if (type) {
                // Try to find a date if not already in item.date
                // For events, item.date is the start time.
                // For emails, we might find "due Jan 5" etc., but complex.
                // For now, use the item date as a proxy or null.

                candidates.push({
                    source_id: item.id,
                    title: item.title,
                    type: type,
                    due_date: (type === 'DEADLINE' || type === 'EVENT') ? item.date.toISOString() : undefined,
                    confidence: confidence, // Mark as fallback confidence
                    reasoning: 'Keyword match (Fallback)'
                });
            }
        }

        return candidates;
    }
}

export const intelligenceService = new IntelligenceService();
