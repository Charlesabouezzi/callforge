import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://aggsqxorkzhnfdrctajy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Bxl0HyvWH74dmlIcBWM7AQ_srjLppDH';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
