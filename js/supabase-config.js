// ============================================
// إعدادات الاتصال بـ Supabase
// هتلاقي القيم دي في مشروعك على supabase.com تحت:
// Project Settings → API
// ============================================

const SUPABASE_CONFIG = {
  url: "https://rupruztbgrofvvfqzcig.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1cHJ1enRiZ3JvZnZ2ZnF6Y2lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MzM2NDksImV4cCI6MjEwMjEwOTY0OX0.rX3ZO9eWNiuKmhE7-uovSgVFQxV3jw2fP9QfgCNfYwA"
};

const supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
