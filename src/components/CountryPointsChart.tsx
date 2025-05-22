"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { CHART_COLORS } from "@/utils/constants";

type CountryPointsChartProps = {
  juryPoints: number | null;
  televotePoints: number | null;
  totalPoints: number | null;
  height?: string;
};

export default function CountryPointsChart({
  juryPoints,
  televotePoints,
  totalPoints,
  height = "300px",
}: CountryPointsChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Use the color palette from constants
    const colorPalette = CHART_COLORS;

    const chart = echarts.init(chartRef.current);

    // Create a pie chart showing the breakdown
    chart.setOption({
      // Apply the color palette
      color: colorPalette,
      // Remove tooltip completely
      tooltip: {
        show: false,
      },
      legend: {
        orient: "horizontal",
        bottom: 10,
        textStyle: {
          color: "#ffffff",
        },
        data: ["Jury Points", "Televote Points"],
      },
      series: [
        {
          name: "Points Source",
          type: "pie",
          radius: "70%",
          center: ["50%", "45%"],
          data: [
            {
              value: juryPoints || 0,
              name: "Jury Points",
            },
            {
              value: televotePoints || 0,
              name: "Televote Points",
            },
          ],
          // Always show labels, even for zero values
          label: {
            show: true,
            formatter: "{c} ({d}%)",
            color: "#ffffff",
            fontSize: 14,
            fontWeight: "bold",
          },
          // Don't hide zero value segments
          avoidLabelOverlap: false,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    });

    // Cleanup function
    return () => {
      chart.dispose();
    };
  }, [juryPoints, televotePoints, totalPoints]);

  return <div ref={chartRef} style={{ width: "100%", height }} />;
}
