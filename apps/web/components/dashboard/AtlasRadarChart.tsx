"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type AtlasRadarChartProps = {
  fund: any;
  categoryAverage?: any | null;
};

export function AtlasRadarChart({
  fund,
  categoryAverage,
}: AtlasRadarChartProps) {
  // Translate DB columns to Radar dimensions
  const data = [
    {
      metric: "Returns",
      fundScore: fund.score_perf || 0,
      avgScore: categoryAverage ? 50 : null, // Default placeholder if real avg not calculated yet
    },
    {
      metric: "Risk",
      fundScore: fund.score_risk || 0,
      avgScore: categoryAverage ? 50 : null,
    },
    {
      metric: "Rating",
      fundScore: fund.score_rating || 0,
      avgScore: categoryAverage ? 50 : null,
    },
    {
      metric: "AUM",
      fundScore: fund.score_aum || 0,
      avgScore: categoryAverage ? 50 : null,
    },
    {
      metric: "Pedigree",
      fundScore: fund.score_rep || 0,
      avgScore: categoryAverage ? 50 : null,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid stroke="hsl(var(--border))" strokeWidth={1} />
        <PolarAngleAxis
          dataKey="metric"
          tick={{
            fill: "hsl(var(--muted-foreground))",
            fontSize: 10,
            fontFamily: "var(--font-geist-mono)",
          }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={false}
          axisLine={false}
        />

        {categoryAverage && (
          <Radar
            name="Category Avg"
            dataKey="avgScore"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1}
            fill="none"
            strokeDasharray="3 3"
          />
        )}

        <Radar
          name={fund.name}
          dataKey="fundScore"
          stroke="hsl(var(--foreground))"
          strokeWidth={1.5}
          fill="hsl(var(--foreground))"
          fillOpacity={0.05}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--surface))",
            borderColor: "hsl(var(--border))",
            borderRadius: "0.125rem",
            color: "hsl(var(--foreground))",
            fontFamily: "var(--font-geist-mono)",
            fontSize: "12px",
          }}
          itemStyle={{ color: "hsl(var(--foreground))" }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
