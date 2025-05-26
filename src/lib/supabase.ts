
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zugmebtirwpdkblijlvx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1Z21lYnRpcndwZGtibGlqbHZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MzU4MTEsImV4cCI6MjA1OTIxMTgxMX0.qSHZrBUacqnjqBH9XDY_6Bq-C5jYpdJTg9V_kN4ghiw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
