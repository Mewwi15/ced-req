"use client";
import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }) {
  const { userProfile } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    // 🌟 1. เปลี่ยน min-h-screen เป็น h-screen และเพิ่ม overflow-hidden เพื่อห้ามหน้าจอหลักเลื่อน
    <div className="h-screen bg-[#F4F7F9] flex overflow-hidden font-sans">
      <Sidebar
        userProfile={userProfile}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        handleLogout={handleLogout}
      />

      {/* 🌟 2. เปลี่ยนแท็กครอบด้านขวา ให้เป็นแค่ div ที่เรียง Navbar กับ Main จากบนลงล่าง */}
      <div className="flex-1 flex flex-col w-full overflow-hidden">
        {/* Navbar จะถูกตรึงอยู่ด้านบนสุดของฝั่งขวาเสมอ */}
        <Navbar setIsSidebarOpen={setIsSidebarOpen} />

        {/* 🌟 3. พระเอกของเรา: ย้าย children มาไว้ใน main ที่มี flex-1 และ overflow-y-auto 
                ทำให้เฉพาะพื้นที่ตรงนี้เท่านั้นที่เลื่อนขึ้นลงได้ */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}
