import {
  Container,
  Heading,
  Text,
  Box,
  Flex,
  Card,
  Grid,
  Badge,
} from "@radix-ui/themes";
import { 
  getContestByYear, 
  getVotesBySong,
  getSongPosition,
} from "@/app/actions";
import { notFound } from "next/navigation";
import { supabase } from "@/utils/supabase";
import Link from "next/link";
import CountryChartContainer from "@/components/CountryChartContainer";

type VenueType = "final" | "semifinal1" | "semifinal2";

export default async function SongPage({
  params,
}: {
  params: Promise<{ year: string; id: string }>;
}) {
  const { year: contestYear, id: countryId } = await params;
  const year = parseInt(contestYear, 10);
  const countryIdNum = parseInt(countryId, 10);

  if (isNaN(year) || isNaN(countryIdNum)) {
    notFound();
  }

  // Fetch contest data
  const { contest, errorMessage: contestError } = await getContestByYear(year);

  if (!contest) {
    notFound();
  }

  // Fetch country data
  const { data: countryData, error: countryError } = await supabase
    .from('countries')
    .select('*')
    .eq('id', countryIdNum)
    .single();

  if (countryError || !countryData) {
    notFound();
  }

  // Fetch song data - first try to get the final performance
  const { data: finalSongData, error: finalSongError } = await supabase
    .from('songs')
    .select('*')
    .eq('contest_id', contest.id)
    .eq('country_id', countryIdNum)
    .eq('venue_type', 'final')
    .single();

  // If no final performance, try to get the semifinal performance
  let song = finalSongData;
  let songError = null;

  if (finalSongError) {
    const { data: semifinalSongData, error: semifinalSongError } = await supabase
      .from('songs')
      .select('*')
      .eq('contest_id', contest.id)
      .eq('country_id', countryIdNum)
      .or('venue_type.eq.semifinal1,venue_type.eq.semifinal2')
      .single();
    
    if (semifinalSongError) {
      songError = semifinalSongError.message;
    } else {
      song = semifinalSongData;
    }
  }

  if (!song) {
    notFound();
  }

  // Get votes/points for the song
  const { juryPoints: finalJuryPoints, televotePoints: finalTelevotePoints, totalPoints: finalTotalPoints } = 
    await getVotesBySong(song.id);

  // Get position in final
  const { position: finalPosition } = song.venue_type === 'final' 
    ? await getSongPosition(song.id, 'final')
    : { position: null };

  // Find if this country had a semifinal performance
  let semifinalSong = null;
  let semifinalJuryPoints = null;
  let semifinalTelevotePoints = null;
  let semifinalTotalPoints = null;
  let semifinalPosition = null;
  let semifinalVenueType = null;

  if (song.venue_type === 'final') {
    // This is a final performance, check if there was a semifinal performance
    const { data: semifinalData } = await supabase
      .from('songs')
      .select('*')
      .eq('contest_id', contest.id)
      .eq('country_id', countryIdNum)
      .or('venue_type.eq.semifinal1,venue_type.eq.semifinal2')
      .single();

    if (semifinalData) {
      semifinalSong = semifinalData;
      semifinalVenueType = semifinalData.venue_type as VenueType;
      
      const semifinalPoints = await getVotesBySong(semifinalData.id);
      semifinalJuryPoints = semifinalPoints.juryPoints;
      semifinalTelevotePoints = semifinalPoints.televotePoints;
      semifinalTotalPoints = semifinalPoints.totalPoints;
      
      const { position } = await getSongPosition(semifinalData.id, semifinalData.venue_type as VenueType);
      semifinalPosition = position;
    }
  }

  // Check if the song qualified to the final
  const qualified = song.qualified === true;

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
            <Link 
              href={`/contest/${contest.year}`}
              className="text-gray-500 text-sm no-underline hover:underline"
            >
              {contest.host_city} {contest.year}
            </Link>
            <Text size="2" color="gray">
              /
            </Text>
            <Text size="2">{countryData.name}</Text>
          </Flex>
        </Box>

        {/* Country name heading */}
        <Heading size="8">{countryData.name}</Heading>
        
        {/* Artist and song subheading */}
        <Heading size="5" as="h2" color="gray">
          {song.artist} - {song.title}
        </Heading>

        {/* Error Messages */}
        {(contestError || songError) && (
          <Card className="p-4 mb-4 bg-red-50">
            <Text size="2" color="red">
              Error loading data: {contestError || songError}
            </Text>
          </Card>
        )}

        {/* Final Results */}
        <Box mt="4">
          <Heading size="4" mb="3">
            Final Results
            {!qualified && song.venue_type !== 'final' && (
              <Badge color="amber" ml="2">Did not qualify</Badge>
            )}
          </Heading>
          
          <Card className="p-6">
            <Grid columns="4" gap="6">
              <Flex direction="column" align="center" gap="1">
                <Text size="2" color="gray">Position</Text>
                <Heading size="6">{finalPosition || 'N/A'}</Heading>
              </Flex>
              
              <Flex direction="column" align="center" gap="1">
                <Text size="2" color="gray">Jury Points</Text>
                <Heading size="6">{finalJuryPoints !== null ? finalJuryPoints : 'N/A'}</Heading>
              </Flex>
              
              <Flex direction="column" align="center" gap="1">
                <Text size="2" color="gray">Televote</Text>
                <Heading size="6">{finalTelevotePoints !== null ? finalTelevotePoints : 'N/A'}</Heading>
              </Flex>
              
              <Flex direction="column" align="center" gap="1">
                <Text size="2" color="gray">Total Points</Text>
                <Heading size="6">{finalTotalPoints !== null ? finalTotalPoints : 'N/A'}</Heading>
              </Flex>
            </Grid>
            
            {/* Points Chart for Final */}
            {(finalJuryPoints !== null || finalTelevotePoints !== null || finalTotalPoints !== null) && (
              <CountryChartContainer
                juryPoints={finalJuryPoints}
                televotePoints={finalTelevotePoints}
                totalPoints={finalTotalPoints}
              />
            )}
          </Card>
        </Box>

        {/* Semifinal Results (only if participated in a semifinal) */}
        {semifinalSong && (
          <Box mt="4">
            <Heading size="4" mb="3">
              {semifinalVenueType === 'semifinal1' ? 'Semi-Final 1' : 'Semi-Final 2'} Results
            </Heading>
            
            <Card className="p-6">
              <Grid columns="4" gap="6">
                <Flex direction="column" align="center" gap="1">
                  <Text size="2" color="gray">Position</Text>
                  <Heading size="6">{semifinalPosition || 'N/A'}</Heading>
                </Flex>
                
                <Flex direction="column" align="center" gap="1">
                  <Text size="2" color="gray">Jury Points</Text>
                  <Heading size="6">{semifinalJuryPoints !== null ? semifinalJuryPoints : 'N/A'}</Heading>
                </Flex>
                
                <Flex direction="column" align="center" gap="1">
                  <Text size="2" color="gray">Televote</Text>
                  <Heading size="6">{semifinalTelevotePoints !== null ? semifinalTelevotePoints : 'N/A'}</Heading>
                </Flex>
                
                <Flex direction="column" align="center" gap="1">
                  <Text size="2" color="gray">Total Points</Text>
                  <Heading size="6">{semifinalTotalPoints !== null ? semifinalTotalPoints : 'N/A'}</Heading>
                </Flex>
              </Grid>
              
              {/* Points Chart for Semifinal */}
              {(semifinalJuryPoints !== null || semifinalTelevotePoints !== null || semifinalTotalPoints !== null) && (
                <CountryChartContainer
                  juryPoints={semifinalJuryPoints}
                  televotePoints={semifinalTelevotePoints}
                  totalPoints={semifinalTotalPoints}
                />
              )}
            </Card>
          </Box>
        )}
      </Flex>
    </Container>
  );
} 