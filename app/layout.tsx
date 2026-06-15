import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "코어 키퍼 요리 도감",
  description: "재료1 + 재료2 = 완성 요리 · 효과 · 획득처",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <footer className="site-foot">
          비공식 팬 도구 · 데이터 및 아이콘 출처:{" "}
          <a href="https://core-keeper.fandom.com" target="_blank" rel="noopener noreferrer">Core Keeper Wiki</a>
          {" "}· Core Keeper © Pugstorm / Fireshine Games. 게임사와 무관합니다.
        </footer>
      </body>
    </html>
  );
}
