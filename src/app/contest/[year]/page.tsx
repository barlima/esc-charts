import { Container, Heading, Text, Box, Flex, Card } from "@radix-ui/themes";
import { getContestByYear, getSongsByContestWithPoints } from "@/app/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import ChartContainer from "@/components/ChartContainer";
import { 
  shouldShowSeparateVotes, 
  isSingleVotingSystem, 
  getPrimaryVotingType 
} from "@/utils/eurovision";

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

  // Determine if this contest uses separate jury and televote display
  const showSeparateVotes = shouldShowSeparateVotes(year);
  const isSingleSystem = isSingleVotingSystem(year);
  const primaryVotingType = getPrimaryVotingType(year);

  // Process songs based on the voting system
  const processedSongs = songsWithPoints.map(song => {
    if (isSingleSystem) {
      // For single voting system, ensure total points default to 0 if null
      return {
        ...song,
        totalPoints: song.totalPoints !== null ? song.totalPoints : 0
      };
    } else {
      // For multiple voting systems, ensure jury and televote points default to 0 if null
      return {
        ...song,
        juryPoints: song.juryPoints !== null ? song.juryPoints : 0,
        televotePoints: song.televotePoints !== null ? song.televotePoints : 0,
        // Recalculate total points to ensure consistency
        totalPoints: (song.juryPoints !== null ? song.juryPoints : 0) + 
                     (song.televotePoints !== null ? song.televotePoints : 0)
      };
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
    
    if (isSingleSystem) {
      // For single voting systems, put totalPoints into the appropriate array
      acc[venueType] = {
        countries: songs.map((song) => song.country_name),
        juryVotes: primaryVotingType === 'jury' 
          ? songs.map((song) => song.totalPoints) 
          : songs.map(() => null),
        televoteVotes: primaryVotingType === 'televote' 
          ? songs.map((song) => song.totalPoints)
          : songs.map(() => null),
      };
    } else {
      // For hybrid systems, use separate jury and televote points
      acc[venueType] = {
        countries: songs.map((song) => song.country_name),
        juryVotes: songs.map((song) => song.juryPoints),
        televoteVotes: songs.map((song) => song.televotePoints),
      };
    }
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
                          {showSeparateVotes ? (
                            // Separate voting system - show jury and televote
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
                            // Single voting system - only show total points
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
