import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { WalletProvider } from "@/providers/WalletProvider";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "../components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Colosseum",
  description: "on chain metaverse",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={geistSans.className}>
        <WalletProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <><Navbar/>{children}<Footer/></>
          </ThemeProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
