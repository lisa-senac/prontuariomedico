import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "COLE_A_URL_DO_PROJETO";
const SUPABASE_ANON_KEY = "COLE_A_CHAVE_PUBLICA_ANON";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
