import type { Station, TrainPosition, TrainMarkerData } from "./types";

const OFFSET = 18; // 상행/하행 분리 거리 (px)

const interpolate = (
  from: Station,
  to: Station,
  ratio: number
): { x: number; y: number } => ({
  x: from.x + (to.x - from.x) * ratio,
  y: from.y + (to.y - from.y) * ratio,
});

/**
 * 노선 방향에 대해 항상 "위쪽"을 가리키는 수직 벡터 계산
 */
const getUpwardPerpendicular = (dx: number, dy: number) => {
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ndx = dx / len;
  const ndy = dy / len;

  const pAx = -ndy, pAy = ndx;
  const pBx = ndy, pBy = -ndx;

  if (Math.abs(pAy - pBy) > 0.01) {
    return pAy < pBy ? { px: pAx, py: pAy } : { px: pBx, py: pBy };
  }
  return pAx < pBx ? { px: pAx, py: pAy } : { px: pBx, py: pBy };
};

export const calculateTrainPosition = (
  train: TrainPosition,
  stations: Station[]
): TrainMarkerData | null => {
  const stationIndex = stations.findIndex((s) => s.name === train.statnNm);
  if (stationIndex === -1) return null;

  const current = stations[stationIndex];

  // 2호선(1002)은 내선(0)=인덱스 증가, 외선(1)=인덱스 감소 (다른 호선과 반대)
  const isLine2 = train.subwayId === "1002";
  const movesTowardHigherIndex = isLine2
    ? train.updnLine === "0"
    : train.updnLine === "1";

  // behind: 열차가 지나온 역, ahead: 열차가 향하는 역
  const behind = movesTowardHigherIndex
    ? stations[Math.max(0, stationIndex - 1)]
    : stations[Math.min(stations.length - 1, stationIndex + 1)];
  const ahead = movesTowardHigherIndex
    ? stations[Math.min(stations.length - 1, stationIndex + 1)]
    : stations[Math.max(0, stationIndex - 1)];

  let pos: { x: number; y: number };

  switch (train.trainSttus) {
    case "0": // 진입: behind→current 75%
      pos = interpolate(behind, current, 0.75);
      break;
    case "1": // 도착: 현재역
      pos = { x: current.x, y: current.y };
      break;
    case "2": // 출발: current→ahead 25%
      pos = interpolate(current, ahead, 0.25);
      break;
    case "3": // 전역출발: behind→current 50%
      pos = interpolate(behind, current, 0.5);
      break;
    default:
      pos = { x: current.x, y: current.y };
  }

  // 진행 방향 (behind → ahead)
  const segDx = ahead.x - behind.x;
  const segDy = ahead.y - behind.y;
  const heading = Math.atan2(segDy, segDx) * (180 / Math.PI);

  // 상행/하행 수직 오프셋
  const isUp = train.updnLine === "0";
  const { px, py } = getUpwardPerpendicular(segDx, segDy);

  let offsetX: number;
  let offsetY: number;

  if (isLine2) {
    // 순환선: 중심점 기준 바깥쪽(상행)/안쪽(하행)
    const cx = stations.reduce((s, st) => s + st.x, 0) / stations.length;
    const cy = stations.reduce((s, st) => s + st.y, 0) / stations.length;
    const toCenterX = cx - pos.x;
    const toCenterY = cy - pos.y;
    // 수직 벡터가 중심을 향하면 inward, 반대면 outward
    const dot = px * toCenterX + py * toCenterY;
    const outwardSign = dot > 0 ? -1 : 1; // 중심 반대 = 바깥
    // 상행=바깥(outward), 하행=안쪽(inward)
    const sign = isUp ? outwardSign : -outwardSign;
    offsetX = px * OFFSET * sign;
    offsetY = py * OFFSET * sign;
  } else {
    // 직선 노선: 위쪽(상행)/아래쪽(하행)
    const sign = isUp ? 1 : -1;
    offsetX = px * OFFSET * sign;
    offsetY = py * OFFSET * sign;
  }

  return {
    trainNo: train.trainNo,
    x: pos.x,
    y: pos.y,
    direction: isUp ? "up" : "down",
    heading,
    offsetX,
    offsetY,
    isExpress: train.directAt === "1",
    isLast: train.lstcarAt === "1",
    status: train.trainSttus,
    stationName: train.statnNm,
    destinationName: train.statnTnm,
  };
};
