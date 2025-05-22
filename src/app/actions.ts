"use server";

import { supabase } from "@/utils/supabase";
import { Tables } from "@/types/supabase";

export type Contest = Tables<"contests">;
export type Song = Tables<"songs"> & {
  country_name?: string;
  country_slug?: string;
};
export type Vote = Tables<"votes">;
export type Country = Tables<"countries">;

// Define types for the RPC function responses
type SongPointsResponse = {
  jury_points: number;
  televote_points: number;
  total_points: number;
};

type SongWithPointsResponse = {
  id: number;
  country_name: string;
  country_id: number;
  artist: string;
  title: string;
  venue_type: string;
  jury_points: number;
  televote_points: number;
  total_points: number;
};

export async function getContests(): Promise<{
  contests: Contest[];
  errorMessage: string | null;
}> {
  let contests: Contest[] = [];
  let errorMessage: string | null = null;

  try {
    const { data, error } = await supabase
      .from("contests")
      .select("*")
      .order("year", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      errorMessage = error.message;
    } else if (data) {
      contests = data;
    }
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
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
      .from("contests")
      .select("*")
      .eq("year", year)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      errorMessage = error.message;
    } else if (data) {
      contest = data;
    }
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
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
      .from("songs")
      .select(
        `
        *,
        countries:country_id (name)
      `
      )
      .eq("contest_id", contestId)
      .order("venue_type");

    if (error) {
      console.error("Supabase error:", error);
      errorMessage = error.message;
    } else if (data) {
      songs = data.map((song) => ({
        ...song,
        country_name: song.countries?.name || "Unknown",
      }));
    }
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
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
    const { data, error } = await supabase.rpc("get_song_points", {
      song_id_param: songId,
    });

    if (error) {
      console.error("Supabase error:", error);
      errorMessage = error.message;
    } else if (data) {
      const points = data as unknown as SongPointsResponse[];
      if (points && points.length > 0) {
        juryPoints = points[0].jury_points || null;
        televotePoints = points[0].televote_points || null;
        totalPoints = points[0].total_points || null;
      }
    }
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
  }

  return { juryPoints, televotePoints, totalPoints, errorMessage };
}

export async function getSongByCountrySlug(
  contestId: number,
  countrySlug: string
): Promise<{
  song: (Song & { country_id: number }) | null;
  errorMessage: string | null;
}> {
  let song: (Song & { country_id: number }) | null = null;
  let errorMessage: string | null = null;

  try {
    const { data, error } = await supabase
      .from("songs")
      .select(
        `
        *,
        countries:country_id (id, name, slug)
      `
      )
      .eq("contest_id", contestId)
      .eq("countries.slug", countrySlug)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      errorMessage = error.message;
    } else if (data) {
      // Type assertion to help TypeScript understand the structure
      type SongWithCountry = Song & {
        countries: {
          id: number;
          name: string;
          slug: string;
        } | null;
      };
      const typedData = data as SongWithCountry;

      song = {
        ...typedData,
        country_name: typedData.countries?.name || "Unknown",
        country_slug: typedData.countries?.slug || "",
        country_id: typedData.countries?.id || typedData.country_id,
      };
    }
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
  }

  return { song, errorMessage };
}

export async function getSongsByContestWithPoints(contestId: number): Promise<{
  songs: Array<{
    id: number;
    country_name: string;
    country_id: number;
    artist: string;
    title: string;
    venue_type: "final" | "semifinal1" | "semifinal2";
    juryPoints: number | null;
    televotePoints: number | null;
    totalPoints: number | null;
  }>;
  errorMessage: string | null;
}> {
  let songs: Array<{
    id: number;
    country_name: string;
    country_id: number;
    artist: string;
    title: string;
    venue_type: "final" | "semifinal1" | "semifinal2";
    juryPoints: number | null;
    televotePoints: number | null;
    totalPoints: number | null;
  }> = [];
  let errorMessage: string | null = null;

  try {
    const { data, error } = await supabase.rpc("get_songs_with_points", {
      contest_id_param: contestId,
    });

    if (error) {
      console.error("Supabase error:", error);
      errorMessage = error.message;
    } else if (data) {
      // Cast each row and explicitly handle string columns to ensure type compatibility
      songs = (data as SongWithPointsResponse[]).map((song) => ({
        id: song.id,
        country_name: String(song.country_name || "Unknown"),
        country_id: song.country_id,
        artist: String(song.artist || ""),
        title: String(song.title || ""),
        venue_type: song.venue_type as "final" | "semifinal1" | "semifinal2",
        juryPoints: song.jury_points || null,
        televotePoints: song.televote_points || null,
        totalPoints: song.total_points || null,
      }));
    }
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
  }

  return { songs, errorMessage };
}

export async function getSongPosition(
  songId: number,
  venueType: "final" | "semifinal1" | "semifinal2"
): Promise<{
  position: number | null;
  errorMessage: string | null;
}> {
  let position: number | null = null;
  let errorMessage: string | null = null;

  try {
    const { data, error } = await supabase.rpc("get_song_position", {
      song_id_param: songId,
      venue_type_param: venueType,
    });

    if (error) {
      console.error("Supabase error:", error);
      errorMessage = error.message;
    } else {
      position = (data as number) || null;
    }
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
  }

  return { position, errorMessage };
}

