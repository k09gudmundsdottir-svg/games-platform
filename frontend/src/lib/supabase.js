import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mjphpctvuxmbjhmcscoj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qcGhwY3R2dXhtYmpobWNzY29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMjgzMzQsImV4cCI6MjA4NzgwNDMzNH0.dsmzK7SS4_RSC5wbN6ifhjRlOSbfDZjIcfh2MKkDQIs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export default supabase;
