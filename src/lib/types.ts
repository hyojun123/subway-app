export interface SubwayAPIResponse {
  errorMessage: {
    status: number;
    code: string;
    message: string;
    link: string;
    developerMessage: string;
    total: number;
  };
  realtimePositionList: TrainPosition[];
}

export interface TrainPosition {
  subwayId: string;
  subwayNm: string;
  statnId: string;
  statnNm: string;
  trainNo: string;
  lastRecptnDt: string;
  recptnDt: string;
  updnLine: string;       // 0:상행/내선, 1:하행/외선
  statnTid: string;
  statnTnm: string;
  trainSttus: string;     // 0:진입, 1:도착, 2:출발, 3:전역출발
  directAt: string;       // 0:일반, 1:급행
  lstcarAt: string;       // 0:아님, 1:막차
}

export interface Station {
  name: string;
  x: number;
  y: number;
}

export interface LineData {
  stations: Station[];
  branches?: Station[][];
}

export interface TrainMarkerData {
  trainNo: string;
  x: number;
  y: number;
  direction: "up" | "down";
  heading: number;       // 진행 방향 각도 (degrees)
  offsetX: number;       // 상행/하행 분리 오프셋
  offsetY: number;
  isExpress: boolean;
  isLast: boolean;
  status: string;
  stationName: string;
  destinationName: string;
}
