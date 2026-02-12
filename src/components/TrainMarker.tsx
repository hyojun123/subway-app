"use client";

import { memo } from "react";
import type { TrainMarkerData } from "@/lib/types";

interface TrainMarkerProps {
  train: TrainMarkerData;
  color: string;
  onSelect: (train: TrainMarkerData) => void;
}

const TrainMarker = memo(({ train, color, onSelect }: TrainMarkerProps) => {
  return (
    <g
      className="cursor-pointer"
      style={{
        transition: "transform 1s ease-in-out",
        transform: `translate(${train.x + train.offsetX}px, ${train.y + train.offsetY}px)`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(train);
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect(train);
      }}
    >
      {/* 열차 본체 */}
      <circle
        r={7}
        fill={color}
        stroke={train.isExpress ? "#FF0000" : "#fff"}
        strokeWidth={train.isExpress ? 2.5 : 1.5}
        className={train.isLast ? "animate-pulse" : ""}
      />
      {/* 진행 방향 화살표 */}
      <polygon
        points="-3,-2.5 4,0 -3,2.5"
        fill="#fff"
        transform={`rotate(${train.heading})`}
      />
      {/* 급행 표시 */}
      {train.isExpress && (
        <text
          y={-11}
          textAnchor="middle"
          fill="#FF0000"
          fontSize={9}
          fontWeight="bold"
        >
          급행
        </text>
      )}
    </g>
  );
});

TrainMarker.displayName = "TrainMarker";

export default TrainMarker;
