import type { SubwayAPIResponse } from "./types";

export const fetcher = async (url: string): Promise<SubwayAPIResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export const getTrainPositionsUrl = (line: string) =>
  `/api/subway?line=${encodeURIComponent(line)}`;
