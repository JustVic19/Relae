
import { ContentItem } from './googleService';

class MicrosoftService {
    private async callGraphApi(endpoint: string, accessToken: string): Promise<any> {
        const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Graph API error: ${response.status} ${response.statusText} - ${error}`);
        }

        return response.json();
    }

    async fetchEmails(accessToken: string): Promise<ContentItem[]> {
        try {
            // Fetch top 20 messages from inbox, exclude read ones or verify importance if needed
            // For now just top 20 latest
            const data = await this.callGraphApi('/me/messages?$top=20&$select=id,subject,bodyPreview,from,receivedDateTime,webLink', accessToken);

            if (!data.value) return [];

            return data.value.map((msg: any) => ({
                id: msg.id,
                source: 'outlook',
                type: 'email',
                title: msg.subject || '(No Subject)',
                body: `From: ${msg.from?.emailAddress?.name} <${msg.from?.emailAddress?.address}>\nDate: ${msg.receivedDateTime}\n\n${msg.bodyPreview}`,
                date: new Date(msg.receivedDateTime),
                link: msg.webLink
            }));
        } catch (error) {
            console.error('Error fetching Outlook emails:', error);
            throw error;
        }
    }

    async fetchCalendarEvents(accessToken: string): Promise<ContentItem[]> {
        try {
            const now = new Date().toISOString();
            // Need to specify startDateTime and endDateTime for calendar view
            const end = new Date();
            end.setDate(end.getDate() + 30); // Next 30 days

            const url = `/me/calendarView?startDateTime=${now}&endDateTime=${end.toISOString()}&$top=20&$select=id,subject,bodyPreview,start,end,location,webLink`;
            const data = await this.callGraphApi(url, accessToken);

            if (!data.value) return [];

            return data.value.map((event: any) => ({
                id: event.id,
                source: 'outlook_cal',
                type: 'event',
                title: event.subject || '(No Title)',
                body: `${event.bodyPreview}\nLocation: ${event.location?.displayName}`,
                date: new Date(event.start?.dateTime),
                link: event.webLink,
                metadata: {
                    location: event.location?.displayName,
                    end: event.end?.dateTime
                }
            }));
        } catch (error) {
            console.error('Error fetching Outlook events:', error);
            throw error;
        }
    }
}

export const microsoftService = new MicrosoftService();
