'use server';

import { supabase } from "@/utils/supabase";
import { Tables } from "@/types/supabase";

export type Contest = Tables<"contests">;

export async function getContests(): Promise<{ 
  contests: Contest[];
  errorMessage: string | null;
}> {
  let contests: Contest[] = [];
  let errorMessage: string | null = null;

  try {
    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .order('year', { ascending: false });
    
    if (error) {
      console.error('Supabase error:', error);
      errorMessage = error.message;
    } else if (data) {
      contests = data;
    }
  } catch (err) {
    console.error('Error connecting to Supabase:', err);
    errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
  }

  return { contests, errorMessage };
} 