import { Container, Heading, Text, Box, Flex, Card } from "@radix-ui/themes";
import { getContestByYear, getSongsByContestWithPoints } from "@/app/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import ChartContainer from "@/components/ChartContainer";

type VenueType = "final" | "semifinal1" | "semifinal2";

type SongWithPoints = {
  id: number;
  country_name: string;
  country_id: number;
  artist: string;
  title: string;
  venue_type: VenueType;
  juryPoints: number | null;
  televotePoints: number | null;
  totalPoints: number | null;
};

// Format venue type to a user-friendly name
function formatVenueType(venueType: VenueType): string {
  switch (venueType) {
    case "final":
      return "Final";
    case "semifinal1":
      return "Semi Final 1";
    case "semifinal2":
      return "Semi Final 2";
    default:
      return venueType;
  }
}

export default async function ContestPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: contestYear } = await params;
  const year = parseInt(contestYear, 10);

  if (isNaN(year)) {
    notFound();
  }

  // Fetch contest data
  const { contest, errorMessage: contestError } = await getContestByYear(year);

  if (!contest) {
    notFound();
  }

  // Fetch songs with pre-calculated points
  const { songs: songsWithPoints, errorMessage: songsError } =
    await getSongsByContestWithPoints(contest.id);

  // Determine if this contest uses the modern voting system (jury + televote)
  // The split system was introduced in 2016
  const hasModernVotingSystem = year >= 2016;

  // Process songs based on the voting system
  const processedSongs = songsWithPoints.map(song => {
    if (hasModernVotingSystem) {
      // For contests from 2016 onwards, ensure jury and televote points default to 0 if null
      return {
        ...song,
        juryPoints: song.juryPoints !== null ? song.juryPoints : 0,
        televotePoints: song.televotePoints !== null ? song.televotePoints : 0,
        // Recalculate total points to ensure consistency
        totalPoints: (song.juryPoints !== null ? song.juryPoints : 0) + 
                     (song.televotePoints !== null ? song.televotePoints : 0)
      };
    } else {
      // For older contests, only use total points
      return song;
    }
  });

  // Group songs by venue type
  const songsByVenue = processedSongs.reduce((acc, song) => {
    if (!acc[song.venue_type]) {
      acc[song.venue_type] = [];
    }
    acc[song.venue_type].push(song);
    return acc;
  }, {} as Record<VenueType, SongWithPoints[]>);

  // Sort venue types to ensure final is first, followed by semifinals
  const venueTypes = Object.keys(songsByVenue).sort((a, b) => {
    if (a === "final") return -1;
    if (b === "final") return 1;
    return a.localeCompare(b);
  }) as VenueType[];

  // Sort songs within each venue by total points (descending)
  for (const venueType of venueTypes) {
    songsByVenue[venueType].sort((a, b) => {
      const pointsA = a.totalPoints || 0;
      const pointsB = b.totalPoints || 0;
      return pointsB - pointsA;
    });
  }

  // Prepare chart data for each venue type
  const chartDataByVenue = venueTypes.reduce((acc, venueType) => {
    const songs = songsByVenue[venueType] || [];
    acc[venueType] = {
      countries: songs.map((song) => song.country_name),
      juryVotes: hasModernVotingSystem 
        ? songs.map((song) => song.juryPoints) 
        : songs.map(() => null), // Only use jury votes for modern system
      televoteVotes: hasModernVotingSystem 
        ? songs.map((song) => song.televotePoints)
        : songs.map(() => null), // Only use televotes for modern system
    };
    return acc;
  }, {} as Record<VenueType, { countries: string[]; juryVotes: (number | null)[]; televoteVotes: (number | null)[] }>);

  return (
    <Container className="py-16 max-w-3xl mx-auto">
      <Flex direction="column" gap="6">
        {/* Breadcrumbs */}
        <Box>
          <Flex gap="2" align="center">
            <Link
              href="/"
              className="text-gray-500 text-sm no-underline hover:underline"
            >
              Home
            </Link>
            <Text size="2" color="gray">
              /
            </Text>
            <Text size="2">
              {contest.host_city} {contest.year}
            </Text>
          </Flex>
        </Box>

        {/* Heading */}
        <Heading size="8" className="mb-6">
          {contest.host_city} {contest.year}
        </Heading>

        {/* Error Messages */}
        {(contestError || songsError) && (
          <Card className="p-4 mb-4 bg-red-50">
            <Text size="2" color="red">
              Error loading data: {contestError || songsError}
            </Text>
          </Card>
        )}

        {/* Display content for each venue type */}
        {venueTypes.map((venueType) => (
          <Box key={venueType} className="mb-8">
            {/* Venue type heading */}
            <Heading size="5" className="mb-4">
              {formatVenueType(venueType)}
            </Heading>

            {/* Voting Chart for this venue - only show if we have songs */}
            {songsByVenue[venueType].length > 0 && (
              <ChartContainer
                countries={chartDataByVenue[venueType].countries}
                juryVotes={chartDataByVenue[venueType].juryVotes}
                televoteVotes={chartDataByVenue[venueType].televoteVotes}
              />
            )}

            {/* Songs list */}
            <Flex direction="column" gap="3">
              {songsByVenue[venueType].map((song) => (
                <Card key={song.id} asChild>
                  <Link
                    href={`/contest/${contest.year}/country/${song.country_id}`}
                    className="block no-underline text-inherit"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <Flex align="center" justify="between">
                      <Box>
                        <Flex direction="column" gap="1">
                          <Text size="2" color="gray">
                            {song.country_name}
                          </Text>
                          <Text weight="medium">
                            {song.artist} - {song.title}
                          </Text>
                        </Flex>
                      </Box>
                      <Box>
                        <Flex gap="4" align="center">
                          {/* Points display - show jury and televote separately for modern system */}
                          {hasModernVotingSystem ? (
                            // Modern voting system (2016+) - show jury, televote and total
                            <>
                              <Flex direction="column" align="end">
                                <Text size="1" color="gray">
                                  Jury
                                </Text>
                                <Text weight="medium">{song.juryPoints}</Text>
                              </Flex>
                              <Flex direction="column" align="end">
                                <Text size="1" color="gray">
                                  Televote
                                </Text>
                                <Text weight="medium">
                                  {song.televotePoints}
                                </Text>
                              </Flex>
                              {song.totalPoints !== null && (
                                <Flex direction="column" align="end">
                                  <Text size="1" color="gray">
                                    Total
                                  </Text>
                                  <Text weight="bold">{song.totalPoints}</Text>
                                </Flex>
                              )}
                            </>
                          ) : (
                            // Pre-2016 voting system - only show total points
                            song.totalPoints !== null && (
                              <Flex direction="column" align="end">
                                <Text size="1" color="gray">
                                  Points
                                </Text>
                                <Text weight="bold">{song.totalPoints}</Text>
                              </Flex>
                            )
                          )}
                        </Flex>
                      </Box>
                    </Flex>
                  </Link>
                </Card>
              ))}
            </Flex>
          </Box>
        ))}
      </Flex>
    </Container>
  );
}
