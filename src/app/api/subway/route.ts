import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const line = searchParams.get("line");

  if (!line) {
    return NextResponse.json(
      { error: "line parameter is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.SUBWAY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key is not configured" },
      { status: 500 }
    );
  }

  const url = `http://swopenapi.seoul.go.kr/api/subway/${apiKey}/json/realtimePosition/0/100/${encodeURIComponent(line)}`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    const data = await response.json();

    if (data.status === 500 || data.code === "INFO-200") {
      return NextResponse.json(
        { error: "해당 호선의 데이터가 없습니다", realtimePositionList: [] },
        { status: 200 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "데이터를 불러올 수 없습니다" },
      { status: 502 }
    );
  }
};
