import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Citta Handcho - 食品受発注DXシステム",
  description: "食品業界向け受発注デジタルトランスフォーメーションシステム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
