# Seoul Subway Realtime Tracker

## Project Overview

서울 지하철 실시간 위치 추적 웹앱. 서울 열린데이터 광장 공공데이터 API를 사용하여 1~9호선 열차의 실시간 위치를 SVG 노선도 위에 표시한다.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Data Fetching**: SWR (15초 폴링)
- **Rendering**: SVG (노선도 + 열차 위치)

## Project Structure

```
src/
  app/
    page.tsx                  — 메인 페이지
    layout.tsx                — 루트 레이아웃
    api/subway/route.ts       — API 프록시
  components/                 — React 컴포넌트
  data/stations/              — 호선별 역 좌표 JSON
  lib/                        — 유틸리티, 타입, 상수
```

## API

- **Endpoint**: `http://swopenapi.seoul.go.kr/api/subway/{KEY}/json/realtimePosition/0/100/{호선명}`
- **API Key**: 환경변수 `SUBWAY_API_KEY`에 저장 (절대 클라이언트에 노출 금지)
- **Proxy**: `/api/subway` API Route를 통해 서버 사이드에서만 호출

## Development Guidelines

### Code Style
- TypeScript strict mode 사용
- 컴포넌트는 함수형 + arrow function
- 파일명은 PascalCase (컴포넌트), camelCase (유틸리티)
- 한국어 주석 사용 가능, 코드는 영문

### Key Patterns
- 서버 컴포넌트 기본, 클라이언트 컴포넌트는 `'use client'` 명시
- API 키는 반드시 서버 사이드에서만 사용
- 에러 시 마지막 성공 데이터 유지 (SWR keepPreviousData)

### SVG 노선도
- 각 호선별 역 좌표는 `data/stations/` 디렉토리의 JSON 파일로 관리
- 좌표는 도식화된 노선도 스타일 (지리적 좌표 아닌 schematic)
- 열차 위치는 trainSttus 값에 따라 역 사이 보간

### WebView 대응
- 모바일 터치 이벤트 우선
- Safe area 대응
- 핀치 줌/팬 지원

## Commands

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
```

## Environment Variables

```
SUBWAY_API_KEY=4e67594b4f63686c3533526a72666e
```

## Design Document

상세 설계: `docs/plans/2026-02-12-subway-realtime-design.md`
