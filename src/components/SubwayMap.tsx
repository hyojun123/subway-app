"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { Station, TrainMarkerData } from "@/lib/types";
import { SVG_WIDTH, SVG_HEIGHT } from "@/lib/constants";
import TrainMarker from "./TrainMarker";
import TrainTooltip from "./TrainTooltip";

interface SubwayMapProps {
  stations: Station[];
  trains: TrainMarkerData[];
  lineColor: string;
  isCircular?: boolean;
}

/** 수직/수평 구간 판별 후 라벨 위치 반환 */
const getLabelPos = (
  station: Station,
  i: number,
  stations: Station[]
): { lx: number; ly: number; anchor: "start" | "middle" | "end" } => {
  const prev = stations[Math.max(0, i - 1)];
  const next = stations[Math.min(stations.length - 1, i + 1)];
  const dx = Math.abs(next.x - prev.x);
  const dy = Math.abs(next.y - prev.y);

  if (dy > dx * 1.5) {
    // 수직 구간: 라벨을 좌/우로 배치
    if (station.x > SVG_WIDTH / 2) {
      return { lx: station.x + 14, ly: station.y + 4, anchor: "start" };
    }
    return { lx: station.x - 14, ly: station.y + 4, anchor: "end" };
  }
  // 수평 구간: 라벨을 위에 배치
  return { lx: station.x, ly: station.y - 12, anchor: "middle" };
};

/** 역 좌표의 바운딩 박스 계산 */
const getBounds = (stations: Station[]) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of stations) {
    if (s.x < minX) minX = s.x;
    if (s.y < minY) minY = s.y;
    if (s.x > maxX) maxX = s.x;
    if (s.y > maxY) maxY = s.y;
  }
  return { minX, minY, maxX, maxY };
};

/** 모바일 판별 (SSR 안전) */
const isMobile = () =>
  typeof window !== "undefined" && window.innerWidth < 768;

const SubwayMap = ({ stations, trains, lineColor, isCircular = false }: SubwayMapProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedTrain, setSelectedTrain] = useState<TrainMarkerData | null>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: SVG_WIDTH, h: SVG_HEIGHT });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef<number | null>(null);
  const viewBoxRef = useRef(viewBox);
  viewBoxRef.current = viewBox;

  // 줌 비율 계산 (1 = 기본, 작을수록 확대)
  const zoomRatio = viewBox.w / SVG_WIDTH;
  const showLabels = zoomRatio < 1.15;

  // 역 사이 연결선 생성 (polyline)
  const linePath = stations.map((s) => `${s.x},${s.y}`).join(" ");
  const circularClose =
    isCircular && stations.length > 0 ? ` ${stations[0].x},${stations[0].y}` : "";

  const handleSelect = useCallback((train: TrainMarkerData) => {
    setSelectedTrain((prev) => (prev?.trainNo === train.trainNo ? null : train));
  }, []);

  const handleClose = useCallback(() => setSelectedTrain(null), []);
  const handleBgClick = useCallback(() => setSelectedTrain(null), []);

  // 마우스/터치 팬
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "touch" || e.button === 0) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning) return;
      const vb = viewBoxRef.current;
      const svg = svgRef.current;
      const rect = svg?.getBoundingClientRect();
      const scaleX = vb.w / (rect?.width || SVG_WIDTH);
      const scaleY = vb.h / (rect?.height || SVG_HEIGHT);
      const dx = (e.clientX - panStartRef.current.x) * scaleX;
      const dy = (e.clientY - panStartRef.current.y) * scaleY;
      setViewBox((v) => ({ ...v, x: v.x - dx, y: v.y - dy }));
      panStartRef.current = { x: e.clientX, y: e.clientY };
    },
    [isPanning]
  );

  const handlePointerUp = useCallback(() => setIsPanning(false), []);

  // 핀치 줌 & 휠 줌: passive: false로 등록하여 preventDefault 사용
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (lastTouchDistance.current !== null) {
          const scale = lastTouchDistance.current / distance;
          setViewBox((v) => {
            const newW = Math.max(200, Math.min(SVG_WIDTH * 2, v.w * scale));
            const newH = Math.max(150, Math.min(SVG_HEIGHT * 2, v.h * scale));
            const cx = v.x + v.w / 2;
            const cy = v.y + v.h / 2;
            return { x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH };
          });
        }
        lastTouchDistance.current = distance;
      }
    };

    const onTouchEnd = () => {
      lastTouchDistance.current = null;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const scale = e.deltaY > 0 ? 1.1 : 0.9;
      setViewBox((v) => {
        const newW = Math.max(200, Math.min(SVG_WIDTH * 2, v.w * scale));
        const newH = Math.max(150, Math.min(SVG_HEIGHT * 2, v.h * scale));
        const cx = v.x + v.w / 2;
        const cy = v.y + v.h / 2;
        return { x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH };
      });
    };

    svg.addEventListener("touchmove", onTouchMove, { passive: false });
    svg.addEventListener("touchend", onTouchEnd);
    svg.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      svg.removeEventListener("touchmove", onTouchMove);
      svg.removeEventListener("touchend", onTouchEnd);
      svg.removeEventListener("wheel", onWheel);
    };
  }, []);

  // 호선 변경 시: 모바일이면 노선에 맞춰 확대, 데스크톱이면 전체 보기
  useEffect(() => {
    setSelectedTrain(null);

    if (stations.length === 0) return;

    if (isMobile()) {
      const { minX, minY, maxX, maxY } = getBounds(stations);
      const padding = 60;
      const contentW = maxX - minX + padding * 2;
      const contentH = maxY - minY + padding * 2;
      // 모바일: 너비 기준 50% 영역만 보여주기 (약 2배 확대)
      const mobileW = contentW * 0.55;
      const mobileH = contentH * 0.55;
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      setViewBox({
        x: cx - mobileW / 2,
        y: cy - mobileH / 2,
        w: mobileW,
        h: mobileH,
      });
    } else {
      setViewBox({ x: 0, y: 0, w: SVG_WIDTH, h: SVG_HEIGHT });
    }
  }, [stations]);

  return (
    <svg
      ref={svgRef}
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
      className="w-full h-full touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleBgClick}
    >
      {/* 배경 */}
      <rect width={SVG_WIDTH * 2} height={SVG_HEIGHT * 2} x={-SVG_WIDTH / 2} y={-SVG_HEIGHT / 2} fill="transparent" />

      {/* 노선 라인 */}
      <polyline
        points={linePath + circularClose}
        fill="none"
        stroke={lineColor}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.6}
      />

      {/* 역 노드 */}
      {stations.map((station, i) => {
        const { lx, ly, anchor } = getLabelPos(station, i, stations);
        return (
          <g key={`${station.name}-${i}`}>
            <circle
              cx={station.x}
              cy={station.y}
              r={5}
              fill="#1f2937"
              stroke={lineColor}
              strokeWidth={2.5}
            />
            {showLabels && (
              <text
                x={lx}
                y={ly}
                textAnchor={anchor}
                fill="#d1d5db"
                fontSize={10}
                pointerEvents="none"
              >
                {station.name}
              </text>
            )}
          </g>
        );
      })}

      {/* 열차 마커 */}
      {trains.map((train, i) => (
        <TrainMarker
          key={`${train.trainNo}-${i}`}
          train={train}
          color={lineColor}
          onSelect={handleSelect}
        />
      ))}

      {/* 선택된 열차 툴팁 */}
      {selectedTrain && (
        <TrainTooltip train={selectedTrain} color={lineColor} onClose={handleClose} />
      )}
    </svg>
  );
};

export default SubwayMap;
