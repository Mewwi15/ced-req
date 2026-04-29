"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { useAuth } from "@/lib/AuthContext";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  Loader2,
  Inbox,
  HelpCircle,
  Download,
  Phone,
} from "lucide-react";

// ─── 🎨 Helper: ป้ายสถานะสำหรับรายการล่าสุด ───
const getStatusBadge = (status) => {
  switch (status) {
    case "รอดำเนินการ":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
          <Clock size={12} /> รอดำเนินการ
        </span>
      );
    case "กำลังตรวจสอบ":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
          <Loader2 size={12} className="animate-spin" /> กำลังตรวจสอบ
        </span>
      );
    case "อนุมัติแล้ว":
    case "เสร็จสิ้น":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
          <CheckCircle2 size={12} /> อนุมัติแล้ว
        </span>
      );
    case "ถูกปฏิเสธ":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-50 text-red-600 border border-red-200">
          <XCircle size={12} /> ถูกปฏิเสธ
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
          {status}
        </span>
      );
  }
};

export default function DashboardOverviewPage() {
  const { user, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [recentRequests, setRecentRequests] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, "requests"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
        );

        const querySnapshot = await getDocs(q);
        const allData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        let pending = 0;
        let approved = 0;
        let rejected = 0;

        allData.forEach((req) => {
          if (req.status === "รอดำเนินการ" || req.status === "กำลังตรวจสอบ")
            pending++;
          else if (req.status === "อนุมัติแล้ว" || req.status === "เสร็จสิ้น")
            approved++;
          else if (req.status === "ถูกปฏิเสธ") rejected++;
        });

        setStats({
          total: allData.length,
          pending,
          approved,
          rejected,
        });

        setRecentRequests(allData.slice(0, 3));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-6xl mx-auto w-full flex-1 flex flex-col gap-8">
      {/* ─── 🌟 Header แบบคลีนๆ ─── */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-1">
          สวัสดี, {userProfile?.firstNameTH || "นักศึกษา"} 👋
        </h1>
        <p className="text-slate-500 font-medium">
          ระบบจัดการคำร้องออนไลน์ ภาควิชาคอมพิวเตอร์ศึกษา (CED)
        </p>
      </div>

      {/* ─── 📊 Quick Stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm animate-in zoom-in-95 duration-500 delay-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText size={20} strokeWidth={2.5} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              ทั้งหมด
            </p>
          </div>
          <h3 className="text-3xl font-black text-slate-800">{stats.total}</h3>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm animate-in zoom-in-95 duration-500 delay-150">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={20} strokeWidth={2.5} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              รอประมวลผล
            </p>
          </div>
          <h3 className="text-3xl font-black text-slate-800">
            {stats.pending}
          </h3>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm animate-in zoom-in-95 duration-500 delay-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} strokeWidth={2.5} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              อนุมัติแล้ว
            </p>
          </div>
          <h3 className="text-3xl font-black text-slate-800">
            {stats.approved}
          </h3>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm animate-in zoom-in-95 duration-500 delay-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle size={20} strokeWidth={2.5} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              ถูกปฏิเสธ
            </p>
          </div>
          <h3 className="text-3xl font-black text-slate-800">
            {stats.rejected}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── 🚀 Action: สร้างคำร้อง ─── */}
        <div className="lg:col-span-2 animate-in slide-in-from-left-8 duration-700">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 sm:p-10 relative overflow-hidden shadow-lg h-full flex flex-col justify-center group">
            <div className="absolute -right-4 -top-4 p-8 opacity-10 pointer-events-none transform group-hover:scale-110 transition-transform duration-700">
              <FileText size={180} strokeWidth={1} />
            </div>

            <div className="relative z-10 space-y-6">
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-black bg-white/20 text-white backdrop-blur-md mb-4 uppercase tracking-wider">
                  คำร้องขอความอนุเคราะห์
                </span>
                <h3 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                  สร้างคำร้องใหม่
                </h3>
                <p className="text-emerald-50 mt-2 font-medium max-w-sm">
                  ยื่นเอกสารรวดเร็ว ระบบจัดหน้าอัตโนมัติ
                </p>
              </div>

              <Link
                href="dashboard/request/new"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-emerald-700 rounded-xl font-black hover:bg-emerald-50 transition-all shadow-md active:scale-95 w-max"
              >
                <Plus size={20} strokeWidth={3} /> เริ่มต้นเลย
              </Link>
            </div>
          </div>
        </div>

        {/* ─── 🕒 ประวัติล่าสุด ─── */}
        <div className="animate-in slide-in-from-right-8 duration-700 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-800">รายการล่าสุด</h2>
            <Link
              href="dashboard/history"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              ดูทั้งหมด <ArrowRight size={14} />
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[250px]">
            {recentRequests.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <Inbox size={32} className="text-slate-200 mb-3" />
                <p className="text-slate-500 font-bold text-sm">
                  ยังไม่มีรายการ
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 flex-1 p-2">
                {recentRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 hover:bg-slate-50 rounded-2xl transition-colors"
                  >
                    <div className="flex justify-between items-center mb-2">
                      {getStatusBadge(req.status)}
                      <span className="text-[10px] font-bold text-slate-400">
                        {req.createdAt
                          ? new Date(
                              req.createdAt.seconds * 1000,
                            ).toLocaleDateString("th-TH")
                          : ""}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-700 text-sm line-clamp-1">
                      {req.academicWork?.workTitle || "คำร้องขอความอนุเคราะห์"}
                    </h4>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 🆘 ศูนย์ช่วยเหลือแบบคลีนๆ ─── */}
      <div className="pt-2 animate-in slide-in-from-bottom-8 duration-700 delay-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="#"
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <HelpCircle size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                คู่มือการใช้งาน
              </h3>
              <p className="text-xs font-medium text-slate-500">
                ขั้นตอนการยื่นคำร้อง
              </p>
            </div>
          </a>

          <a
            href="#"
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:border-purple-200 hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Download size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                เอกสารดาวน์โหลด
              </h3>
              <p className="text-xs font-medium text-slate-500">
                แบบฟอร์มอื่นๆ
              </p>
            </div>
          </a>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:border-orange-200 transition-all flex items-center gap-4 cursor-default">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <Phone size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                ติดต่อภาควิชา
              </h3>
              <p className="text-xs font-medium text-slate-500">
                โทร. 02-555-2000 (3234)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
