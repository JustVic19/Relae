// Quick test script to check completed tasks
import { supabase } from './lib/supabase';

async function testCompletedTasks() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.log('Not logged in');
        return;
    }

    console.log('User ID:', user.id);

    // Check all tasks
    const { data: allTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);

    console.log('\n📋 All tasks:', allTasks?.length || 0);

    // Check completed tasks specifically
    const { data: completedTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed');

    console.log('✅ Completed tasks:', completedTasks?.length || 0);

    if (completedTasks && completedTasks.length > 0) {
        console.log('\nCompleted tasks details:');
        completedTasks.forEach((task: any) => {
            console.log({
                id: task.id,
                title: task.title,
                status: task.status,
                completed_at: task.completed_at,
                due_date: task.due_date
            });
        });
    }

    // Check tasks without completed_at
    const { data: noCompletedAt } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .is('completed_at', null);

    console.log('\n⚠️  Completed tasks missing completed_at:', noCompletedAt?.length || 0);
}

// Run immediately when app loads
setTimeout(testCompletedTasks, 3000);

export default testCompletedTasks;
