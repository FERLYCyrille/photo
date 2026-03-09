import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fejqcmrtvpphgcdnhhel.supabase.co";
const supabaseAnonKey = "sb_publishable_7tFedBn2VFVDLgonM5cj5A_mY7v1lZS";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);