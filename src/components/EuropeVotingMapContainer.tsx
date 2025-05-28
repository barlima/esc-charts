"use client";

import { Box, Grid, Heading } from "@radix-ui/themes";
import EuropeVotingMap from "./EuropeVotingMap";
import VotingStatsList from "./VotingStatsList";

type VotingData = {
  countryId: number;
  countryName: string;
  totalPoints: number;
};

type EuropeVotingMapContainerProps = {
  data: VotingData[];
  title: string;
  listTitle: string;
};

export default function EuropeVotingMapContainer({
  data,
  title,
  listTitle,
}: EuropeVotingMapContainerProps) {
  return (
    <Box>
      <Heading size="4" mb="4">
        {title}
      </Heading>

      <Grid columns={{ initial: "1", md: "5" }} gap="6">
        {/* Map - takes 3 columns */}
        <Box style={{ gridColumn: "span 3" }}>
          <EuropeVotingMap
            data={data}
            title="Voting Distribution Map"
            height={800}
          />
        </Box>

        {/* Top 10 List - takes 2 columns */}
        <Box style={{ gridColumn: "span 2" }}>
          <VotingStatsList data={data} title={listTitle} maxItems={10} />
        </Box>
      </Grid>
    </Box>
  );
}
