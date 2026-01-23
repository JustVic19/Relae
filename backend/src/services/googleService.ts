import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface ContentItem {
    id: string;
    source: 'gmail' | 'outlook' | 'gcal' | 'outlook_cal';
    type: 'email' | 'event';
    title: string;
    body: string;
    date: Date;
    link?: string;
    metadata?: any;
}

class GoogleService {
    private getClient(accessToken: string, refreshToken?: string): OAuth2Client {
        const client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken
        });

        return client;
    }

    async fetchEmails(accessToken: string, refreshToken?: string, daysToLookBack = 3): Promise<ContentItem[]> {
        try {
            const auth = this.getClient(accessToken, refreshToken);
            const gmail = google.gmail({ version: 'v1', auth });

            // Calculate query date
            const date = new Date();
            date.setDate(date.getDate() - daysToLookBack);
            const afterDate = Math.floor(date.getTime() / 1000);

            // List messages
            const response = await gmail.users.messages.list({
                userId: 'me',
                q: `after:${afterDate} -category:promotions -category:social`,
                maxResults: 20
            });

            const messages = response.data.messages || [];
            if (messages.length === 0) return [];

            // Fetch details for each message
            // We use Promise.all but limit concurrency if needed. For 20 it's usually fine.
            const contentItems: ContentItem[] = [];

            for (const msg of messages) {
                if (!msg.id) continue;

                try {
                    const detail = await gmail.users.messages.get({
                        userId: 'me',
                        id: msg.id,
                        format: 'full'
                    });

                    const payload = detail.data.payload;
                    const headers = payload?.headers;
                    const subject = headers?.find(h => h.name === 'Subject')?.value || '(No Subject)';
                    const from = headers?.find(h => h.name === 'From')?.value || '';
                    const dateStr = headers?.find(h => h.name === 'Date')?.value || '';

                    // Extract body
                    let body = '';
                    if (payload?.body?.data) {
                        body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
                    } else if (payload?.parts) {
                        // Find text/plain part
                        const textPart = payload.parts.find(p => p.mimeType === 'text/plain');
                        if (textPart?.body?.data) {
                            body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
                        }
                    }

                    contentItems.push({
                        id: msg.id,
                        source: 'gmail',
                        type: 'email',
                        title: subject,
                        body: `From: ${from}\nDate: ${dateStr}\n\n${body}`,
                        date: new Date(parseInt(detail.data.internalDate || Date.now().toString())),
                        link: `https://mail.google.com/mail/u/0/#inbox/${msg.id}`
                    });

                } catch (err) {
                    console.error(`Failed to fetch email ${msg.id}`, err);
                }
            }

            return contentItems;
        } catch (error) {
            console.error('Error fetching Gmail emails:', error);
            throw error;
        }
    }

    async fetchCalendarEvents(accessToken: string, refreshToken?: string): Promise<ContentItem[]> {
        try {
            const auth = this.getClient(accessToken, refreshToken);
            const calendar = google.calendar({ version: 'v3', auth });

            const now = new Date().toISOString();

            const response = await calendar.events.list({
                calendarId: 'primary',
                timeMin: now,
                maxResults: 20,
                singleEvents: true,
                orderBy: 'startTime',
            });

            const events = response.data.items || [];

            return events.map(event => ({
                id: event.id || '',
                source: 'gcal',
                type: 'event',
                title: event.summary || '(No Title)',
                body: event.description || '',
                date: new Date(event.start?.dateTime || event.start?.date || now),
                link: event.htmlLink || undefined,
                metadata: {
                    location: event.location,
                    attendees: event.attendees
                }
            }));

        } catch (error) {
            console.error('Error fetching Google Calendar events:', error);
            throw error;
        }
    }
}

export const googleService = new GoogleService();
