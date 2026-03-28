import { Fraunces, DM_Sans, Geist } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata = {
  title: "CareLink - AI Healthcare",
  description: "Smart GP Scheduler, Symptom Journal, and Post-Discharge Follow-Up",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${dmSans.variable} ${geist.variable} antialiased`} style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
