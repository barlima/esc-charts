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
    const { data, error } = await supabase.rpc(
      "get_votes_received_by_country_optimized",
      {
        song_id_param: songId,
      }
    );

    if (error) {
      console.error("Supabase error:", error);
      errorMessage = error.message;
    } else if (data) {
      votes = data.map((row) => ({
        fromCountryName: row.from_country_name,
        juryPoints: row.jury_points,
        televotePoints: row.televote_points,
      }));
    }
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
    const { data, error } = await supabase.rpc(
      "get_participating_countries_optimized",
      {
        contest_id_param: contestId,
        venue_type_param: venueType,
      }
    );

    if (error) {
      console.error("Supabase error:", error);
      errorMessage = error.message;
    } else if (data) {
      countries = (
        data as Array<{ country_id: number; country_name: string }>
      ).map((row) => ({
        id: row.country_id,
        name: row.country_name,
      }));
    }
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
  }

  return { countries, errorMessage };
}

export async function getVotesGivenByCountry(
  countryId: number,
  contestId: number,
  venueType: "final" | "semifinal1" | "semifinal2"
): Promise<{
  votes: Array<{
    points: number;
    toCountryName: string;
    artist: string;
    title: string;
    voteType: "jury" | "televote";
  }>;
  errorMessage: string | null;
}> {
  let votes: Array<{
    points: number;
    toCountryName: string;
    artist: string;
    title: string;
    voteType: "jury" | "televote";
  }> = [];
  let errorMessage: string | null = null;

  try {
    const { data, error } = await supabase.rpc("get_votes_given_by_country", {
      country_id_param: countryId,
      contest_id_param: contestId,
      venue_type_param: venueType,
    });

    if (error) {
      console.error("Supabase error:", error);
      errorMessage = error.message;
    } else if (data) {
      votes = data.map((vote) => ({
        points: vote.points,
        toCountryName: vote.to_country_name,
        artist: vote.artist,
        title: vote.title,
        voteType: vote.jury_or_televote as "jury" | "televote",
      }));
    }
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
  }

  return { votes, errorMessage };
}

export async function getCountryPerformanceHistory(countryId: number): Promise<{
  performances: Array<{
    year: number;
    finalPlace: number | null;
    semifinalPlace: number | null;
    venueType: "final" | "semifinal1" | "semifinal2" | null;
    qualified: boolean | null;
  }>;
  errorMessage: string | null;
}> {
  const performances: Array<{
    year: number;
    finalPlace: number | null;
    semifinalPlace: number | null;
    venueType: "final" | "semifinal1" | "semifinal2" | null;
    qualified: boolean | null;
  }> = [];
  let errorMessage: string | null = null;

  try {
    const { data, error } = await supabase
      .from("songs")
      .select(
        `
        final_place,
        venue_type,
        qualified,
        contests!inner(year)
      `
      )
      .eq("country_id", countryId)
      .not("final_place", "is", null) // Only get performances with valid results
      .order("contests(year)", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      errorMessage = error.message;
    } else if (data) {
      // Group by year to combine final and semifinal results
      const yearGroups: {
        [year: number]: {
          final_place: number | null;
          venue_type: "final" | "semifinal1" | "semifinal2";
          qualified: boolean | null;
          contests: {
            year: number;
          };
        }[];
      } = {};

      data.forEach((performance) => {
        const year = performance.contests.year;
        if (!yearGroups[year]) {
          yearGroups[year] = [];
        }
        yearGroups[year].push(performance);
      });

      // Process each year's data
      Object.entries(yearGroups).forEach(([year, yearPerformances]) => {
        const finalPerformance = yearPerformances.find(
          (p) => p.venue_type === "final"
        );
        const semifinalPerformance = yearPerformances.find(
          (p) => p.venue_type === "semifinal1" || p.venue_type === "semifinal2"
        );

        // For years where country qualified to final, show final result
        // For years where country only reached semi-final, show semi-final result
        if (finalPerformance) {
          // Country qualified to final
          performances.push({
            year: parseInt(year),
            finalPlace: finalPerformance.final_place,
            semifinalPlace: null,
            venueType: "final",
            qualified: true,
          });
        } else if (semifinalPerformance) {
          // Country only reached semi-final (didn't qualify)
          performances.push({
            year: parseInt(year),
            finalPlace: null,
            semifinalPlace: semifinalPerformance.final_place,
            venueType: semifinalPerformance.venue_type,
            qualified: false,
          });
        }
      });

      // Sort by year
      performances.sort((a, b) => a.year - b.year);
    }
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
  }

  return { performances, errorMessage };
}
