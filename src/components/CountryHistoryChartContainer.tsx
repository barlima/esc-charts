"use client";

import dynamic from "next/dynamic";
import { Box, Card } from "@radix-ui/themes";

// Dynamic import for the chart component
const CountryHistoryChart = dynamic(() => import("@/components/CountryHistoryChart"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "600px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      Loading chart...
    </div>
  ),
});

type CountryHistoryChartContainerProps = {
  performances: Array<{
    year: number;
    finalPlace: number | null;
    semifinalPlace: number | null;
    venueType: "final" | "semifinal1" | "semifinal2" | null;
    qualified: boolean | null;
  }>;
  countryName: string;
};

export default function CountryHistoryChartContainer({
  performances,
  countryName,
}: CountryHistoryChartContainerProps) {
  return (
    <Box className="mb-8 mt-8">
      <Card className="p-6">
        <CountryHistoryChart
          performances={performances}
          countryName={countryName}
          height="600px"
        />
      </Card>
    </Box>
  );
} 