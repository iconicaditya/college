import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import TabBarApplier from "@/components/TabBarApplier";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "National Multiple College — Affiliated to CTEVT",
  description:
    "National Multiple College (NMC) is a leading CTEVT-affiliated technical institute offering Diploma and Certificate programs in Engineering, IT, and Health Science. Admissions open for 2081/82.",
  keywords:
    "National Multiple College, NMC, CTEVT, technical college Nepal, diploma engineering, IT programs, vocational training Nepal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${manrope.variable} ${inter.variable} antialiased bg-white text-[#111827]`}
      >
        <TabBarApplier />
        {children}
      </body>
    </html>
  );
}
