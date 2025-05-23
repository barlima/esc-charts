"use client";

import dynamic from "next/dynamic";
import { Box } from "@radix-ui/themes";

// Dynamic import for the chart component
const CountryVotesChart = dynamic(() => import("@/components/CountryVotesChart"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "300px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      Loading chart...
    </div>
  ),
});

type CountryVotesChartContainerProps = {
  votes: Array<{
    fromCountryName: string;
    juryPoints: number | null;
    televotePoints: number | null;
  }>;
  title: string;
  height?: string;
};

export default function CountryVotesChartContainer({
  votes,
  title,
  height,
}: CountryVotesChartContainerProps) {
  if (!votes || votes.length === 0) {
    return (
      <Box>
        <div className="text-center p-4">No voting data available</div>
      </Box>
    );
  }

  return (
    <Box>
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      <CountryVotesChart countryVotes={votes} height={height} />
    </Box>
  );
} 