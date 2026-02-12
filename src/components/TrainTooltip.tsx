"use client";

import type { TrainMarkerData } from "@/lib/types";
import { TRAIN_STATUS, SVG_WIDTH, SVG_HEIGHT } from "@/lib/constants";

interface TrainTooltipProps {
  train: TrainMarkerData;
  color: string;
  onClose: () => void;
}

const TrainTooltip = ({ train, color, onClose }: TrainTooltipProps) => {
  // 화면 밖으로 나가지 않도록 위치 조정
  const tooltipX = Math.min(Math.max(train.x, 80), SVG_WIDTH - 80);
  const tooltipY = train.y > 100 ? train.y - 70 : train.y + 20;

  return (
    <g onClick={(e) => { e.stopPropagation(); onClose(); }} onTouchEnd={(e) => { e.stopPropagation(); onClose(); }}>
      {/* 배경 */}
      <rect
        x={tooltipX - 75}
        y={tooltipY}
        width={150}
        height={60}
        rx={6}
        fill="#1f2937"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.95}
      />
      {/* 열차번호 */}
      <text
        x={tooltipX}
        y={tooltipY + 16}
        textAnchor="middle"
        fill="#fff"
        fontSize={11}
        fontWeight="bold"
      >
        {train.trainNo}번 열차
      </text>
      {/* 종착역 & 상태 */}
      <text
        x={tooltipX}
        y={tooltipY + 32}
        textAnchor="middle"
        fill="#d1d5db"
        fontSize={10}
      >
        {train.direction === "up" ? "상행" : "하행"} · {train.destinationName}행 · {TRAIN_STATUS[train.status] ?? "운행중"}
      </text>
      {/* 현재역 & 특수 표시 */}
      <text
        x={tooltipX}
        y={tooltipY + 48}
        textAnchor="middle"
        fill="#9ca3af"
        fontSize={9}
      >
        {train.stationName}
        {train.isExpress ? " · 급행" : ""}
        {train.isLast ? " · 막차" : ""}
      </text>
    </g>
  );
};

export default TrainTooltip;
