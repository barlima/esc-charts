'use server';

import { supabase } from "@/utils/supabase";
import { Tables } from "@/types/supabase";

export type Contest = Tables<"contests">;
export type Song = Tables<"songs"> & { country_name?: string };
export type Vote = Tables<"votes">;

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

export async function getContestByYear(year: number): Promise<{
  contest: Contest | null;
  errorMessage: string | null;
}> {
  let contest: Contest | null = null;
  let errorMessage: string | null = null;

  try {
    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .eq('year', year)
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      errorMessage = error.message;
    } else if (data) {
      contest = data;
    }
  } catch (err) {
    console.error('Error connecting to Supabase:', err);
    errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
  }

  return { contest, errorMessage };
}

export async function getSongsByContest(contestId: number): Promise<{
  songs: Song[];
  errorMessage: string | null;
}> {
  let songs: Song[] = [];
  let errorMessage: string | null = null;

  try {
    const { data, error } = await supabase
      .from('songs')
      .select(`
        *,
        countries:country_id (name)
      `)
      .eq('contest_id', contestId)
      .order('venue_type');
    
    if (error) {
      console.error('Supabase error:', error);
      errorMessage = error.message;
    } else if (data) {
      songs = data.map(song => ({
        ...song,
        country_name: song.countries?.name || 'Unknown'
      }));
    }
  } catch (err) {
    console.error('Error connecting to Supabase:', err);
    errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
  }

  return { songs, errorMessage };
}

export async function getVotesBySong(songId: number): Promise<{
  juryPoints: number | null;
  televotePoints: number | null;
  totalPoints: number | null;
  errorMessage: string | null;
}> {
  let juryPoints: number | null = null;
  let televotePoints: number | null = null;
  let totalPoints: number | null = null;
  let errorMessage: string | null = null;

  try {
    const { data, error } = await supabase
      .from('votes')
      .select('jury_or_televote, points')
      .eq('song_id', songId);
    
    if (error) {
      console.error('Supabase error:', error);
      errorMessage = error.message;
    } else if (data) {
      // Calculate points by type
      juryPoints = data
        .filter(vote => vote.jury_or_televote === 'jury')
        .reduce((sum, vote) => sum + vote.points, 0) || null;
      
      televotePoints = data
        .filter(vote => vote.jury_or_televote === 'televote')
        .reduce((sum, vote) => sum + vote.points, 0) || null;
      
      const combinedPoints = data
        .filter(vote => vote.jury_or_televote === 'combined')
        .reduce((sum, vote) => sum + vote.points, 0) || 0;
      
      // Calculate total - use combined if jury and televote don't exist
      if (juryPoints !== null || televotePoints !== null) {
        totalPoints = (juryPoints || 0) + (televotePoints || 0) + combinedPoints;
      } else if (combinedPoints > 0) {
        totalPoints = combinedPoints;
      }
    }
  } catch (err) {
    console.error('Error connecting to Supabase:', err);
    errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
  }

  return { juryPoints, televotePoints, totalPoints, errorMessage };
} 