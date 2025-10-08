import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ACTIVITY DW Club - Objavte Úžasné Trasy",
  description: "ACTIVITY DW Club - Nájdite najlepšie bežecké, cyklistické a turistické trasy vo vašom okolí",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
