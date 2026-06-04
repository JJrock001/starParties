import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STARPARTY — สถาปาร์ตี้",
  description: "ชมรมดนตรี คณะสถาปัตยกรรมศาสตร์และการผังเมือง มหาวิทยาลัยธรรมศาสตร์ (รังสิต)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
