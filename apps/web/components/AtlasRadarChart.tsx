"use client";

import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface AtlasScoreProps {
  perf: number;
  crisil: number;
  aum: number;
  rep: number;
  risk: number;
  rating: number;
}

export function AtlasRadarChart({ scores }: { scores: AtlasScoreProps }) {
  const data = [
    { subject: "Performance", A: scores.perf || 0, fullMark: 100 },
    { subject: "CRISIL", A: scores.crisil || 0, fullMark: 100 },
    { subject: "AUM", A: scores.aum || 0, fullMark: 100 },
    { subject: "Reputation", A: scores.rep || 0, fullMark: 100 },
    { subject: "Risk Profile", A: scores.risk || 0, fullMark: 100 },
    { subject: "Atlas Rating", A: scores.rating || 0, fullMark: 100 },
  ];

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" className="text-xs font-semibold" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar
            name="Atlas Engine"
            dataKey="A"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.6}
          />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
