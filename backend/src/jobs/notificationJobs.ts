import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { NotificationService } from '../services/notificationService';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const notificationService = new NotificationService(supabase);

/**
 * Initialize cron jobs for notifications
 */
export function initializeNotificationJobs() {
    // Check deadlines every 30 minutes
    // Runs at :00 and :30 of every hour
    cron.schedule('*/30 * * * *', async () => {
        console.log('[Cron] Checking upcoming deadlines...');
        try {
            const result = await notificationService.checkUpcomingDeadlines();
            console.log(`[Cron] Deadline check complete: ${result.notified} notifications sent, ${result.errors} errors`);
        } catch (error) {
            console.error('[Cron] Error checking deadlines:', error);
        }
    });

    // Send daily briefings at 8:00 AM every day
    cron.schedule('0 8 * * *', async () => {
        console.log('[Cron] Sending daily briefings...');
        try {
            // Get all users
            const { data: users, error } = await supabase
                .from('user_profiles')
                .select('id');

            if (error) {
                console.error('[Cron] Error fetching users for daily briefing:', error);
                return;
            }

            if (!users || users.length === 0) {
                console.log('[Cron] No users found for daily briefing');
                return;
            }

            let sent = 0;
            let skipped = 0;
            let errors = 0;

            // Send briefing to each user
            for (const user of users) {
                try {
                    const notification = await notificationService.sendDailyBriefing(user.id);
                    if (notification) {
                        sent++;
                    } else {
                        skipped++;
                    }
                } catch (error) {
                    console.error(`[Cron] Error sending briefing to user ${user.id}:`, error);
                    errors++;
                }
            }

            console.log(`[Cron] Daily briefing complete: ${sent} sent, ${skipped} skipped, ${errors} errors`);
        } catch (error) {
            console.error('[Cron] Error in daily briefing job:', error);
        }
    });

    // Send weekly reports at 8:00 PM every Sunday
    cron.schedule('0 20 * * 0', async () => {
        console.log('[Cron] Sending weekly reports...');
        try {
            // Get all users
            const { data: users, error } = await supabase
                .from('user_profiles')
                .select('id');

            if (error) {
                console.error('[Cron] Error fetching users for weekly report:', error);
                return;
            }

            if (!users || users.length === 0) {
                console.log('[Cron] No users found for weekly report');
                return;
            }

            let sent = 0;
            let skipped = 0;
            let errors = 0;

            // Send report to each user
            for (const user of users) {
                try {
                    const notification = await notificationService.sendWeeklyReport(user.id);
                    if (notification) {
                        sent++;
                    } else {
                        skipped++;
                    }
                } catch (error) {
                    console.error(`[Cron] Error sending report to user ${user.id}:`, error);
                    errors++;
                }
            }

            console.log(`[Cron] Weekly report complete: ${sent} sent, ${skipped} skipped, ${errors} errors`);
        } catch (error) {
            console.error('[Cron] Error in weekly report job:', error);
        }
    });

    console.log('✅ Notification cron jobs initialized');
}
