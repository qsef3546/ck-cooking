import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "코어 키퍼 요리 도감",
  description: "재료1 + 재료2 = 완성 요리 · 효과 · 획득처",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
