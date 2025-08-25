import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PrivyAuthProvider } from "@/providers/PrivyProvider";
import { PortfolioProvider } from "@/providers/PortfolioProvider";
import ThemeRegistry from "@/providers/ThemeRegistery";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jarvis",
  description: "Onchain financial advisor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ThemeRegistry>
          <PrivyAuthProvider>
            <PortfolioProvider>{children}</PortfolioProvider>
          </PrivyAuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
