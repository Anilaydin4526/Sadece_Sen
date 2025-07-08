import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sahxqshfpthobwlgugmu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhaHhxc2hmcHRob2J3bGd1Z211Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NzQ1OTYsImV4cCI6MjA2NzU1MDU5Nn0.h3ovV2ulJeMilgOlZehR20q1iqY8MZGSIDI6aEZFvUo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 