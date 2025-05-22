'use client';

import dynamic from 'next/dynamic';
import { Box, Card, Heading } from '@radix-ui/themes';

// Dynamic import for the chart component
const VotingChart = dynamic(() => import('@/components/VotingChart'), {
  ssr: false,
  loading: () => <div style={{ height: '720px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart...</div>
});

type ChartContainerProps = {
  countries: string[];
  juryVotes: (number | null)[];
  televoteVotes: (number | null)[];
};

export default function ChartContainer({
  countries,
  juryVotes,
  televoteVotes,
}: ChartContainerProps) {
  return (
    <Box className="mb-8">
      <Heading size="5" className="mb-4">
        Voting Distribution
      </Heading>
      <Card>
        <VotingChart 
          countries={countries}
          juryVotes={juryVotes}
          televoteVotes={televoteVotes}
          height="720px"
        />
      </Card>
    </Box>
  );
} 