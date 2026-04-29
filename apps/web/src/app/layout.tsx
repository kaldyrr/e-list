import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "E-List",
  description: "Каталог товаров, сравнение характеристик и цен.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
