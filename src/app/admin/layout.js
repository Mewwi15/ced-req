"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAuth } from "@/lib/AuthContext";
import { Menu } from "lucide-react";

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { userProfile } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    signOut(auth).then(() => router.push("/login"));
  };

  return (
    // 🌟 1. ล็อกความสูงเท่าหน้าจอเป๊ะๆ (100dvh) และป้องกันไม่ให้ทะลุกรอบ (overflow-hidden)
    <div className="h-[100dvh] bg-[#F4F7F9] flex overflow-hidden font-sans w-full">
      {/* ส่งข้อมูลลงไปให้ Sidebar */}
      <AdminSidebar
        userProfile={userProfile}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        handleLogout={handleLogout}
      />

      {/* 🌟 2. ฝั่งขวา (Header มือถือ + Content) */}
      <div className="flex-1 flex flex-col w-full overflow-hidden">
        {/* ─── 📱 Mobile Header (flex-shrink-0 ป้องกันการโดนบีบ) ─── */}
        <header className="lg:hidden h-20 bg-white border-b border-slate-200 flex items-center px-6 flex-shrink-0 z-20 shadow-sm relative">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2.5 -ml-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 active:scale-95 rounded-xl transition-all"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
          <div className="ml-3 font-black text-slate-800 text-lg tracking-tight">
            Admin Workspace
          </div>
        </header>

        {/* ─── เนื้อหาหลักของหน้า Admin ─── */}
        {/* 🌟 3. พระเอกของเรา: flex-1 เติมเต็มพื้นที่ และ overflow-y-auto ให้มีแถบเลื่อนเฉพาะตรงนี้ */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
