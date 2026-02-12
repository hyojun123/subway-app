# Implementation Plan - Seoul Subway Realtime Tracker

## Phase 1: 프로젝트 초기 설정

### Task 1.1: Next.js 프로젝트 생성
- `npx create-next-app@latest` 실행
  - App Router, TypeScript, Tailwind CSS, ESLint 선택
  - `src/` 디렉토리 사용
- `.env.local` 파일 생성하여 `SUBWAY_API_KEY` 설정
- `.gitignore`에 `.env.local` 포함 확인

### Task 1.2: 패키지 설치
- `swr` 설치 (데이터 폴링용)

### Task 1.3: 기본 디렉토리 구조 생성
```
src/
  components/
  data/stations/
  lib/
```

**검증**: `npm run dev`로 기본 Next.js 앱 실행 확인

---

## Phase 2: TypeScript 타입 & 상수 정의

### Task 2.1: API 응답 타입 정의 (`src/lib/types.ts`)
```typescript
interface SubwayAPIResponse {
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

interface TrainPosition {
  subwayId: string;      // 노선 ID (1001~1009)
  subwayNm: string;      // 노선명
  statnId: string;       // 역 ID
  statnNm: string;       // 역명
  trainNo: string;       // 열차번호
  lastRecptnDt: string;  // 최종수신날짜
  recptnDt: string;      // 최종수신시간
  updnLine: string;      // 상하행 (0:상행/내선, 1:하행/외선)
  statnTid: string;      // 종착역 ID
  statnTnm: string;      // 종착역명
  trainSttus: string;    // 상태 (0:진입, 1:도착, 2:출발, 3:전역출발)
  directAt: string;      // 급행 (0:일반, 1:급행)
  lstcarAt: string;      // 막차 (0:아님, 1:막차)
}
```

### Task 2.2: 상수 정의 (`src/lib/constants.ts`)
- 호선 목록 (1~9호선)
- 호선별 색상 코드
- 호선별 subwayId 매핑
- API 기본 URL
- 폴링 간격 (15000ms)

**검증**: TypeScript 컴파일 에러 없음

---

## Phase 3: API 연동

### Task 3.1: API Route 생성 (`src/app/api/subway/route.ts`)
- GET 핸들러: query parameter `line`으로 호선명 수신
- 환경변수에서 API 키 읽기
- 서울 공공데이터 API 호출
- 응답 파싱 및 에러 처리
- RESULT.CODE 확인 (INFO-000 = 성공)

### Task 3.2: API 클라이언트 유틸 (`src/lib/api.ts`)
- `fetchTrainPositions(line: string)` 함수
- SWR과 함께 사용할 fetcher 함수

**검증**: `/api/subway?line=2호선` 호출하여 실제 데이터 수신 확인

---

## Phase 4: 역 좌표 데이터 생성

### Task 4.1: 2호선 역 좌표 데이터 (프로토타입용)
- `src/data/stations/line2.json` 생성
- 2호선 순환선 + 지선 역 좌표 (schematic 스타일)
- SVG viewBox 기준 좌표 (0,0 ~ 800,600)
- 각 역: `{ name, x, y }` + 이전역/다음역 연결 정보

### Task 4.2: 나머지 호선 역 좌표 데이터
- `line1.json` ~ `line9.json` 각각 생성
- 환승역은 동일한 좌표 공유하도록 정렬
- 각 호선별 역 순서와 좌표

**검증**: JSON 파일들이 올바른 형식인지 확인

---

## Phase 5: SVG 노선도 컴포넌트

### Task 5.1: SubwayMap 컴포넌트 (`src/components/SubwayMap.tsx`)
- SVG viewBox 설정 (반응형)
- 선택된 호선의 역 좌표 데이터 로드
- 역 사이를 선으로 연결 (호선 색상)
- 역 이름 라벨 표시
- 핀치 줌/팬 지원

### Task 5.2: 역 노드 렌더링
- 각 역을 원(circle)으로 표시
- 역명을 텍스트로 표시 (가독성 위해 회전 또는 위치 조정)
- 환승역은 크게 또는 이중 원으로 표시

**검증**: 2호선 노선도가 SVG로 정상 렌더링

---

## Phase 6: 열차 마커 & 툴팁

### Task 6.1: TrainMarker 컴포넌트 (`src/components/TrainMarker.tsx`)
- trainSttus에 따른 좌표 계산 로직
  - 0(진입): 이전역→현재역 75%
  - 1(도착): 현재역 좌표
  - 2(출발): 현재역→다음역 25%
  - 3(전역출발): 이전역→현재역 50%
- 상행/하행 방향 화살표
- 급행 표시 (빨간 테두리)
- 막차 표시 (깜빡임 애니메이션)
- CSS transition으로 위치 이동 애니메이션

### Task 6.2: TrainTooltip 컴포넌트 (`src/components/TrainTooltip.tsx`)
- 열차 터치/클릭 시 표시
- 내용: 열차번호, 종착역, 상태, 급행여부, 막차여부
- 화면 밖으로 나가지 않도록 위치 조정
- 바깥 터치 시 닫기

**검증**: 실시간 데이터와 연동하여 열차가 노선도 위에 표시됨

---

## Phase 7: 메인 페이지 조립

### Task 7.1: LineSelector 컴포넌트 (`src/components/LineSelector.tsx`)
- 1~9호선 드롭다운 선택
- 호선별 색상 표시
- 기본값: 2호선

### Task 7.2: 메인 페이지 (`src/app/page.tsx`)
- LineSelector + SubwayMap 조합
- SWR로 15초 폴링 설정
- 로딩 상태 표시
- 에러 상태 표시
- 마지막 업데이트 시간 표시

### Task 7.3: 레이아웃 & 스타일링
- `layout.tsx`: 메타데이터, 폰트 설정
- 전체 화면 사용 (모바일 WebView 대응)
- 다크모드 배경 (지하철 노선도 가독성)
- Safe area padding

**검증**: 전체 앱이 동작하며 호선 변경 시 노선도와 열차 위치가 업데이트됨

---

## Phase 8: 모바일 WebView 최적화

### Task 8.1: 터치 최적화
- 탭으로 툴팁 열기/닫기
- 핀치 줌 제스처
- 드래그로 팬

### Task 8.2: 성능 최적화
- SVG 요소 최소화
- 불필요한 리렌더링 방지 (React.memo)
- 열차 마커만 업데이트 (노선도는 고정)

**검증**: 모바일 브라우저에서 부드러운 동작 확인

---

## 구현 순서 요약

| Phase | 내용 | 의존성 |
|-------|------|--------|
| 1 | 프로젝트 초기 설정 | 없음 |
| 2 | 타입 & 상수 | Phase 1 |
| 3 | API 연동 | Phase 2 |
| 4 | 역 좌표 데이터 | Phase 1 |
| 5 | SVG 노선도 | Phase 4 |
| 6 | 열차 마커 & 툴팁 | Phase 3, 5 |
| 7 | 메인 페이지 조립 | Phase 6 |
| 8 | WebView 최적화 | Phase 7 |

Phase 3과 Phase 4-5는 병렬 진행 가능.
