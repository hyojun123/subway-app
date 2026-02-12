"use client";

import { useState, useMemo, useCallback } from "react";
import useSWR from "swr";
import SubwayMap from "@/components/SubwayMap";
import LineSelector from "@/components/LineSelector";
import { fetcher, getTrainPositionsUrl } from "@/lib/api";
import { calculateTrainPosition } from "@/lib/trainPosition";
import { LINES, POLLING_INTERVAL } from "@/lib/constants";
import type { Station, LineData } from "@/lib/types";

// 역 좌표 데이터 동적 import
import line1Data from "@/data/stations/line1.json";
import line2Data from "@/data/stations/line2.json";
import line3Data from "@/data/stations/line3.json";
import line4Data from "@/data/stations/line4.json";
import line5Data from "@/data/stations/line5.json";
import line6Data from "@/data/stations/line6.json";
import line7Data from "@/data/stations/line7.json";
import line8Data from "@/data/stations/line8.json";
import line9Data from "@/data/stations/line9.json";

const stationDataMap: Record<string, LineData> = {
  "1호선": line1Data,
  "2호선": line2Data,
  "3호선": line3Data,
  "4호선": line4Data,
  "5호선": line5Data,
  "6호선": line6Data,
  "7호선": line7Data,
  "8호선": line8Data,
  "9호선": line9Data,
};

const Home = () => {
  const [selectedLine, setSelectedLine] = useState("2호선");

  const lineInfo = LINES.find((l) => l.name === selectedLine)!;
  const stationData = stationDataMap[selectedLine];
  const stations: Station[] = stationData?.stations ?? [];

  const { data, error, isLoading } = useSWR(
    getTrainPositionsUrl(selectedLine),
    fetcher,
    {
      refreshInterval: POLLING_INTERVAL,
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  const trains = useMemo(() => {
    if (!data?.realtimePositionList) return [];
    return data.realtimePositionList
      .map((t) => calculateTrainPosition(t, stations))
      .filter((t): t is NonNullable<typeof t> => t !== null);
  }, [data, stations]);

  const lastUpdate = data?.realtimePositionList?.[0]?.recptnDt ?? null;

  const handleLineSelect = useCallback((lineName: string) => {
    setSelectedLine(lineName);
  }, []);

  return (
    <main className="h-dvh flex flex-col bg-gray-950 safe-area-inset">
      {/* 헤더 */}
      <header className="flex-shrink-0 pt-safe px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-white">서울 지하철 실시간</h1>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {isLoading && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                로딩중
              </span>
            )}
            {error && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-400 rounded-full" />
                연결 오류
              </span>
            )}
            {!isLoading && !error && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                실시간
              </span>
            )}
          </div>
        </div>
        <LineSelector selectedLine={selectedLine} onSelect={handleLineSelect} />
      </header>

      {/* 노선도 */}
      <div className="flex-1 relative overflow-hidden">
        {stations.length > 0 ? (
          <SubwayMap
            stations={stations}
            trains={trains}
            lineColor={lineInfo.color}
            isCircular={selectedLine === "2호선"}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            노선 데이터를 불러올 수 없습니다
          </div>
        )}

        {/* 열차 수 표시 */}
        {trains.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-gray-800/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-gray-300">
            운행중 {trains.length}대
          </div>
        )}

        {/* 마지막 업데이트 시간 */}
        {lastUpdate && (
          <div className="absolute bottom-4 right-4 bg-gray-800/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-gray-400">
            {lastUpdate}
          </div>
        )}

        {/* 에러 배너 */}
        {error && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-900/80 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-red-200">
            데이터를 불러올 수 없습니다
          </div>
        )}

        {/* 운행 시간 외 메시지 */}
        {!isLoading && !error && data && trains.length === 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-gray-500">
            <p className="text-lg">현재 운행 중인 열차가 없습니다</p>
            <p className="text-sm mt-1">운행 시간이 아닐 수 있습니다</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default Home;
