import {
  Container,
  Heading,
  Text,
  Box,
  Flex,
  Card,
} from "@radix-ui/themes";
import { 
  getCountryPerformanceHistory,
  getCountryVotingStatsGiven,
  getCountryVotingStatsReceived
} from "@/app/actions";
import { notFound } from "next/navigation";
import { supabase } from "@/utils/supabase";
import Link from "next/link";
import CountryHistoryChartContainer from "@/components/CountryHistoryChartContainer";
import EuropeVotingMapContainer from "@/components/EuropeVotingMapContainer";

export default async function CountryHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: countryId } = await params;
  const countryIdNum = parseInt(countryId, 10);

  if (isNaN(countryIdNum)) {
    notFound();
  }

  // Fetch country data
  const { data: countryData, error: countryError } = await supabase
    .from("countries")
    .select("*")
    .eq("id", countryIdNum)
    .single();

  if (countryError || !countryData) {
    notFound();
  }

  // Fetch country performance history
  const { performances, errorMessage } = await getCountryPerformanceHistory(countryIdNum);

  // Fetch voting statistics
  const { votingStats: votingStatsGiven, errorMessage: votingGivenError } = 
    await getCountryVotingStatsGiven(countryIdNum);
  const { votingStats: votingStatsReceived, errorMessage: votingReceivedError } = 
    await getCountryVotingStatsReceived(countryIdNum);

  return (
    <Container className="py-16 max-w-5xl mx-auto">
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
            <Text size="2">{countryData.name} ESC History</Text>
          </Flex>
        </Box>

        {/* Country name heading */}
        <Heading size="8">{countryData.name}</Heading>

        {/* Eurovision history subheading */}
        <Heading size="5" as="h2" color="gray">
          Eurovision Song Contest History
        </Heading>

        {/* Error Message */}
        {errorMessage && (
          <Card className="p-4 mb-4 bg-red-50">
            <Text size="2" color="red">
              Error loading performance history: {errorMessage}
            </Text>
          </Card>
        )}

        {/* Performance summary */}
        {performances.length > 0 && (
          <Card className="p-6" mb="4">
            <Flex direction="column" gap="2">
              <Text size="3" weight="bold">
                Performance Summary
              </Text>
              <Text size="2" color="gray">
                Total appearances: {performances.length}
              </Text>
              <Text size="2" color="gray">
                Years active: {Math.min(...performances.map(p => p.year))} - {Math.max(...performances.map(p => p.year))}
              </Text>
              {performances.some(p => p.finalPlace === 1) && (
                <Text size="2" color="green">
                  🏆 Eurovision Winner: {performances.filter(p => p.finalPlace === 1).map(p => p.year).join(', ')}
                </Text>
              )}
            </Flex>
          </Card>
        )}

        {/* Chart */}
        {performances.length > 0 ? (
          <section>
            <Heading size="4" mb="3">
              Final Position Over Time
            </Heading>
            <Text size="2" color="gray" mb="4">
              This chart shows {countryData.name}&apos;s final position in each Eurovision Song Contest they qualified for.
              Only years where the country reached the final are displayed.
            </Text>
            <CountryHistoryChartContainer
              performances={performances}
              countryName={countryData.name}
            />
          </section>
        ) : (
          <Card className="p-6" mb="4">
            <Flex direction="column" align="center" gap="3">
              <Text size="4" weight="bold">
                No Final Appearances
              </Text>
              <Text size="2" color="gray" align="center">
                {countryData.name} has not qualified for any Eurovision Song Contest finals
                in our database, or their performance data is not yet available.
              </Text>
            </Flex>
          </Card>
        )}

        {/* Voting Statistics - Points Given */}
        {votingStatsGiven.length > 0 && (
          <section>
            <EuropeVotingMapContainer
              data={votingStatsGiven.map(stat => ({
                countryId: stat.toCountryId,
                countryName: stat.toCountryName,
                totalPoints: stat.totalPoints
              }))}
              title={`Points Given by ${countryData.name}`}
              listTitle="Top 10 Countries - Points Given"
            />
          </section>
        )}

        {/* Voting Statistics - Points Received */}
        {votingStatsReceived.length > 0 && (
          <section>
            <EuropeVotingMapContainer
              data={votingStatsReceived.map(stat => ({
                countryId: stat.fromCountryId,
                countryName: stat.fromCountryName,
                totalPoints: stat.totalPoints
              }))}
              title={`Points Received by ${countryData.name}`}
              listTitle="Top 10 Countries - Points Received"
            />
          </section>
        )}

        {/* Error messages for voting stats */}
        {votingGivenError && (
          <Card className="p-4 mb-4 bg-red-50">
            <Text size="2" color="red">
              Error loading voting statistics (given): {votingGivenError}
            </Text>
          </Card>
        )}

        {votingReceivedError && (
          <Card className="p-4 mb-4 bg-red-50">
            <Text size="2" color="red">
              Error loading voting statistics (received): {votingReceivedError}
            </Text>
          </Card>
        )}
      </Flex>
    </Container>
  );
} 