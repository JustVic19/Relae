import OpenAI from 'openai';
import { supabase } from '../lib/supabase';
import { google } from 'googleapis';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';

interface EmailMessage {
    id: string;
    subject: string;
    from: string;
    body: string;
    date: Date;
}

interface ExtractedTask {
    title: string;
    description?: string;
    dueDate?: Date;
    priority?: 'low' | 'medium' | 'high';
    category?: string;
    isExam?: boolean;
    isAssignment?: boolean;
    isMeeting?: boolean;
    confidenceScore: number;
}

/**
 * Email Parser Service
 * Uses OpenAI GPT-4 to extract tasks from email content
 */
export class EmailParserService {
    /**
     * Extract structured task data from email using AI
     */
    async extractTaskFromEmail(email: EmailMessage): Promise<ExtractedTask | null> {
        try {
            const prompt = this.buildExtractionPrompt(email);

            const response = await openai.chat.completions.create({
                model: MODEL,
                messages: [
                    {
                        role: 'system',
                        content: `You are an AI assistant that extracts actionable tasks, assignments, exams, and deadlines from emails. 
You analyze student/professional emails and identify:
- Assignment deadlines
- Exam dates
- Meeting invitations
- Project due dates
- Tasks and to-dos

Always respond with valid JSON containing task details and a confidence score (0-1).
If no actionable task is found, return null for all fields except confidenceScore (set to 0).`,
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.3, // Lower temperature for more consistent extraction
                response_format: { type: 'json_object' },
            });

            const result = JSON.parse(response.choices[0].message.content || '{}');

            // Validate and normalize the result
            if (!result || result.confidenceScore < 0.5) {
                return null; // Not confident enough
            }

            return {
                title: result.title || email.subject,
                description: result.description || null,
                dueDate: result.dueDate ? new Date(result.dueDate) : undefined,
                priority: result.priority || 'medium',
                category: result.category || 'uncategorized',
                isExam: result.isExam || false,
                isAssignment: result.isAssignment || false,
                isMeeting: result.isMeeting || false,
                confidenceScore: result.confidenceScore,
            };
        } catch (error) {
            console.error('Email parsing error:', error);
            return null;
        }
    }

    /**
     * Build extraction prompt
     */
    private buildExtractionPrompt(email: EmailMessage): string {
        return `Analyze this email and extract any actionable tasks, assignments, exams, or deadlines.

EMAIL SUBJECT: ${email.subject}
FROM: ${email.from}
DATE: ${email.date.toISOString()}

EMAIL BODY:
${email.body.substring(0, 2000)} ${email.body.length > 2000 ? '...(truncated)' : ''}

Extract the following as JSON:
{
  "title": "Task title (required)",
  "description": "Additional details or context (optional)",
  "dueDate": "ISO 8601 date string if deadline mentioned (e.g., '2024-03-15T23:59:00Z')",
  "priority": "low | medium | high",
  "category": "assignment | exam | meeting | personal | other",
  "isExam": true/false,
  "isAssignment": true/false,
  "isMeeting": true/false,
  "confidenceScore": 0.0 to 1.0 (how confident you are this is an actionable task)
}

Guidelines:
- If no task/deadline found, set confidenceScore to 0
- For exams: extract exam name, date, location if mentioned
- For assignments: extract assignment name, due date, submission details
- For meetings: extract meeting topic, time, location
- Priority: high if urgent/soon, medium if moderate deadline, low if far future
- Be conservative with confidenceScore - only mark high confidence if clearly actionable`;
    }

    /**
     * Create task in database from extracted data
     */
    async createTaskFromEmail(
        extracted: ExtractedTask,
        email: EmailMessage,
        integrationId: string,
        userId: string
    ) {
        try {
            // Create the task
            const { data: task, error: taskError } = await supabase
                .from('tasks')
                .insert({
                    user_id: userId,
                    title: extracted.title,
                    description: extracted.description || `From: ${email.from}\n\nOriginal email: ${email.subject}`,
                    due_date: extracted.dueDate || null,
                    priority: extracted.priority,
                    category: extracted.category,
                    status: 'todo',
                    created_at: new Date(),
                })
                .select()
                .single();

            if (taskError) throw taskError;

            // Link to email
            const { error: linkError } = await supabase
                .from('email_tasks')
                .insert({
                    task_id: task.id,
                    integration_id: integrationId,
                    email_id: email.id,
                    email_subject: email.subject,
                    email_from: email.from,
                    email_date: email.date,
                    extracted_data: extracted,
                    confidence_score: extracted.confidenceScore,
                    user_reviewed: false,
                });

            if (linkError) throw linkError;

            return { success: true, task };
        } catch (error) {
            console.error('Task creation error:', error);
            return { success: false, error: 'Failed to create task from email' };
        }
    }

    /**
     * Fetch emails from Gmail
     */
    async fetchGmailEmails(integrationId: string, maxResults: number = 50) {
        try {
            const { data: integration } = await supabase
                .from('email_integrations')
                .select('*')
                .eq('id', integrationId)
                .single();

            if (!integration) throw new Error('Integration not found');

            const oauth2Client = new google.auth.OAuth2();
            oauth2Client.setCredentials({ access_token: integration.access_token });

            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

            // Query for recent emails (last 7 days)
            const query = 'newer_than:7d';
            const { data } = await gmail.users.messages.list({
                userId: 'me',
                maxResults,
                q: query,
            });

            const messages: EmailMessage[] = [];

            if (data.messages) {
                for (const msg of data.messages.slice(0, 20)) { // Process first 20
                    const { data: fullMsg } = await gmail.users.messages.get({
                        userId: 'me',
                        id: msg.id!,
                        format: 'full',
                    });

                    const headers = fullMsg.payload?.headers || [];
                    const subject = headers.find(h => h.name === 'Subject')?.value || '';
                    const from = headers.find(h => h.name === 'From')?.value || '';
                    const dateStr = headers.find(h => h.name === 'Date')?.value || '';

                    // Extract body
                    let body = '';
                    if (fullMsg.payload?.body?.data) {
                        body = Buffer.from(fullMsg.payload.body.data, 'base64').toString();
                    } else if (fullMsg.payload?.parts) {
                        const textPart = fullMsg.payload.parts.find(p => p.mimeType === 'text/plain');
                        if (textPart?.body?.data) {
                            body = Buffer.from(textPart.body.data, 'base64').toString();
                        }
                    }

                    messages.push({
                        id: msg.id!,
                        subject,
                        from,
                        body,
                        date: new Date(dateStr),
                    });
                }
            }

            return messages;
        } catch (error) {
            console.error('Gmail fetch error:', error);
            return [];
        }
    }
}

export const emailParserService = new EmailParserService();
