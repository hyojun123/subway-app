"use client";

import { LINES } from "@/lib/constants";

interface LineSelectorProps {
  selectedLine: string;
  onSelect: (lineName: string) => void;
}

const LineSelector = ({ selectedLine, onSelect }: LineSelectorProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-4 scrollbar-hide">
      {LINES.map((line) => (
        <button
          key={line.id}
          onClick={() => onSelect(line.name)}
          className={`
            flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium
            transition-all duration-200 border-2
            ${
              selectedLine === line.name
                ? "text-white shadow-lg scale-105"
                : "text-gray-300 bg-gray-800/50 border-gray-700 hover:bg-gray-700/50"
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
  );
};

export default LineSelector;
