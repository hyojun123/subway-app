"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
    if (station.x > SVG_WIDTH / 2) {
      return { lx: station.x + 14, ly: station.y + 4, anchor: "start" };
    }
    return { lx: station.x - 14, ly: station.y + 4, anchor: "end" };
  }
  return { lx: station.x, ly: station.y - 12, anchor: "middle" };
};

/** 역 좌표의 바운딩 박스 → 패딩 포함 전체 뷰 */
const getFullView = (stations: Station[]) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of stations) {
    if (s.x < minX) minX = s.x;
    if (s.y < minY) minY = s.y;
    if (s.x > maxX) maxX = s.x;
    if (s.y > maxY) maxY = s.y;
  }
  const pad = 50;
  return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
};

const ZOOM_SCALE = 2.5; // 클릭 시 확대 배율
const PAN_THRESHOLD = 5; // 이 이상 움직이면 팬으로 판정 (px)

const SubwayMap = ({ stations, trains, lineColor, isCircular = false }: SubwayMapProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedTrain, setSelectedTrain] = useState<TrainMarkerData | null>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: SVG_WIDTH, h: SVG_HEIGHT });
  const [isZoomed, setIsZoomed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panDistRef = useRef(0);
  const lastTouchDistance = useRef<number | null>(null);
  const viewBoxRef = useRef(viewBox);
  const fullViewRef = useRef({ x: 0, y: 0, w: SVG_WIDTH, h: SVG_HEIGHT });
  viewBoxRef.current = viewBox;

  // 줌 비율 계산
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

  /** 클릭 좌표를 SVG 좌표로 변환 */
  const clientToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { svgX: 0, svgY: 0 };
    const rect = svg.getBoundingClientRect();
    const vb = viewBoxRef.current;
    const svgX = vb.x + (clientX - rect.left) / rect.width * vb.w;
    const svgY = vb.y + (clientY - rect.top) / rect.height * vb.h;
    return { svgX, svgY };
  }, []);

  /** 배경 클릭: 토글 줌 */
  const handleBgClick = useCallback((e: React.MouseEvent) => {
    // 팬 동작이었으면 무시
    if (panDistRef.current > PAN_THRESHOLD) return;

    // 툴팁 닫기
    if (selectedTrain) {
      setSelectedTrain(null);
      return;
    }

    const full = fullViewRef.current;

    if (!isZoomed) {
      // 클릭 위치 중심으로 확대
      const { svgX, svgY } = clientToSvg(e.clientX, e.clientY);
      const newW = full.w / ZOOM_SCALE;
      const newH = full.h / ZOOM_SCALE;
      setViewBox({
        x: svgX - newW / 2,
        y: svgY - newH / 2,
        w: newW,
        h: newH,
      });
      setIsZoomed(true);
    } else {
      // 전체 보기로 복귀
      setViewBox(full);
      setIsZoomed(false);
    }
  }, [isZoomed, selectedTrain, clientToSvg]);

  // 마우스/터치 팬
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "touch" || e.button === 0) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      panDistRef.current = 0;
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      panDistRef.current += Math.abs(dx) + Math.abs(dy);

      const svg = svgRef.current;
      const rect = svg?.getBoundingClientRect();
      const vb = viewBoxRef.current;
      const scaleX = vb.w / (rect?.width || SVG_WIDTH);
      const scaleY = vb.h / (rect?.height || SVG_HEIGHT);
      setViewBox((v) => ({ ...v, x: v.x - dx * scaleX, y: v.y - dy * scaleY }));
      panStartRef.current = { x: e.clientX, y: e.clientY };
    },
    [isPanning]
  );

  const handlePointerUp = useCallback(() => setIsPanning(false), []);

  // 핀치 줌 & 휠 줌
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
          setIsZoomed(true);
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

      // 마우스 위치 중심으로 줌
      const rect = svg.getBoundingClientRect();
      const vb = viewBoxRef.current;
      const mouseX = vb.x + (e.clientX - rect.left) / rect.width * vb.w;
      const mouseY = vb.y + (e.clientY - rect.top) / rect.height * vb.h;

      setViewBox((v) => {
        const newW = Math.max(200, Math.min(SVG_WIDTH * 2, v.w * scale));
        const newH = Math.max(150, Math.min(SVG_HEIGHT * 2, v.h * scale));
        // 마우스 위치를 기준으로 줌
        const ratioX = (mouseX - v.x) / v.w;
        const ratioY = (mouseY - v.y) / v.h;
        return {
          x: mouseX - newW * ratioX,
          y: mouseY - newH * ratioY,
          w: newW,
          h: newH,
        };
      });
      setIsZoomed(true);
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

  // 호선 변경 시: 전체 보기로 리셋
  useEffect(() => {
    setSelectedTrain(null);
    setIsZoomed(false);
    if (stations.length === 0) return;
    const full = getFullView(stations);
    fullViewRef.current = full;
    setViewBox(full);
  }, [stations]);

  return (
    <div className="relative w-full h-full">
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

      {/* 줌 상태 표시 & 축소 버튼 */}
      {isZoomed && (
        <button
          onClick={() => {
            setViewBox(fullViewRef.current);
            setIsZoomed(false);
            setSelectedTrain(null);
          }}
          className="absolute top-3 right-3 bg-gray-800/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700/80 active:scale-95 transition-all"
        >
          전체 보기
        </button>
      )}
    </div>
  );
};

export default SubwayMap;
