/* eslint-disable @next/next/no-img-element */
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Settings, LogOut, X } from "lucide-react";

export default function AdminSidebar({
  userProfile,
  isSidebarOpen,
  setIsSidebarOpen,
  handleLogout,
}) {
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

  return (
    <>
      {/* ─── 📱 Mobile Overlay ─── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* ─── 🗂️ Sidebar Content ─── */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* ─── 🌟 โลโก้ภาควิชา ─── */}
        <div className="h-28 flex items-center justify-center px-6 border-b border-slate-100 relative bg-slate-50/50">
          <img
            src="https://ced.kmutnb.ac.th/image/banner/28997822520250908_111639.png"
            alt="ComEdu KMUTNB Logo"
            className="h-16 w-auto object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300"
          />

          {/* ปุ่มปิดสำหรับมือถือ */}
          <button
            className="absolute top-4 right-4 lg:hidden p-2 text-slate-400 hover:text-slate-700 bg-white rounded-full shadow-sm border border-slate-100"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
          {/* 📍 เมนูของ Admin */}
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all border ${
              isActive("/admin")
                ? "bg-emerald-50 text-emerald-700 shadow-sm border-emerald-100/50"
                : "text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium"
            }`}
          >
            <LayoutDashboard size={20} />
            จัดการคำร้อง
          </Link>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 shadow-sm rounded-2xl mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 text-white flex items-center justify-center font-black shadow-sm shrink-0 text-lg">
              {userProfile?.firstNameTH?.charAt(0) || "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">
                {userProfile?.firstNameTH} {userProfile?.lastNameTH}
              </p>
              {/* 📍 เปลี่ยนตรงนี้ให้เข้ากับ Admin */}
              <p className="text-xs text-emerald-600 font-bold truncate mt-0.5">
                ผู้ดูแลระบบ (Admin)
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl font-bold transition-all border border-transparent hover:border-red-100"
          >
            <LogOut size={18} strokeWidth={2.5} />
            ออกจากระบบ
          </button>
        </div>
      </aside>
    </>
  );
}
