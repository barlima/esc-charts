"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { CHART_COLORS } from "@/utils/constants";

type VotingChartProps = {
  countries: string[];
  juryVotes: (number | null)[];
  televoteVotes: (number | null)[];
  height?: string;
};

export default function VotingChart({
  countries,
  juryVotes,
  televoteVotes,
  height = "600px",
}: VotingChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Use the color palette from constants
    const colorPalette = CHART_COLORS;
    
    const chart = echarts.init(chartRef.current);

    // Check if we have both jury and televote data
    const hasBothTypes =
      juryVotes.some((v) => v !== null) &&
      televoteVotes.some((v) => v !== null);

    // Sort countries and votes by televote + jury points (ascending for y-axis)
    const sortedData = countries
      .map((country, i) => ({
        country,
        juryVote: juryVotes[i] || 0,
        televoteVote: televoteVotes[i] || 0,
        totalPoints: (juryVotes[i] || 0) + (televoteVotes[i] || 0),
      }))
      .sort((a, b) => a.totalPoints - b.totalPoints);

    // Extract sorted data - for y-axis in ECharts the first item is at the bottom
    const sortedCountries = sortedData.map((d) => d.country);
    // Add total points to country labels for clarity
    const yAxisLabels = sortedData.map(
      (d) => `${d.country} (${d.totalPoints})`
    );
    const sortedJuryVotes = sortedData.map((d) => d.juryVote);
    const sortedTelevoteVotes = sortedData.map((d) => d.televoteVote);

    // Fixed bar width of 20px
    const barWidth = 20;

    if (hasBothTypes) {
      // Create pyramid chart (bar chart with negative values on left side)
      const option = {
        // Set the global color palette
        color: colorPalette,
        // Remove title
        legend: {
          data: ["Jury", "Televote"],
          bottom: 10,
          textStyle: {
            color: "#ffffff",
          },
        },
        grid: {
          left: "5%",
          right: "5%",
          top: "20",
          bottom: "10%",
          containLabel: true,
        },
        // Remove tooltip
        tooltip: {
          show: false,
        },
        xAxis: {
          type: "value",
          axisLabel: {
            formatter: function (value: number) {
              return Math.abs(value).toString();
            },
          },
          // Hide grid lines
          splitLine: {
            show: false,
          },
        },
        yAxis: {
          type: "category",
          data: sortedCountries, // Keep original country names for simplicity
          axisTick: {
            alignWithLabel: true,
          },
          // Increase space between countries
          axisLabel: {
            margin: 15,
          },
          // Hide grid lines
          splitLine: {
            show: false,
          },
        },
        series: [
          {
            name: "Jury",
            type: "bar",
            stack: "Total",
            barWidth: barWidth, // Fixed width of 20px
            barGap: "10%", // Add gap between bars
            itemStyle: {
              borderRadius: [50, 0, 0, 50] // Round top-left and bottom-left corners
            },
            label: {
              show: true,
              formatter: function (params: any) {
                return params.value ? Math.abs(params.value).toString() : "";
              },
              position: "outside", // Always outside the bar
              color: "#ffffff",
              fontSize: 12,
            },
            data: sortedJuryVotes.map((vote) =>
              vote === null ? 0 : -1 * vote
            ),
          },
          {
            name: "Televote",
            type: "bar",
            stack: "Total",
            barWidth: barWidth, // Fixed width of 20px
            barGap: "10%", // Add gap between bars
            itemStyle: {
              borderRadius: [0, 50, 50, 0] // Round top-right and bottom-right corners
            },
            label: {
              show: true,
              position: "outside", // Always outside the bar
              color: "#ffffff",
              fontSize: 12,
              formatter: function (params: any) {
                return params.value || "";
              },
              // Ensure labels for zero values are positioned on the right side
              positionByValue: false,
              align: "left",
              distance: 5,
            },
            data: sortedTelevoteVotes.map((vote) => (vote === null ? 0 : vote)),
          },
        ],
      };

      chart.setOption(option as any);
    } else {
      // Create simple column chart for available data
      const availableVotes = juryVotes.some((v) => v !== null)
        ? sortedJuryVotes
        : sortedTelevoteVotes;
      const seriesName = juryVotes.some((v) => v !== null)
        ? "Jury"
        : "Televote";

      const option = {
        // Set the global color palette
        color: colorPalette,
        // Remove title
        legend: {
          data: [seriesName],
          bottom: 10,
          textStyle: {
            color: "#ffffff",
          },
        },
        grid: {
          left: "5%",
          right: "5%",
          top: "20",
          bottom: "10%",
          containLabel: true,
        },
        // Remove tooltip
        tooltip: {
          show: false,
        },
        yAxis: {
          type: "category",
          data: sortedCountries,
          axisTick: {
            alignWithLabel: true,
          },
          // Increase space between countries
          axisLabel: {
            margin: 15,
          },
          // Hide grid lines
          splitLine: {
            show: false,
          },
        },
        xAxis: {
          type: "value",
          // Hide grid lines
          splitLine: {
            show: false,
          },
        },
        series: [
          {
            name: seriesName,
            type: "bar",
            barWidth: barWidth, // Fixed width of 20px
            itemStyle: {
              borderRadius: [0, 10, 10, 0] // Rounded corners
            },
            label: {
              show: true,
              position: "outside", // Position labels outside the bars
              color: "#ffffff",
              fontSize: 12,
            },
            data: availableVotes.map((vote) => (vote === null ? 0 : vote)),
          },
        ],
      };

      chart.setOption(option as any);
    }

    // Cleanup function
    return () => {
      chart.dispose();
    };
  }, [countries, juryVotes, televoteVotes]);

  return <div ref={chartRef} style={{ width: "100%", height }} />;
}
