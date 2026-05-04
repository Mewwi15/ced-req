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
  const { userProfile } = useAuth(); // ดึงข้อมูลจาก AuthContext ที่เราทำไว้
  const router = useRouter();

  const handleLogout = () => {
    signOut(auth).then(() => router.push("/login"));
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex font-sans">
      {/* ส่งข้อมูลลงไปให้ Sidebar */}
      <AdminSidebar
        userProfile={userProfile}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        handleLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* ─── 📱 Mobile Header (เอาไว้กดเปิด Sidebar ในมือถือ) ─── */}
        <header className="lg:hidden h-20 bg-white border-b border-slate-200 flex items-center px-6 sticky top-0 z-10">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
          >
            <Menu size={28} strokeWidth={2.5} />
          </button>
          <div className="ml-4 font-black text-slate-800 text-lg">
            Admin Panel
          </div>
        </header>

        {/* ─── เนื้อหาหลักของหน้า Admin ─── */}
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    </div>
  );
}
