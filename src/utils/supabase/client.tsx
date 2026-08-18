// import { createClient as createSupabaseClient } from '@supabase/supabase-js';
// import { projectId, publicAnonKey } from './info';

// const supabaseUrl = `https://${projectId}.supabase.co`;

// export const createClient = () => {
//   return createSupabaseClient(supabaseUrl, publicAnonKey);
// };


import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "./info";

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createSupabaseClient(
  supabaseUrl,
  publicAnonKey
);

export const createClient = () => supabase;