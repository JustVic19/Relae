import { supabaseAdmin } from '../lib/supabase';

// RevenueCat Webhook Payload Types
interface RCEvent {
    event_timestamp_ms: number;
    product_id: string;
    period_type: 'NORMAL' | 'TRIAL' | 'INTRO';
    purchased_at_ms: number;
    expiration_at_ms?: number;
    environment: 'SANDBOX' | 'PRODUCTION';
    entitlement_id?: string;
    entitlement_ids?: string[];
    transaction_id: string;
    original_transaction_id: string;
    is_trial_conversion?: boolean;
    cancel_reason?: string;
    new_product_id?: string;
    presented_offering_id?: string;
    price?: number;
    currency?: string;
    takehome_percentage?: number;
    store: 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | 'PROMOTIONAL';
    app_user_id: string; // The user ID we passed to RC
}

interface WebhookBody {
    api_version: string;
    event: {
        id: string;
        type: 'INITIAL_PURCHASE' | 'NON_RENEWING_PURCHASE' | 'RENEWAL' | 'PRODUCT_CHANGE' | 'CANCELLATION' | 'UNCANCELLATION' | 'BILLING_ISSUE' | 'SUBSCRIBER_ALIAS' | 'subscription_extended' | 'EXPIRATION' | 'TEST';
        [key: string]: any;
    } & RCEvent;
}

export class WebhookService {
    /**
     * Handle incoming RevenueCat webhook
     */
    async handleEvent(body: WebhookBody) {
        const { event } = body;
        const userId = event.app_user_id;

        console.log(`[Webhook] Processing event ${event.type} for user ${userId}`);

        // Verify this is a real user ID (UUID)
        if (!userId || userId.length < 10) {
            console.warn('[Webhook] Skipped: Invalid User ID');
            return;
        }

        switch (event.type) {
            case 'INITIAL_PURCHASE':
            case 'RENEWAL':
            case 'UNCANCELLATION':
            case 'PRODUCT_CHANGE':
            case 'NON_RENEWING_PURCHASE':
                await this.grantProAccess(userId, event);
                break;

            case 'CANCELLATION':
                // Cancellation just means auto-renew is off, they essentially keep access until expiration
                // But we should update status to 'canceled'
                await this.updateSubscriptionStatus(userId, 'canceled', event);
                break;

            case 'EXPIRATION':
                await this.revokeProAccess(userId, event);
                break;

            case 'BILLING_ISSUE':
                await this.updateSubscriptionStatus(userId, 'past_due', event);
                break;

            case 'TEST':
                console.log('[Webhook] Test event received');
                break;

            default:
                console.log(`[Webhook] Unhandled event type: ${event.type}`);
        }
    }

    /**
     * Grant access (is_pro = true)
     */
    private async grantProAccess(userId: string, event: RCEvent) {
        const expirationDate = event.expiration_at_ms ? new Date(event.expiration_at_ms) : null;

        await supabaseAdmin.from('user_profiles').update({
            is_pro: true,
            subscription_status: 'active',
            subscription_end_date: expirationDate
        }).eq('id', userId);

        console.log(`[Webhook] Granted Pro access to ${userId}`);
    }

    /**
     * Update status without revoking access (e.g. cancellation means no renew, but still active)
     */
    private async updateSubscriptionStatus(userId: string, status: string, event: RCEvent) {
        await supabaseAdmin.from('user_profiles').update({
            subscription_status: status
        }).eq('id', userId);

        console.log(`[Webhook] Updated status to ${status} for ${userId}`);
    }

    /**
     * Revoke access (is_pro = false)
     */
    private async revokeProAccess(userId: string, event: RCEvent) {
        await supabaseAdmin.from('user_profiles').update({
            is_pro: false,
            subscription_status: 'expired',
            subscription_end_date: event.expiration_at_ms ? new Date(event.expiration_at_ms) : new Date()
        }).eq('id', userId);

        console.log(`[Webhook] Revoked Pro access from ${userId}`);
    }
}

export const webhookService = new WebhookService();
