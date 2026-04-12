import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnimatedAreaChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  gradientFrom?: string;
  gradientTo?: string;
  strokeColor?: string;
}

export function AnimatedAreaChart({
  data,
  xKey,
  yKey,
  gradientFrom = '#06B6D4',
  gradientTo = '#8B5CF6',
  strokeColor = '#06B6D4'
}: AnimatedAreaChartProps) {
  
  // Unique ID for the gradient based on colors to avoid conflicts
  const gradientId = `color-${xKey}-${yKey}`;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={gradientFrom} stopOpacity={0.4} />
            <stop offset="95%" stopColor={gradientTo} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
        <XAxis 
          dataKey={xKey} 
          axisLine={false} 
          tickLine={false}
          tick={{ fill: '#A1A1AA', fontSize: 12 }}
          dy={10}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#A1A1AA', fontSize: 12 }}
          dx={-10}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#18181B', 
            border: '1px solid #27272A',
            borderRadius: '8px',
            color: '#fff',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
          }}
          itemStyle={{ color: '#fff' }}
        />
        <Area 
          type="monotone" 
          dataKey={yKey} 
          stroke={strokeColor} 
          strokeWidth={3}
          fillOpacity={1} 
          fill={`url(#${gradientId})`}
          activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
          animationDuration={1500}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
