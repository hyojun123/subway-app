"use client";

import { useRef, useEffect } from "react";
import { LINES } from "@/lib/constants";

interface LineSelectorProps {
  selectedLine: string;
  onSelect: (lineName: string) => void;
}

const LineSelector = ({ selectedLine, onSelect }: LineSelectorProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 선택된 호선이 보이도록 스크롤
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const idx = LINES.findIndex((l) => l.name === selectedLine);
    const btn = container.children[idx] as HTMLElement | undefined;
    btn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selectedLine]);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
      >
        {LINES.map((line) => (
          <button
            key={line.id}
            onClick={() => onSelect(line.name)}
            className={`
              flex-shrink-0 snap-center px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-200 border-2 active:scale-95
              ${
                selectedLine === line.name
                  ? "text-white shadow-lg scale-105"
                  : "text-gray-300 bg-gray-800/50 border-gray-700"
              }
            `}
            style={
              selectedLine === line.name
                ? { backgroundColor: line.color, borderColor: line.color }
                : undefined
            }
          >
            {line.name}
          </button>
        ))}
      </div>
      {/* 오른쪽 스크롤 힌트 그라데이션 */}
      <div className="absolute right-0 top-0 bottom-2 w-8 pointer-events-none bg-gradient-to-l from-gray-950 to-transparent" />
    </div>
  );
};

export default LineSelector;
