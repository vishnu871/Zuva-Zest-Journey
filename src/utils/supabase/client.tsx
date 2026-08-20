// import { createClient as createSupabaseClient } from '@supabase/supabase-js';
// import { projectId, publicAnonKey } from './info';

// const supabaseUrl = `https://${projectId}.supabase.co`;

// export const createClient = () => {
//   return createSupabaseClient(supabaseUrl, publicAnonKey);
// };


// import { createClient as createSupabaseClient } from "@supabase/supabase-js";
// import { projectId, publicAnonKey } from "./info";

// const supabaseUrl = `https://${projectId}.supabase.co`;

// export const supabase = createSupabaseClient(
//   supabaseUrl,
//   publicAnonKey
// );

// export const createClient = () => supabase;


import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "./info";

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createSupabaseClient(
  supabaseUrl,
  publicAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "zest-journey-auth",
    },
  }
);

export const createClient = () => supabase;