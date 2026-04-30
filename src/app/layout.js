import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/AuthContext"; // 📍 นำเข้า AuthProvider
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ComEdu Document System", // 📍 เปลี่ยนชื่อเว็บให้สวยงาม
  description: "ระบบจัดทำเอกสารคำร้อง ภาควิชาคอมพิวเตอร์ศึกษา",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="th"
      // 📍 ใส่ตรงนี้เพิ่มด้วยครับ
      suppressHydrationWarning={true}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        // 📍 ตรงนี้มีอยู่แล้ว ดีมากครับ
        suppressHydrationWarning={true}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
