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
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  ChevronDown,
  Calendar,
  CalendarDays,
} from "lucide-react";

import RequestModal from "@/components/admin/RequestModal";
import { getStatusBadge } from "@/utils/statusHelpers";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // 📍 1. State สำหรับค้นหาและโหมดการดู
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // "daily" = ดูรายวัน, "monthly" = ดูทั้งเดือน
  const [viewMode, setViewMode] = useState("daily");

  // วันที่ปัจจุบัน (YYYY-MM-DD)
  const [dateFilter, setDateFilter] = useState(() => {
    const tzoffset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzoffset).toISOString().slice(0, 10);
  });

  // เดือนปัจจุบัน (YYYY-MM)
  const [monthFilter, setMonthFilter] = useState(() => {
    const tzoffset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzoffset).toISOString().slice(0, 7);
  });

  // ─── ฟังก์ชันดึงข้อมูลจาก Firebase ตามโหมดที่เลือก ───
  useEffect(() => {
    setIsLoading(true);
    const reqRef = collection(db, "requests");
    let q;

    if (viewMode === "daily" && dateFilter) {
      // โหมดรายวัน: ดึงตั้งแต่ 00:00:00 ถึง 23:59:59 ของวันนั้น
      const startOfDay = new Date(`${dateFilter}T00:00:00`);
      const endOfDay = new Date(`${dateFilter}T23:59:59.999`);
      q = query(
        reqRef,
        where("createdAt", ">=", startOfDay),
        where("createdAt", "<=", endOfDay),
        orderBy("createdAt", "desc"),
      );
    } else if (viewMode === "monthly" && monthFilter) {
      // โหมดรายเดือน: ดึงตั้งแต่วันที่ 1 ถึงวันสุดท้ายของเดือนนั้น
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

  // 📍 2. คำนวณสถิติจากการดึงข้อมูลจริง (เปลี่ยนตามวันที่/เดือนที่เลือก)
  const stats = {
    total: requests.length,
    pending: requests.filter(
      (r) => r.status === "รอดำเนินการ" || r.status === "กำลังตรวจสอบ",
    ).length,
    approved: requests.filter((r) => r.status === "อนุมัติแล้ว").length,
    rejected: requests.filter((r) => r.status === "ถูกปฏิเสธ").length,
  };

  // 📍 3. กรองข้อมูลตารางด้วยช่อง Search และ Status
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
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <>
      <header className="h-20 bg-white border-b border-slate-200 flex items-center px-8 sm:px-10 sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          ภาพรวมคำร้อง
        </h1>
      </header>

      <div className="p-6 sm:p-10 flex-1 space-y-8 overflow-x-hidden">
        {/* ─── 📊 การ์ดสรุปข้อมูล (คลีนๆ 4 ใบ เปลี่ยนไปตามช่วงเวลา) ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">
                ทั้งหมด ({viewMode === "daily" ? "วัน" : "เดือน"}นี้)
              </p>
              <h3 className="text-2xl font-black text-slate-800">
                {stats.total}
              </h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">รอดำเนินการ</p>
              <h3 className="text-2xl font-black text-slate-800">
                {stats.pending}
              </h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">อนุมัติแล้ว</p>
              <h3 className="text-2xl font-black text-slate-800">
                {stats.approved}
              </h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <XCircle size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">ปฏิเสธ</p>
              <h3 className="text-2xl font-black text-slate-800">
                {stats.rejected}
              </h3>
            </div>
          </div>
        </div>

        {/* ─── 🔍 แถบเครื่องมือค้นหาและตัวกรองช่วงเวลา ─── */}
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative w-full xl:w-96">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, รหัส, หรืองานวิจัย..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm text-slate-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            {/* 🌟 ปุ่มสลับโหมด ดูรายวัน / ดูรายเดือน */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setViewMode("daily")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  viewMode === "daily"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Calendar size={16} /> รายวัน
              </button>
              <button
                onClick={() => setViewMode("monthly")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  viewMode === "monthly"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <CalendarDays size={16} /> เดือน/ปี
              </button>
            </div>

            {/* 🌟 Input วันที่ หรือ เดือน/ปี (โชว์ตามโหมดที่เลือก) */}
            <div className="relative w-full sm:w-auto group">
              {viewMode === "daily" ? (
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full sm:w-auto px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer shadow-sm hover:border-slate-300"
                />
              ) : (
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="w-full sm:w-auto px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer shadow-sm hover:border-slate-300"
                />
              )}
            </div>

            <div className="w-px h-8 bg-slate-200 hidden sm:block mx-1"></div>

            {/* 🌟 ตัวกรองสถานะ */}
            <div className="relative group w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer shadow-sm hover:border-slate-300"
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

        {/* ─── 📋 ตารางข้อมูล ─── */}
        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest w-32">
                    วันที่
                  </th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                    ผู้ยื่นคำร้อง
                  </th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                    เรื่อง
                  </th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest w-40">
                    สถานะ
                  </th>
                  <th className="px-6 py-5 text-center text-xs font-black text-slate-400 uppercase tracking-widest w-32">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">
                        {req.createdAt
                          ? new Date(
                              req.createdAt.seconds * 1000,
                            ).toLocaleDateString("th-TH", {
                              year: "2-digit",
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-800">
                          {req.studentInfo?.prefix}
                          {req.studentInfo?.fullName}
                        </p>
                        <p className="text-[11px] text-slate-500 uppercase font-bold">
                          {req.studentInfo?.studentId}
                        </p>
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-bold text-slate-700 truncate max-w-[250px]"
                        title={req.academicWork?.workTitle}
                      >
                        {req.academicWork?.workTitle || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold text-sm group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-md transition-all flex items-center justify-center gap-2 mx-auto w-full"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-slate-400 font-medium bg-slate-50/50"
                    >
                      ไม่พบข้อมูลคำร้องในช่วงเวลาที่เลือก
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
