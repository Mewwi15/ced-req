/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
} from "firebase/firestore";
import {
  Loader2,
  Eye,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  ChevronDown,
  Calendar,
  CalendarDays,
  Inbox,
  UserCircle2,
  Hash,
} from "lucide-react";

import RequestModal from "@/components/admin/RequestModal";

// ─── 🎨 Helper: ป้ายสถานะแบบ Dot (แบบเดียวกับฝั่ง User) ───
const getStatusBadge = (status) => {
  switch (status) {
    case "รอดำเนินการ":
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-600 rounded-full border border-amber-500/20 w-max">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          <span className="text-[11px] font-bold tracking-wide">
            รอดำเนินการ
          </span>
        </div>
      );
    case "กำลังตรวจสอบ":
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-600 rounded-full border border-blue-500/20 w-max">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="text-[11px] font-bold tracking-wide">
            กำลังตรวจสอบ
          </span>
        </div>
      );
    case "อนุมัติแล้ว":
    case "เสร็จสิ้น":
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-500/20 w-max">
          <CheckCircle2 size={12} strokeWidth={3} />
          <span className="text-[11px] font-bold tracking-wide">
            อนุมัติแล้ว
          </span>
        </div>
      );
    case "ถูกปฏิเสธ":
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 text-rose-600 rounded-full border border-rose-500/20 w-max">
          <XCircle size={12} strokeWidth={3} />
          <span className="text-[11px] font-bold tracking-wide">ถูกปฏิเสธ</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-500/10 text-slate-600 rounded-full border border-slate-500/20 w-max">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          <span className="text-[11px] font-bold tracking-wide">{status}</span>
        </div>
      );
  }
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("daily");

  const [dateFilter, setDateFilter] = useState(() => {
    const tzoffset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzoffset).toISOString().slice(0, 10);
  });

  const [monthFilter, setMonthFilter] = useState(() => {
    const tzoffset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzoffset).toISOString().slice(0, 7);
  });

  useEffect(() => {
    setIsLoading(true);
    const reqRef = collection(db, "requests");
    let q;

    if (viewMode === "daily" && dateFilter) {
      const startOfDay = new Date(`${dateFilter}T00:00:00`);
      const endOfDay = new Date(`${dateFilter}T23:59:59.999`);
      q = query(
        reqRef,
        where("createdAt", ">=", startOfDay),
        where("createdAt", "<=", endOfDay),
        orderBy("createdAt", "desc"),
      );
    } else if (viewMode === "monthly" && monthFilter) {
      const [year, month] = monthFilter.split("-");
      const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      q = query(
        reqRef,
        where("createdAt", ">=", startOfMonth),
        where("createdAt", "<=", endOfMonth),
        orderBy("createdAt", "desc"),
      );
    }

    const unsubscribeData = onSnapshot(q, (querySnapshot) => {
      setRequests(
        querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
      setIsLoading(false);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
    });

    return () => {
      unsubscribeData();
      unsubscribeAuth();
    };
  }, [viewMode, dateFilter, monthFilter, router]);

  const stats = {
    total: requests.length,
    pending: requests.filter(
      (r) => r.status === "รอดำเนินการ" || r.status === "กำลังตรวจสอบ",
    ).length,
    approved: requests.filter((r) => r.status === "อนุมัติแล้ว").length,
    rejected: requests.filter((r) => r.status === "ถูกปฏิเสธ").length,
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.studentInfo?.fullName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      req.studentInfo?.studentId?.includes(searchTerm) ||
      req.academicWork?.workTitle
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading && requests.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="relative flex justify-center items-center">
          <div className="absolute animate-ping w-16 h-16 rounded-full bg-emerald-400/20"></div>
          <div className="w-8 h-8 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-[1400px] mx-auto w-full flex-1 flex flex-col gap-6 lg:gap-8 pb-28 lg:pb-12 p-4 sm:p-6 lg:p-8">
        {/* ─── 🌟 Header ─── */}
        <div className="flex flex-col gap-2 animate-in fade-in duration-500">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold tracking-widest uppercase w-max">
            <FileText size={14} /> Admin Workspace
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
            ระบบจัดการคำร้อง
          </h1>
          <p className="text-slate-500 font-medium">
            ภาพรวมการดำเนินการและจัดการเอกสารของนักศึกษา
          </p>
        </div>

        {/* ─── 📊 การ์ดสรุปข้อมูล (Bento Grid) ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in duration-500 delay-100">
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-start gap-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-4xl font-black text-slate-800 mb-1">
                {stats.total}
              </h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                ทั้งหมด ({viewMode === "daily" ? "วัน" : "เดือน"}นี้)
              </p>
            </div>
          </div>
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-start gap-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-4xl font-black text-slate-800 mb-1">
                {stats.pending}
              </h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                รอดำเนินการ
              </p>
            </div>
          </div>
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-start gap-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-4xl font-black text-slate-800 mb-1">
                {stats.approved}
              </h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                อนุมัติแล้ว
              </p>
            </div>
          </div>
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-start gap-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-4xl font-black text-slate-800 mb-1">
                {stats.rejected}
              </h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                ถูกปฏิเสธ
              </p>
            </div>
          </div>
        </div>

        {/* ─── 🔍 Toolbar: Search & Filters ─── */}
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-center animate-in slide-in-from-bottom-8 duration-700 delay-200">
          <div className="relative w-full xl:w-[400px]">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, รหัส, หรืองานวิจัย..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-[1rem] font-bold text-sm text-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            {/* โหมด วัน/เดือน */}
            <div className="flex bg-slate-100/80 p-1.5 rounded-[1rem] w-full sm:w-auto">
              <button
                onClick={() => setViewMode("daily")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition-all ${
                  viewMode === "daily"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Calendar size={16} /> รายวัน
              </button>
              <button
                onClick={() => setViewMode("monthly")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition-all ${
                  viewMode === "monthly"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <CalendarDays size={16} /> เดือน/ปี
              </button>
            </div>

            {/* Input วันที่ */}
            <div className="relative w-full sm:w-auto">
              {viewMode === "daily" ? (
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full sm:w-auto px-4 py-3 bg-white border border-slate-200 rounded-[1rem] font-bold text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer shadow-sm"
                />
              ) : (
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="w-full sm:w-auto px-4 py-3 bg-white border border-slate-200 rounded-[1rem] font-bold text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer shadow-sm"
                />
              )}
            </div>

            {/* Filter สถานะ */}
            <div className="relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-[1rem] font-bold text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer shadow-sm"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="รอดำเนินการ">รอดำเนินการ</option>
                <option value="กำลังตรวจสอบ">กำลังตรวจสอบ</option>
                <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
                <option value="ถูกปฏิเสธ">ถูกปฏิเสธ</option>
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={16}
                strokeWidth={2.5}
              />
            </div>
          </div>
        </div>

        {/* ─── 📄 Modern List View (แทนที่ Table เดิม) ─── */}
        <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-12 duration-700 delay-300">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-sm font-bold text-slate-500">
              พบ {filteredRequests.length} รายการ
            </span>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center py-20 text-center shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Inbox size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-700 font-bold text-xl mb-2">
                ไม่มีคำร้องในช่วงเวลานี้
              </p>
              <p className="text-slate-400 font-medium text-sm">
                ลองเปลี่ยนวันที่ หรือเงื่อนไขการค้นหาดูสิ
              </p>
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div
                key={req.id}
                onClick={() => setSelectedRequest(req)}
                className="group flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-5 sm:p-6 rounded-[1.5rem] bg-white border border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-300 cursor-pointer"
              >
                {/* ข้อมูลซ้าย (ชื่อคนยื่น + รายละเอียด) */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors border border-slate-50 font-black text-xl">
                    {req.studentInfo?.firstNameTH?.charAt(0) || "U"}
                  </div>
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                        {req.studentInfo?.prefix}
                        {req.studentInfo?.fullName}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider rounded-md font-mono">
                        {req.studentInfo?.studentId}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-500 text-sm leading-snug line-clamp-1">
                      {req.academicWork?.workTitle || "คำร้องขอความอนุเคราะห์"}
                    </h4>
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-400 pt-1">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {req.createdAt
                          ? new Date(
                              req.createdAt.seconds * 1000,
                            ).toLocaleDateString("th-TH", {
                              year: "2-digit",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="flex items-center gap-1">
                        <Hash size={12} />{" "}
                        {req.id.substring(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* สถานะ & ปุ่ม (ขวา) */}
                <div className="flex items-center justify-between lg:justify-end w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-50 gap-6 shrink-0 mt-2 lg:mt-0">
                  {getStatusBadge(req.status)}
                  <button className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-50 text-slate-600 font-bold text-sm group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm w-full sm:w-auto">
                    <Eye size={16} />{" "}
                    <span className="sm:hidden lg:inline">ตรวจสอบ</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedRequest && (
        <RequestModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          setRequests={setRequests}
        />
      )}
    </>
  );
}
