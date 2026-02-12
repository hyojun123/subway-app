# Seoul Subway Realtime Position Tracker - Design Document

## Overview

서울 지하철 실시간 위치 추적 웹앱. 서울 열린데이터 광장 API를 통해 열차 위치 데이터를 받아 SVG 노선도 위에 표시한다. Next.js 기반이며 모바일 앱의 WebView에서 사용할 예정.

## Key Decisions

| 항목 | 결정 |
|------|------|
| 표시 범위 | 호선별 선택 보기 (드롭다운) |
| 시각화 | SVG 기반 노선도 |
| 갱신 주기 | 15초 |
| 열차 상세 | 툴팁/팝업 |
| 호선 범위 | 1~9호선 (주요 호선) |

## Architecture

### Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** for styling
- **SWR** for data fetching & polling
- **SVG** for subway map rendering

### Data Flow

```
User selects line (dropdown)
  → Client: SWR polls /api/subway?line=2호선 every 15s
  → Server: Next.js API Route calls Seoul Open Data API (key protected)
  → Server: Parses response, normalizes data
  → Client: SubwayMap renders train positions on SVG
  → Client: TrainMarker animates position with CSS transitions
  → Client: Tooltip shows on touch/hover
```

### Project Structure

```
src/
  app/
    page.tsx                  — Main page
    layout.tsx                — Root layout
    api/subway/route.ts       — API proxy (protects API key)
  components/
    SubwayMap.tsx             — SVG map container
    TrainMarker.tsx           — Train icon + animation
    TrainTooltip.tsx          — Train info tooltip
    LineSelector.tsx          — Line selection dropdown
  data/
    stations/                 — Per-line station coordinate JSON files
      line1.json
      line2.json
      ...
      line9.json
  lib/
    api.ts                    — API call utilities
    types.ts                  — TypeScript type definitions
    constants.ts              — Line colors, names, IDs
```

## SVG Map Design

Each line has its own SVG coordinate data stored in JSON. Coordinates are schematic (not geographic), using straight lines and 45-degree angles.

### Train Position Mapping

| trainSttus | Meaning | Position |
|------------|---------|----------|
| 0 (진입) | Approaching station | 75% between prev and current station |
| 1 (도착) | Arrived at station | Exactly at station coordinates |
| 2 (출발) | Departed station | 25% between current and next station |
| 3 (전역출발) | Departed previous station | 50% between prev and current station |

### Train Icons

- Direction indicated by arrow (updnLine: 0=상행/내선, 1=하행/외선)
- Express trains (directAt: 1): red border
- Last trains (lstcarAt: 1): blinking animation

### Tooltip Content

- 열차번호 (trainNo)
- 종착역 (statnTnm)
- 현재상태 (trainSttus → 진입/도착/출발/전역출발)
- 급행여부 (directAt)
- 막차여부 (lstcarAt)

## API Details

### Endpoint

```
GET http://swopenapi.seoul.go.kr/api/subway/{API_KEY}/json/realtimePosition/0/100/{호선명}
```

### Line IDs

| subwayId | 호선명 |
|----------|--------|
| 1001 | 1호선 |
| 1002 | 2호선 |
| 1003 | 3호선 |
| 1004 | 4호선 |
| 1005 | 5호선 |
| 1006 | 6호선 |
| 1007 | 7호선 |
| 1008 | 8호선 |
| 1009 | 9호선 |

### Error Handling

- API error → Show "데이터를 불러올 수 없습니다" banner, keep last successful data
- Network error → SWR auto-retry, show offline indicator
- Off-hours → Show "현재 운행 시간이 아닙니다" message

## WebView Considerations

- Mobile-optimized viewport meta
- Touch events (tap for tooltip instead of hover)
- Pinch zoom/pan via SVG viewBox
- Safe area insets for notch/home indicator