export async function getVotesReceivedByCountry(songId: number): Promise<{
  votes: Array<{
    fromCountryName: string;
    juryPoints: number | null;
    televotePoints: number | null;
  }>;
  errorMessage: string | null;
}> {
  let votes: Array<{
    fromCountryName: string;
    juryPoints: number | null;
    televotePoints: number | null;
  }> = [];
  let errorMessage: string | null = null;

  try {
    // First get the song to find its venue type and contest
    const { data: songData, error: songError } = await supabase
      .from("songs")
      .select("id, venue_type, contest_id, country_id")
      .eq("id", songId)
      .single();

    if (songError) {
      console.error("Supabase error (song):", songError);
      errorMessage = songError.message;
      return { votes, errorMessage };
    }

    if (!songData) {
      errorMessage = "Song not found";
      return { votes, errorMessage };
    }

    const venueType = songData.venue_type;
    const contestId = songData.contest_id;
    const countryId = songData.country_id;

    // Find the venue ID
    const { data: venueData, error: venueError } = await supabase
      .from("venues")
      .select("id")
      .eq("contest_id", contestId)
      .eq("type", venueType)
      .single();

    if (venueError) {
      console.error("Supabase error (venue):", venueError);
      errorMessage = venueError.message;
      return { votes, errorMessage };
    }

    if (!venueData) {
      errorMessage = "Venue not found";
      return { votes, errorMessage };
    }

    const venueId = venueData.id;

    // Get jury votes by venue (not just by song)
    const { data: juryData, error: juryError } = await supabase
      .from("votes")
      .select(
        `
        points,
        from_country_id,
        to_country_id,
        from_country:countries!votes_from_country_id_fkey (name),
        to_country:countries!votes_to_country_id_fkey (name)
        `
      )
      .eq("venue_id", venueId)
      .eq("jury_or_televote", "jury");

    if (juryError) {
      console.error("Supabase error (jury votes):", juryError);
      errorMessage = juryError.message;
      return { votes, errorMessage };
    }

    // Get televote votes by venue
    const { data: televoteData, error: televoteError } = await supabase
      .from("votes")
      .select(
        `
        points,
        from_country_id,
        to_country_id,
        from_country:countries!votes_from_country_id_fkey (name),
        to_country:countries!votes_to_country_id_fkey (name)
        `
      )
      .eq("venue_id", venueId)
      .eq("jury_or_televote", "televote");

    if (televoteError) {
      console.error("Supabase error (televote votes):", televoteError);
      errorMessage = televoteError.message;
      return { votes, errorMessage };
    }

    // Create a map to combine jury and televote data
    const votesByCountry = new Map<
      number,
      {
        fromCountryName: string;
        juryPoints: number | null;
        televotePoints: number | null;
      }
    >();

    // Process jury votes - only include votes for this song's country
    juryData?.forEach((vote) => {
      if (vote.to_country_id === countryId) {
        votesByCountry.set(vote.from_country_id, {
          fromCountryName: vote.from_country?.name || "Unknown",
          juryPoints: vote.points,
          televotePoints: null,
        });
      }
    });

    // Process televote votes - only include votes for this song's country
    televoteData?.forEach((vote) => {
      if (vote.to_country_id === countryId) {
        const existing = votesByCountry.get(vote.from_country_id);
        if (existing) {
          existing.televotePoints = vote.points;
        } else {
          votesByCountry.set(vote.from_country_id, {
            fromCountryName: vote.from_country?.name || "Unknown",
            juryPoints: null,
            televotePoints: vote.points,
          });
        }
      }
    });

    // Convert map to array
    votes = Array.from(votesByCountry.values());
    
    // Log for debugging
    console.log(`Found ${votes.length} votes for song ${songId}`);
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
  }

  return { votes, errorMessage };
}

export async function getParticipatingCountries(
  contestId: number,
  venueType: "final" | "semifinal1" | "semifinal2"
): Promise<{
  countries: Array<{
    id: number;
    name: string;
  }>;
  errorMessage: string | null;
}> {
  let countries: Array<{
    id: number;
    name: string;
  }> = [];
  let errorMessage: string | null = null;

  try {
    const { data, error } = await supabase
      .from("songs")
      .select(
        `
        country_id,
        countries:country_id (id, name)
      `
      )
      .eq("contest_id", contestId)
      .eq("venue_type", venueType);

    if (error) {
      console.error("Supabase error:", error);
      errorMessage = error.message;
    } else if (data) {
      // Extract unique countries
      const uniqueCountries = new Map();
      data.forEach((song) => {
        if (song.countries && !uniqueCountries.has(song.countries.id)) {
          uniqueCountries.set(song.countries.id, {
            id: song.countries.id,
            name: song.countries.name,
          });
        }
      });
      countries = Array.from(uniqueCountries.values());
    }
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
  }

  return { countries, errorMessage };
}
