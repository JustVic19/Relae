import { google } from 'googleapis';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { supabaseAdmin as supabase } from '../lib/supabase';
import { googleService } from './googleService';
import { microsoftService } from './microsoftService';
import { intelligenceService } from './intelligenceService';
import { ContentItem } from './googleService';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID!;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET!;
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI!;

// Gmail scopes
const GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar.readonly',
];

// Microsoft scopes
const MICROSOFT_SCOPES = [
    'Mail.Read',
    'Calendars.Read',
    'User.Read',
    'offline_access', // For refresh tokens
];

/**
 * Email Integration Service
 * Handles OAuth flows and token management for email providers
 */
export class EmailIntegrationService {
    private googleOAuth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
    );

    private microsoftClient = new ConfidentialClientApplication({
        auth: {
            clientId: MICROSOFT_CLIENT_ID,
            clientSecret: MICROSOFT_CLIENT_SECRET,
            authority: 'https://login.microsoftonline.com/common',
        },
    });

    /**
     * Get Google OAuth authorization URL
     */
    getGoogleAuthUrl(state: string): string {
        return this.googleOAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: GMAIL_SCOPES,
            prompt: 'consent', // Force consent screen to get refresh token
            state, // Include state for CSRF protection and passing user ID
        });
    }

    /**
     * Get Microsoft OAuth authorization URL
     */
    async getMicrosoftAuthUrl(state: string): Promise<string> {
        const authCodeUrlParameters = {
            scopes: MICROSOFT_SCOPES,
            redirectUri: MICROSOFT_REDIRECT_URI,
            state, // Include state for CSRF protection and passing user ID
        };

        return await this.microsoftClient.getAuthCodeUrl(authCodeUrlParameters);
    }

    /**
     * Exchange Google authorization code for tokens
     */
    async handleGoogleCallback(code: string, userId: string) {
        try {
            console.log('[Gmail OAuth] Starting callback for user:', userId);
            console.log('[Gmail OAuth] Redirect URI configured:', GOOGLE_REDIRECT_URI);
            console.log('[Gmail OAuth] Client ID:', GOOGLE_CLIENT_ID);
            const { tokens } = await this.googleOAuth2Client.getToken(code);
            console.log('[Gmail OAuth] Got tokens successfully');

            this.googleOAuth2Client.setCredentials(tokens);

            // Get user's email address
            const gmail = google.gmail({ version: 'v1', auth: this.googleOAuth2Client });
            const profile = await gmail.users.getProfile({ userId: 'me' });
            const emailAddress = profile.data.emailAddress!;
            console.log('[Gmail OAuth] Got email address:', emailAddress);

            // Store in database
            console.log('[Gmail OAuth] Attempting to save to database...');
            const { data, error } = await supabase
                .from('email_integrations')
                .upsert({
                    user_id: userId,
                    provider: 'gmail',
                    email_address: emailAddress,
                    access_token: tokens.access_token!,
                    refresh_token: tokens.refresh_token || null,
                    token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                    sync_enabled: true,
                    updated_at: new Date(),
                }, { onConflict: 'user_id,email_address' })
                .select()
                .single();

            if (error) {
                console.error('[Gmail OAuth] Database error:', error);
                throw error;
            }

            console.log('[Gmail OAuth] Successfully saved integration:', data);

            // Trigger initial sync
            this.syncIntegration(data.id).catch(err => {
                console.error('[Gmail OAuth] Initial sync failed:', err);
            });

            return { success: true, integration: data };
        } catch (error) {
            console.error('[Gmail OAuth] Complete error:', error);
            return { success: false, error: 'Failed to connect Gmail account' };
        }
    }

    /**
     * Exchange Microsoft authorization code for tokens
     */
    async handleMicrosoftCallback(code: string, userId: string) {
        try {
            const tokenRequest = {
                code,
                scopes: MICROSOFT_SCOPES,
                redirectUri: MICROSOFT_REDIRECT_URI,
            };

            const response = await this.microsoftClient.acquireTokenByCode(tokenRequest);

            // Get user's email from token claims
            const emailAddress = response.account?.username || '';

            // Store in database
            const { data, error } = await supabase
                .from('email_integrations')
                .upsert({
                    user_id: userId,
                    provider: 'outlook',
                    email_address: emailAddress,
                    access_token: response.accessToken,
                    refresh_token: (response as any).refreshToken || null,
                    token_expires_at: response.expiresOn || null,
                    sync_enabled: true,
                    updated_at: new Date(),
                }, { onConflict: 'user_id,email_address' })
                .select()
                .single();

            if (error) throw error;

            // Trigger initial sync
            this.syncIntegration(data.id).catch(err => {
                console.error('[Microsoft OAuth] Initial sync failed:', err);
            });

            return { success: true, integration: data };
        } catch (error) {
            console.error('Microsoft OAuth error:', error);
            return { success: false, error: 'Failed to connect Outlook account' };
        }
    }

    /**
     * Refresh expired Google token
     */
    async refreshGoogleToken(integrationId: string) {
        try {
            const { data: integration, error } = await supabase
                .from('email_integrations')
                .select('*')
                .eq('id', integrationId)
                .single();

            if (error || !integration) throw new Error('Integration not found');

            this.googleOAuth2Client.setCredentials({
                refresh_token: integration.refresh_token,
            });

            const { credentials } = await this.googleOAuth2Client.refreshAccessToken();

            // Update database
            await supabase
                .from('email_integrations')
                .update({
                    access_token: credentials.access_token!,
                    token_expires_at: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
                    updated_at: new Date(),
                })
                .eq('id', integrationId);

            return credentials.access_token;
        } catch (error) {
            console.error('Token refresh error:', error);
            throw error;
        }
    }

    /**
     * Get user's connected email integrations
     */
    async getUserIntegrations(userId: string) {
        const { data, error } = await supabase
            .from('email_integrations')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Disconnect email integration
     */
    async disconnectIntegration(integrationId: string, userId: string) {
        const { error } = await supabase
            .from('email_integrations')
            .delete()
            .eq('id', integrationId)
            .eq('user_id', userId);

        if (error) throw error;
        return { success: true };
    }

    /**
     * Toggle sync for integration
     */
    async toggleSync(integrationId: string, userId: string, enabled: boolean) {
        const { error } = await supabase
            .from('email_integrations')
            .update({ sync_enabled: enabled })
            .eq('id', integrationId)
            .eq('user_id', userId);

        if (error) throw error;
        return { success: true };
    }

    /**
     * Refresh Microsoft access token
     */
    async refreshMicrosoftToken(integrationId: string): Promise<string> {
        const { data: integration, error } = await supabase
            .from('email_integrations')
            .select('*')
            .eq('id', integrationId)
            .single();

        if (error || !integration) throw new Error('Integration not found');

        const response = await this.microsoftClient.acquireTokenByRefreshToken({
            refreshToken: integration.refresh_token,
            scopes: MICROSOFT_SCOPES,
        });

        if (!response || !response.accessToken) throw new Error('Failed to refresh Microsoft token');

        // Update database
        await supabase
            .from('email_integrations')
            .update({
                access_token: response.accessToken,
                refresh_token: (response as any).refreshToken || integration.refresh_token, // Update if new one provided
                token_expires_at: response.expiresOn || null,
                updated_at: new Date(),
            })
            .eq('id', integrationId);

        return response.accessToken;
    }

    /**
     * Sync data for a specific integration
     */
    async syncIntegration(integrationId: string) {
        console.log(`[Sync] Starting sync for integration ${integrationId}`);

        try {
            // 1. Get Integration
            const { data: integration, error } = await supabase
                .from('email_integrations')
                .select('*')
                .eq('id', integrationId)
                .single();

            if (error || !integration) throw new Error('Integration not found');
            if (!integration.sync_enabled) {
                console.log(`[Sync] Sync disabled for ${integrationId}`);
                return;
            }

            // 2. Validate/Refresh Token
            let accessToken = integration.access_token;
            // Refresh if expired or about to expire (within 5 mins)
            const expiresAt = integration.token_expires_at ? new Date(integration.token_expires_at) : null;
            if (expiresAt && expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
                console.log(`[Sync] Token expired for ${integration.provider}, refreshing...`);
                if (integration.provider === 'gmail') {
                    accessToken = await this.refreshGoogleToken(integrationId);
                } else if (integration.provider === 'outlook') {
                    accessToken = await this.refreshMicrosoftToken(integrationId);
                }
            }

            // 3. Fetch Content
            let contentItems: ContentItem[] = [];

            if (integration.provider === 'gmail') {
                const [emails, events] = await Promise.all([
                    googleService.fetchEmails(accessToken, integration.refresh_token),
                    googleService.fetchCalendarEvents(accessToken, integration.refresh_token)
                ]);
                contentItems = [...emails, ...events];
            } else if (integration.provider === 'outlook') {
                const [emails, events] = await Promise.all([
                    microsoftService.fetchEmails(accessToken),
                    microsoftService.fetchCalendarEvents(accessToken)
                ]);
                contentItems = [...emails, ...events];
            }

            console.log(`[Sync] Fetched ${contentItems.length} items from ${integration.provider}`);
            if (contentItems.length === 0) return;

            // 4. Extract Tasks
            const candidates = await intelligenceService.extractTasks(contentItems);
            console.log(`[Sync] Extracted ${candidates.length} task candidates`);

            // 5. Save Tasks to Database
            for (const candidate of candidates) {
                // Check if duplicate source already processed to avoid duplicates
                // Ideally schema should support this, or we check existing task source_id
                // Assuming 'candidate_id' column exists in tasks as per plan

                // Let's do a quick check to avoid duplicates manually if no constraint
                const { data: existing } = await supabase
                    .from('tasks')
                    .select('id')
                    .eq('candidate_id', candidate.source_id)
                    .single();

                if (!existing) {
                    await supabase.from('tasks').insert({
                        user_id: integration.user_id,
                        title: candidate.title,
                        type: candidate.type,
                        module: candidate.module || null,
                        due_date: candidate.due_date || null,
                        candidate_id: candidate.source_id,
                        status: 'pending',
                        sort_order: 0,
                        // We could store reasoning in notes
                        notes: `AI Reasoning: ${candidate.reasoning} (Confidence: ${candidate.confidence})`
                    });
                }
            }

            console.log(`[Sync] Successfully synced integration ${integrationId}`);

        } catch (error) {
            console.error(`[Sync] Error syncing integration ${integrationId}:`, error);
        }
    }
}

export const emailIntegrationService = new EmailIntegrationService();
