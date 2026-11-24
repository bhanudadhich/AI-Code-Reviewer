import React, { useEffect, useState } from "react";

// score ke hisaab se rang
const getColor = (score) => {
  if (score >= 70) return "#6366f1"; // achha
  if (score >= 40) return "#ffb783"; // theek-thaak
  return "#ffb4ab"; // kamzor
};

const ScoreSquare = ({ score = 0, color }) => {
  const size = 120;
  const pad = 10;
  const radius = 12;
  const strokeWidth = 10;

  const value = Math.max(0, Math.min(100, Number(score) || 0));
  const strokeColor = color || getColor(value);

  const side = size - pad * 2;
  const left = pad;
  const top = pad;
  const right = pad + side;
  const bottom = pad + side;
  const cx = size / 2;

  // rounded square ka sahi perimeter
  const perimeter = 4 * (side - 2 * radius) + 2 * Math.PI * radius;

  // upar ke beech se shuru, clockwise
  const d = [
    `M ${cx} ${top}`,
    `H ${right - radius}`,
    `A ${radius} ${radius} 0 0 1 ${right} ${top + radius}`,
    `V ${bottom - radius}`,
    `A ${radius} ${radius} 0 0 1 ${right - radius} ${bottom}`,
    `H ${left + radius}`,
    `A ${radius} ${radius} 0 0 1 ${left} ${bottom - radius}`,
    `V ${top + radius}`,
    `A ${radius} ${radius} 0 0 1 ${left + radius} ${top}`,
    `H ${cx}`,
  ].join(" ");

  // 0 se score tak animate
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    setProgress(0);
    const id = setTimeout(() => setProgress(value), 60);
    return () => clearTimeout(id);
  }, [value]);

  const filled = (progress / 100) * perimeter;

  return (
    <div
      className="relative w-[120px] h-[120px] shrink-0"
      style={{ width: 120, height: 120, flexShrink: 0 }}
      role="img"
      aria-label={`Score ${value} out of 100`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <path
          d={d}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <path
          d={d}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${perimeter}`}
          style={{
            opacity: progress === 0 ? 0 : 1,
            transition:
              "stroke-dasharray 1s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s",
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[32px] font-bold leading-none text-white">
          {value}
        </span>
        <span className="mt-1 text-[11px] text-gray-400">/ 100</span>
      </div>
    </div>
  );
};

export default ScoreSquare;
