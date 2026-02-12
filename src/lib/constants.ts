export const LINES = [
  { id: "1001", name: "1호선", color: "#0052A4" },
  { id: "1002", name: "2호선", color: "#00A84D" },
  { id: "1003", name: "3호선", color: "#EF7C1C" },
  { id: "1004", name: "4호선", color: "#00A5DE" },
  { id: "1005", name: "5호선", color: "#996CAC" },
  { id: "1006", name: "6호선", color: "#CD7C2F" },
  { id: "1007", name: "7호선", color: "#747F00" },
  { id: "1008", name: "8호선", color: "#E6186C" },
  { id: "1009", name: "9호선", color: "#BDB092" },
] as const;

export const LINE_MAP: Record<string, string> = {
  "1001": "1호선",
  "1002": "2호선",
  "1003": "3호선",
  "1004": "4호선",
  "1005": "5호선",
  "1006": "6호선",
  "1007": "7호선",
  "1008": "8호선",
  "1009": "9호선",
};

export const POLLING_INTERVAL = 15000;

export const TRAIN_STATUS: Record<string, string> = {
  "0": "진입",
  "1": "도착",
  "2": "출발",
  "3": "전역출발",
};

export const SVG_WIDTH = 1550;
export const SVG_HEIGHT = 1000;
