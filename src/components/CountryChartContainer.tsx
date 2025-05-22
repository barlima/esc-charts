'use client';

import dynamic from 'next/dynamic';
import { Box } from '@radix-ui/themes';

// Dynamic import for the chart component
const CountryPointsChart = dynamic(() => import('@/components/CountryPointsChart'), {
  ssr: false,
  loading: () => <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart...</div>
});

type CountryChartContainerProps = {
  juryPoints: number | null;
  televotePoints: number | null;
  totalPoints: number | null;
};

export default function CountryChartContainer({
  juryPoints,
  televotePoints,
  totalPoints,
}: CountryChartContainerProps) {
  return (
    <Box mt="6">
      <CountryPointsChart 
        juryPoints={juryPoints}
        televotePoints={televotePoints}
        totalPoints={totalPoints}
      />
    </Box>
  );
} 