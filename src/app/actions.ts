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

export async function getCountries(): Promise<{
  countries: Country[];
  errorMessage: string | null;
}> {
  let countries: Country[] = [];
  let errorMessage: string | null = null;

  try {
    const { data, error } = await supabase
      .from("countries")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      errorMessage = error.message;
    } else if (data) {
      countries = data;
    }
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
  }

  return { countries, errorMessage };
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
    toCountryId: number;
    artist: string;
    title: string;
    voteType: "jury" | "televote";
  }>;
  errorMessage: string | null;
}> {
  let votes: Array<{
    points: number;
    toCountryName: string;
    toCountryId: number;
    artist: string;
    title: string;
    voteType: "jury" | "televote";
  }> = [];
  let errorMessage: string | null = null;

  try {
    // Get all countries for name-to-ID mapping
    const { data: countriesData, error: countriesError } = await supabase
      .from("countries")
      .select("id, name");

    if (countriesError) {
      console.error("Supabase error:", countriesError);
      errorMessage = countriesError.message;
      return { votes, errorMessage };
    }

    // Create a map for quick country name to ID lookup
    const countryMap = new Map<string, number>();
    countriesData?.forEach((country) => {
      countryMap.set(country.name, country.id);
    });

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
        toCountryId: countryMap.get(vote.to_country_name) || 0,
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
    artist?: string;
    title?: string;
  }>;
  errorMessage: string | null;
}> {
  let performances: Array<{
    year: number;
    finalPlace: number | null;
    semifinalPlace: number | null;
    venueType: "final" | "semifinal1" | "semifinal2" | null;
    qualified: boolean | null;
    artist?: string;
    title?: string;
  }> = [];
  let errorMessage: string | null = null;

  try {
    const { data, error } = await supabase.rpc(
      "get_country_performance_history",
      {
        country_id_param: countryId,
      }
    );

    if (error) {
      console.error("Supabase error:", error);
      errorMessage = error.message;
    } else if (data) {
      performances = data.map((performance) => ({
        year: performance.year,
        finalPlace: performance.final_place,
        semifinalPlace: performance.semifinal_place,
        venueType: performance.venue_type as
          | "final"
          | "semifinal1"
          | "semifinal2"
          | null,
        qualified: performance.qualified,
        artist: performance.artist,
        title: performance.title,
      }));
    }
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
  }

  return { performances, errorMessage };
}

export async function getContestDataCompleteness(contestId: number): Promise<{
  completenessPercentage: number;
  songCompleteness: number;
  voteCompleteness: number;
  errorMessage: string | null;
}> {
  let completenessPercentage = 0;
  let songCompleteness = 0;
  let voteCompleteness = 0;
  let errorMessage: string | null = null;

  try {
    // Get contest year to determine voting system
    const { data: contestData, error: contestError } = await supabase
      .from("contests")
      .select("year")
      .eq("id", contestId)
      .single();

    if (contestError) {
      console.error("Supabase error:", contestError);
      errorMessage = contestError.message;
      return { completenessPercentage: 0, songCompleteness: 0, voteCompleteness: 0, errorMessage };
    }

    const contestYear = contestData.year;

    // Get all songs for this contest
    const { data: songsData, error: songsError } = await supabase
      .from("songs")
      .select("*")
      .eq("contest_id", contestId);

    if (songsError) {
      console.error("Supabase error:", songsError);
      errorMessage = songsError.message;
      return { completenessPercentage: 0, songCompleteness: 0, voteCompleteness: 0, errorMessage };
    }

    // Get all votes for this contest with venue information
    const { data: votesData, error: votesError } = await supabase
      .from("votes")
      .select(
        `
        *,
        venues:venue_id (type)
      `
      )
      .eq("contest_id", contestId);

    if (votesError) {
      console.error("Supabase error:", votesError);
      errorMessage = votesError.message;
      return { completenessPercentage: 0, songCompleteness: 0, voteCompleteness: 0, errorMessage };
    }

    if (!songsData || !votesData) {
      return { completenessPercentage: 0, songCompleteness: 0, voteCompleteness: 0, errorMessage: "No data found" };
    }

    // Calculate song data completeness
    const totalSongs = songsData.length;
    const completeSongs = songsData.filter((song) => {
      const hasBasicData = song.artist && song.title && song.points !== null;

      // Only check for final_place if song is in the final venue
      // Semifinal songs don't need final_place as that data exists on the final venue song
      const needsFinalPlace = song.venue_type === "final";

      return hasBasicData && (!needsFinalPlace || song.final_place !== null);
    }).length;

    songCompleteness = totalSongs > 0 ? completeSongs / totalSongs : 0;

    // Calculate vote data completeness
    // Group votes by venue type and from_country_id
    const votesByVenue = votesData.reduce((acc, vote) => {
      const venueType =
        (vote.venues as { type: string } | null)?.type || "unknown";
      const key = `${venueType}_${vote.from_country_id}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(vote);
      return acc;
    }, {} as Record<string, typeof votesData>);

    // Count expected vs actual votes per venue
    const venueTypes = [...new Set(songsData.map((song) => song.venue_type))];

    let expectedVoteRecords = 0;
    let actualVoteRecords = 0;

    for (const venueType of venueTypes) {
      // Get countries that actually voted in this venue
      const votingCountriesInVenue = new Set(
        votesData
          .filter(
            (vote) =>
              (vote.venues as { type: string } | null)?.type === venueType
          )
          .map((vote) => vote.from_country_id)
      );

      for (const countryId of votingCountriesInVenue) {
        const key = `${venueType}_${countryId}`;
        const countryVotes = votesByVenue[key] || [];

        // Determine expected vote records based on venue type and year
        let expectedForThisCountryVenue = 10; // Default: 10 votes

        // Starting in 2023, semifinals only have televote (10 votes instead of 20)
        if (
          contestYear >= 2023 &&
          (venueType === "semifinal1" || venueType === "semifinal2")
        ) {
          expectedForThisCountryVenue = 10; // Only televote votes
        } else if (contestYear >= 2016) {
          // Check if this is the "World" country (Rest of World voting)
          // World can only give televote, not jury votes
          const isWorldVoting = countryVotes.some(() => {
            // Check if all votes from this country are televote only
            return votesData.filter(v => 
              v.from_country_id === countryId && 
              (v.venues as { type: string } | null)?.type === venueType
            ).every(v => v.jury_or_televote === 'televote');
          });
          
          expectedForThisCountryVenue = isWorldVoting ? 10 : 20; // World: 10, Others: 20
        }

        expectedVoteRecords += expectedForThisCountryVenue;
        actualVoteRecords += Math.min(
          countryVotes.length,
          expectedForThisCountryVenue
        );
      }
    }

    voteCompleteness =
      expectedVoteRecords > 0 ? actualVoteRecords / expectedVoteRecords : 0;

    // Calculate overall completeness (average of song and vote completeness)
    completenessPercentage = Math.round(
      ((songCompleteness + voteCompleteness) / 2) * 100
    );
  } catch (err) {
    console.error("Error calculating contest completeness:", err);
    errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
  }

  return { 
    completenessPercentage, 
    songCompleteness: Math.round(songCompleteness * 100), 
    voteCompleteness: Math.round(voteCompleteness * 100), 
    errorMessage 
  };
}
