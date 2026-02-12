import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "서울 지하철 실시간 위치",
  description: "서울 지하철 1~9호선 실시간 열차 위치 추적",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ko">
      <body className="bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
