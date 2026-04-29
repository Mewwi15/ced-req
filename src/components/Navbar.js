"use client";
import { Menu } from "lucide-react";

export default function Navbar({ setIsSidebarOpen }) {
  // ฟังก์ชันแสดงวันที่ภาษาไทย
  const currentDate = new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 lg:px-10 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden text-slate-500 hover:text-slate-800 p-2 bg-slate-50 rounded-lg transition-colors"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            ภาพรวมระบบ
          </h1>
        </div>
      </div>
      <div className="hidden sm:block text-sm font-medium text-slate-500 bg-slate-100 px-4 py-2 rounded-full">
        {currentDate}
      </div>
    </header>
  );
}
