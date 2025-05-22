'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { CHART_COLORS } from '@/utils/constants';

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
  height = '300px',
}: CountryPointsChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Use the color palette from constants
    const colorPalette = CHART_COLORS;
    
    const chart = echarts.init(chartRef.current);
    
    // Check if we have both jury and televote data
    const hasBothTypes = juryPoints !== null && televotePoints !== null;
    
    if (hasBothTypes) {
      // Create a pie chart showing the breakdown
      const option = {
        // Apply the color palette
        color: colorPalette,
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'horizontal',
          bottom: 10,
          textStyle: {
            color: '#ffffff'
          },
          data: ['Jury Points', 'Televote Points']
        },
        series: [
          {
            name: 'Points Source',
            type: 'pie',
            radius: '70%',
            center: ['50%', '45%'],
            data: [
              { 
                value: juryPoints || 0, 
                name: 'Jury Points',
              },
              { 
                value: televotePoints || 0, 
                name: 'Televote Points',
              }
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            label: {
              formatter: '{b}: {c} ({d}%)',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 'bold'
            }
          }
        ]
      };
      
      chart.setOption(option as any);
    } else {
      // Create a simple gauge chart for the total points
      const pointsValue = totalPoints || juryPoints || televotePoints || 0;
      const maxPoints = Math.max(500, pointsValue * 1.2); // Adjust max based on the actual points
      
      const option = {
        // Apply the color palette
        color: colorPalette,
        series: [
          {
            name: 'Points',
            type: 'gauge',
            radius: '90%',
            startAngle: 180,
            endAngle: 0,
            center: ['50%', '60%'],
            detail: { 
              formatter: '{value}',
              fontSize: 24,
              fontWeight: 'bold',
              color: '#ffffff'
            },
            data: [{ 
              value: pointsValue, 
              name: 'Points',
              title: {
                color: '#ffffff',
                fontSize: 16
              }
            }],
            max: maxPoints,
            axisLine: {
              lineStyle: {
                width: 30,
                color: [
                  [0.3, colorPalette[0]],
                  [0.7, colorPalette[2]],
                  [1, colorPalette[1]]
                ]
              }
            },
            pointer: {
              itemStyle: {
                color: '#ffffff'
              }
            },
            axisTick: {
              distance: -30,
              length: 8,
              lineStyle: {
                color: '#fff',
                width: 2
              }
            },
            splitLine: {
              distance: -30,
              length: 30,
              lineStyle: {
                color: '#fff',
                width: 2
              }
            },
            axisLabel: {
              color: '#ffffff',
              distance: -40,
              fontSize: 12
            }
          }
        ]
      };
      
      chart.setOption(option as any);
    }
    
    // Cleanup function
    return () => {
      chart.dispose();
    };
  }, [juryPoints, televotePoints, totalPoints]);

  return (
    <div ref={chartRef} style={{ width: '100%', height }} />
  );
} 