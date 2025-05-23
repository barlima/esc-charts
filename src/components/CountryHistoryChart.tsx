"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { CHART_COLORS } from "@/utils/constants";

type CountryHistoryChartProps = {
  performances: Array<{
    year: number;
    finalPlace: number | null;
    semifinalPlace: number | null;
    venueType: "final" | "semifinal1" | "semifinal2" | null;
    qualified: boolean | null;
  }>;
  countryName: string;
  height?: string;
};

export default function CountryHistoryChart({
  performances,
  countryName,
  height = "600px",
}: CountryHistoryChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    // Separate final and semi-final performances
    const finalPerformances = performances.filter(p => p.finalPlace !== null);
    const semifinalOnlyPerformances = performances.filter(p => 
      p.semifinalPlace !== null && p.finalPlace === null
    );

    // Find the worst (highest number) final place for this country
    const worstFinalPlace = finalPerformances.length > 0 
      ? Math.max(...finalPerformances.map(p => p.finalPlace!))
      : 26; // Default if no final performances

    // Get the current year for x-axis range
    const currentYear = new Date().getFullYear();
    const startYear = 1956;

    // Combine all performances into one continuous dataset
    const allDataPoints: Array<{
      year: number;
      position: number;
      type: 'final' | 'semifinal';
      originalPosition: number;
    }> = [];
    
    // Add final performances
    finalPerformances.forEach(p => {
      allDataPoints.push({
        year: p.year,
        position: p.finalPlace!,
        type: 'final',
        originalPosition: p.finalPlace!,
      });
    });
    
    // Add semi-final performances with adjusted positions
    semifinalOnlyPerformances.forEach(p => {
      const adjustedPosition = worstFinalPlace + (p.semifinalPlace! - 10);
      allDataPoints.push({
        year: p.year,
        position: adjustedPosition,
        type: 'semifinal',
        originalPosition: p.semifinalPlace!,
      });
    });

    // Sort by year to create continuous line
    allDataPoints.sort((a, b) => a.year - b.year);

    // Convert to chart format
    const chartData = allDataPoints.map(p => [p.year, p.position]);

    // Calculate maximum Y value to include all points
    const maxYValue = Math.max(
      worstFinalPlace,
      ...allDataPoints.filter(p => p.type === 'semifinal').map(p => p.position)
    );

    // Prepare mark points for wins (1st place)
    const winMarkPoints = finalPerformances
      .filter(p => p.finalPlace === 1)
      .map(p => ({
        coord: [p.year, p.finalPlace!],
        symbol: 'circle',
        symbolSize: 30,
        itemStyle: {
          color: '#FFD700',
          borderColor: '#FFA500',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '🏆',
          fontSize: 16,
          color: '#FFD700',
          fontWeight: 'bold',
        },
      }));

    // Prepare mark line for separation between final and semi-final results
    const markLines = semifinalOnlyPerformances.length > 0 ? [{
      yAxis: worstFinalPlace + 0.5,
      lineStyle: {
        color: '#ffffff',
        width: 2,
        type: 'solid',
      },
      symbol: 'none', // Remove the arrow
      label: {
        show: false,
      },
    }] : [];

    chart.setOption({
      color: CHART_COLORS,
      backgroundColor: 'transparent',
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        min: startYear,
        max: currentYear,
        interval: 10,
        name: 'Year',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: {
          color: '#ffffff',
          fontSize: 14,
        },
        axisLabel: {
          color: '#ffffff',
          fontSize: 12,
          formatter: (value: number) => value.toString(),
        },
        axisLine: {
          lineStyle: {
            color: '#ffffff',
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#333333',
            type: 'dashed',
          },
        },
      },
      yAxis: {
        type: 'value',
        min: 1,
        max: maxYValue + 1,
        inverse: true,
        minInterval: 1,
        name: 'Position',
        nameLocation: 'middle',
        nameGap: 50,
        nameTextStyle: {
          color: '#ffffff',
          fontSize: 14,
        },
        axisLabel: {
          color: '#ffffff',
          fontSize: 12,
          formatter: (value: number) => {
            if (value !== Math.floor(value)) return '';
            // Hide labels for positions below the worst final result
            if (value > worstFinalPlace) return '';
            if (value === 1) return '1st';
            if (value === 2) return '2nd';
            if (value === 3) return '3rd';
            return `${value}th`;
          },
        },
        axisLine: {
          lineStyle: {
            color: '#ffffff',
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#333333',
            type: 'dashed',
          },
        },
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#70b8ff',
        borderWidth: 1,
        textStyle: {
          color: '#ffffff',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          if (!params.data) return '';
          const [year, place] = params.data;
          
          // Find the corresponding data point
          const dataPoint = allDataPoints.find(p => p.year === year);
          if (dataPoint && dataPoint.type === 'semifinal') {
            return `<strong>${countryName}</strong><br/>Year: ${year}<br/>Semi-final Position: ${dataPoint.originalPosition}${dataPoint.originalPosition === 1 ? 'st' : dataPoint.originalPosition === 2 ? 'nd' : dataPoint.originalPosition === 3 ? 'rd' : 'th'}<br/><span style="color: #ef476f;">Did not qualify</span>`;
          }
          
          const suffix = place === 1 ? 'st' : place === 2 ? 'nd' : place === 3 ? 'rd' : 'th';
          return `<strong>${countryName}</strong><br/>Year: ${year}<br/>Final Position: ${place}${suffix}`;
        },
      },
      series: [
        // Single continuous line with different colored points
        {
          name: `${countryName} Eurovision Results`,
          type: 'line',
          data: chartData,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            width: 3,
            color: CHART_COLORS[0],
          },
          itemStyle: {
            borderColor: '#ffffff',
            borderWidth: 2,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            color: (params: any) => {
              const year = params.data[0];
              const dataPoint = allDataPoints.find(p => p.year === year);
              return dataPoint?.type === 'semifinal' ? '#ef476f' : CHART_COLORS[0];
            },
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          markPoint: {
            data: winMarkPoints,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
          markLine: {
            data: markLines,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        },
      ],
    });

    // Handle window resize
    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [performances, countryName]);

  return <div ref={chartRef} style={{ width: "100%", height }} />;
} 