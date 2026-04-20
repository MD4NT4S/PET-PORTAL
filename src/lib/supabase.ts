import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Atenção: Variáveis do Supabase não encontradas. O site pode não funcionar corretamente em produção.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
