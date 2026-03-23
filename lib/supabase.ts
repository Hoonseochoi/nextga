import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://omgwvnibssizmhovporl.supabase.co";
// In a real app, this should be in .env.local, but keeping it fixed here as in the original codebase
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tZ3d2bmlic3Npem1ob3Zwb3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NzA4MDYsImV4cCI6MjA4NzE0NjgwNn0.Cx9OFo_UAJOB2AnsRUg1FbWAD8avU7ktYIea1z4hCDY";

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

export const LEVEL_THRESHOLDS = [
    { level: 1, min: 0, next: 2 },
    { level: 2, min: 2, next: 5 },
    { level: 3, min: 5, next: 9 },
    { level: 4, min: 9, next: 14 },
    { level: 5, min: 14, next: 20 },
    { level: 6, min: 20, next: 27 },
    { level: 7, min: 27, next: 35 },
    { level: 8, min: 35, next: 44 },
    { level: 9, min: 44, next: 54 },
    { level: 10, min: 54, next: Infinity }
];

export function calculateLevelFromCount(count) {
    let currentLevel = 1;
    let nextThreshold = 2;
    let prevThreshold = 0;

    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
        if (count >= LEVEL_THRESHOLDS[i].min) {
            currentLevel = LEVEL_THRESHOLDS[i].level;
            nextThreshold = LEVEL_THRESHOLDS[i].next;
            prevThreshold = LEVEL_THRESHOLDS[i].min;
        }
    }

    let exp = count - prevThreshold;
    let required = nextThreshold - prevThreshold;

    if (currentLevel >= 10) {
        exp = count;
        required = count;
    }

    return { level: currentLevel, exp, required, nextThreshold };
}

export async function logManagerActivity(code, name, fileName) {
    if (!supabaseClient) throw new Error("Supabase client not initialized.");

    try {
        // 1. Log activity
        const { error: logError } = await supabaseClient
            .from('manager_logs')
            .insert([{ manager_code: code, manager_name: name, file_name: fileName }]);
        if (logError) throw logError;

        // 2. Get total execution count
        const { count, error: countError } = await supabaseClient
            .from('manager_logs')
            .select('*', { count: 'exact', head: true })
            .eq('manager_code', code);
        
        if (countError) throw countError;

        const totalCount = count || 1;
        const currentLevelInfo = calculateLevelFromCount(totalCount);

        // 3. Upsert profile
        const { error: profileError } = await supabaseClient
            .from('manager_profiles')
            .upsert({
                manager_code: code,
                manager_name: name,
                execution_count: totalCount,
                level: currentLevelInfo.level,
                updated_at: new Date().toISOString()
            }, { onConflict: 'manager_code' });

        if (profileError) throw profileError;

        return { success: true, totalCount, name, ...currentLevelInfo };
    } catch (err) {
        console.error("Failed to log activity:", err);
        return { success: false, error: err };
    }
}

export async function logUnrecognizedUpload(fileName) {
    if (!supabaseClient) return;
    try {
        const { error } = await supabaseClient
            .from('unrecognized_uploads')
            .insert([{ file_name: fileName, created_at: new Date().toISOString() }]);
        if (error) throw error;
    } catch (err) {
        console.error("Failed to log unrecognized upload:", err);
    }
}

// Counter API Logic
const COUNTER_NAMESPACE = "meritz_analyzer";
const TOTAL_KEY = "meritz_total_analysis";
const API_BASE = "https://api.counterapi.dev/v1";

function getTodayKey() {
    const kst = new Date(Date.now() + (9 * 60 * 60 * 1000));
    const yyyy = kst.getUTCFullYear();
    const mm = String(kst.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(kst.getUTCDate()).padStart(2, '0');
    return `meritz_daily_${yyyy}${mm}${dd}`;
}

export async function fetchAnalysisCounts() {
    try {
        const [totalRes, dailyRes] = await Promise.all([
            fetch(`${API_BASE}/${COUNTER_NAMESPACE}/${TOTAL_KEY}`),
            fetch(`${API_BASE}/${COUNTER_NAMESPACE}/${getTodayKey()}`)
        ]);
        const totalData = await totalRes.json();
        const dailyData = await dailyRes.json();
        return { total: totalData.count || 0, daily: dailyData.count || 0 };
    } catch (error) {
        console.error('Failed to fetch counts:', error);
        return { total: 0, daily: 0 };
    }
}

export async function incrementAnalysisCounts() {
    try {
        const [totalRes, dailyRes] = await Promise.all([
            fetch(`${API_BASE}/${COUNTER_NAMESPACE}/${TOTAL_KEY}/up`),
            fetch(`${API_BASE}/${COUNTER_NAMESPACE}/${getTodayKey()}/up`)
        ]);
        const totalData = await totalRes.json();
        const dailyData = await dailyRes.json();
        return { total: totalData.count, daily: dailyData.count };
    } catch (error) {
        console.error('Failed to increment counts:', error);
        return null;
    }
}

// Error Report Logic
export async function uploadErrorReport(email, content, file) {
    if (!supabaseClient) throw new Error("Supabase 클라이언트가 초기화되지 않았습니다.");

    let attachmentUrl = null;
    try {
        if (file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
            const filePath = `reports/${fileName}`;

            const { error: uploadError } = await supabaseClient.storage
                .from('error_attachments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabaseClient.storage
                .from('error_attachments')
                .getPublicUrl(filePath);

            attachmentUrl = publicUrlData.publicUrl;
        }

        const { error: insertError } = await supabaseClient
            .from('error_reports')
            .insert([{ email, content, attachment_url: attachmentUrl }]);

        if (insertError) throw insertError;

        return { success: true };
    } catch (error) {
        console.error("Error in uploadErrorReport:", error);
        throw error;
    }
}
