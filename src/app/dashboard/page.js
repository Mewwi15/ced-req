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
  ArrowUpRight,
  Sparkles,
  Inbox,
  FileBadge2,
  ChevronRight,
  Check,
  HelpCircle,
} from "lucide-react";

// ─── 🎨 คอมโพเนนต์ใหม่: Visual Progress Tracker (แบบแอปสั่งอาหาร/ช้อปปิ้ง) ───
const RequestTimeline = ({ status }) => {
  const isRejected = status === "ถูกปฏิเสธ";

  let currentStep = 0;
  if (status === "รอดำเนินการ") currentStep = 1;
  else if (status === "กำลังตรวจสอบ") currentStep = 2;
  else if (status === "อนุมัติแล้ว" || status === "เสร็จสิ้น") currentStep = 3;

  const steps = [
    { id: 1, label: "ส่งเรื่อง" },
    { id: 2, label: "ตรวจสอบ" },
    { id: 3, label: "เสร็จสิ้น" },
  ];

  if (isRejected) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 rounded-full border border-rose-100">
        <XCircle size={14} className="text-rose-500" />
        <span className="text-xs font-bold text-rose-600 tracking-wide">
          ถูกปฏิเสธการอนุมัติ
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end sm:items-center gap-1.5">
      <div className="flex items-center justify-between w-32 sm:w-40 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full"></div>

        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 rounded-full transition-all duration-700"
          style={{
            width:
              currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%",
          }}
        ></div>

        {steps.map((step) => {
          const isCompleted = currentStep >= step.id;
          const isActive = currentStep === step.id;

          return (
            <div
              key={step.id}
              className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-500 ${
                isCompleted
                  ? "bg-emerald-500 shadow-sm shadow-emerald-500/40"
                  : "bg-slate-200"
              } ${isActive && currentStep !== 3 ? "ring-4 ring-emerald-500/20 animate-pulse" : ""}`}
            >
              {isCompleted ? (
                <Check size={10} strokeWidth={4} className="text-white" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              )}
            </div>
          );
        })}
      </div>

      <span
        className={`text-[10px] sm:text-[11px] font-bold tracking-wide ${
          currentStep === 3 ? "text-emerald-600" : "text-amber-600"
        }`}
      >
        {currentStep === 1 && "เอกสารส่งถึงระบบแล้ว"}
        {currentStep === 2 && "แอดมินกำลังตรวจสอบ"}
        {currentStep === 3 && "พร้อมรับเอกสาร / ส่งเข้าอีเมล"}
      </span>
    </div>
  );
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

  // 🌟 เพิ่ม State สำหรับเปิด/ปิด Modal และเก็บข้อมูลคำร้องที่ถูกคลิก
  const [selectedRequest, setSelectedRequest] = useState(null);

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

        let pending = 0,
          approved = 0,
          rejected = 0;
        allData.forEach((req) => {
          if (req.status === "รอดำเนินการ" || req.status === "กำลังตรวจสอบ")
            pending++;
          else if (req.status === "อนุมัติแล้ว" || req.status === "เสร็จสิ้น")
            approved++;
          else if (req.status === "ถูกปฏิเสธ") rejected++;
        });

        setStats({ total: allData.length, pending, approved, rejected });
        setRecentRequests(allData.slice(0, 4));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[60vh]">
        <div className="relative flex justify-center items-center">
          <div className="absolute animate-ping w-16 h-16 rounded-full bg-emerald-400/20"></div>
          <div className="w-8 h-8 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-6 lg:gap-8 pb-28 lg:pb-12 p-4 sm:p-6 lg:p-8">
      {/* ─── 🚀 Hero Section ─── */}
      <div className="relative w-full rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden shadow-2xl shadow-slate-900/20 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-500/20 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 w-72 h-72 rounded-full bg-teal-500/10 blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 p-8 sm:p-12 lg:p-14 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-emerald-300 text-xs font-bold tracking-widest uppercase">
              <Sparkles size={14} /> CED Request
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              พร้อมทำเรื่อง
              <br className="hidden sm:block lg:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
                เอกสารวันนี้ไหม?
              </span>
            </h1>
            <p className="text-slate-400 font-medium text-lg max-w-lg">
              {userProfile?.firstNameTH || "นักศึกษา"} !! ยื่นคำร้องได้ง่ายๆ
              ติดตามสถานะเอกสารได้แบบเรียลไทม์
            </p>
          </div>

          <div className="w-full lg:w-auto">
            <Link
              href="/dashboard/request/new"
              className="group relative flex items-center justify-center gap-3 w-full lg:w-auto px-8 py-5 bg-white text-slate-900 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-100 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Plus
                size={24}
                strokeWidth={3}
                className="relative z-10 group-hover:rotate-90 transition-transform duration-500"
              />
              <span className="relative z-10">เริ่มสร้างคำร้องใหม่</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-150">
        {[
          {
            label: "คำร้องทั้งหมด",
            val: stats.total,
            icon: FileBadge2,
            color: "text-slate-700",
            bg: "bg-slate-100/50",
            glow: "group-hover:shadow-slate-200/50",
          },
          {
            label: "รอดำเนินการ",
            val: stats.pending,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50",
            glow: "group-hover:shadow-amber-200/50",
          },
          {
            label: "อนุมัติเรียบร้อย",
            val: stats.approved,
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            glow: "group-hover:shadow-emerald-200/50",
          },
          {
            label: "ถูกปฏิเสธ",
            val: stats.rejected,
            icon: XCircle,
            color: "text-rose-600",
            bg: "bg-rose-50",
            glow: "group-hover:shadow-rose-200/50",
          },
        ].map((s, i) => (
          <div
            key={i}
            className={`group relative bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:-translate-y-1 transition-all duration-300 hover:shadow-xl ${s.glow}`}
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${s.bg} ${s.color} group-hover:scale-110 transition-transform duration-500`}
            >
              <s.icon size={26} strokeWidth={2} />
            </div>
            <h3 className="text-4xl sm:text-5xl font-black text-slate-800 tracking-tighter mb-2">
              {s.val}
            </h3>
            <p className="text-sm font-bold text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300">
        {/* ─── 📝 Recent Activity ─── */}
        <div className="xl:col-span-2 flex flex-col bg-white rounded-[2.5rem] p-4 sm:p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8 px-2 sm:px-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800">
                ประวัติล่าสุด
              </h2>
              <p className="text-sm font-medium text-slate-400 mt-1">
                ติดตามการเดินทางของเอกสารแบบเรียลไทม์
              </p>
            </div>
            <Link
              href="/dashboard/history"
              className="group flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-full text-sm font-bold text-slate-600 transition-colors"
            >
              ดูทั้งหมด{" "}
              <ArrowUpRight
                size={16}
                className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              />
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Inbox size={40} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">
                พื้นที่นี้ยังว่างเปล่า
              </h3>
              <p className="text-slate-400 font-medium mt-2">
                เมื่อคุณสร้างคำร้อง ข้อมูลจะปรากฏที่นี่
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentRequests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)} // 🌟 เรียก Modal ตรงนี้เมื่อถูกคลิก
                  className="group flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-5 sm:p-6 rounded-[1.5rem] bg-white border border-slate-100 hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors border border-slate-100">
                      <FileText size={22} strokeWidth={2} />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <h4 className="font-bold text-slate-800 text-base truncate group-hover:text-emerald-700 transition-colors">
                        {req.academicWork?.workTitle ||
                          "คำร้องขอความอนุเคราะห์ (ไม่ได้ระบุชื่อ)"}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-400">
                        <span>
                          ยื่นเมื่อ:{" "}
                          {req.createdAt
                            ? new Date(
                                req.createdAt.seconds * 1000,
                              ).toLocaleDateString("th-TH")
                            : "-"}
                        </span>
                        <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 tracking-wider">
                          REF: {req.id.substring(0, 8).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end w-full lg:w-auto pl-16 lg:pl-0 gap-6 shrink-0 border-t lg:border-t-0 border-slate-50 pt-4 lg:pt-0 mt-2 lg:mt-0">
                    <RequestTimeline status={req.status} />
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors shrink-0 hidden sm:flex">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="relative overflow-hidden bg-emerald-50 rounded-[2.5rem] p-8 border border-emerald-100 flex flex-col justify-between h-full min-h-[300px] group">
            <div className="absolute top-0 right-0 p-6 opacity-20 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
              <HelpCircle
                size={120}
                strokeWidth={1}
                className="text-emerald-600"
              />
            </div>

            <div className="relative z-10">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-600/30">
                <CheckCircle2 size={26} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3">
                ต้องการคำแนะนำ?
              </h3>
              <p className="text-emerald-800/70 font-medium leading-relaxed text-sm">
                การยื่นเอกสารอาจมีขั้นตอนที่ซับซ้อน
                เราเตรียมคู่มือพร้อมภาพประกอบไว้ให้คุณแล้ว
              </p>
            </div>

            <div className="relative z-10 mt-8 space-y-3">
              <a
                href="/reqform/templates/user-manual.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full py-3.5 bg-white text-emerald-700 rounded-xl font-bold hover:shadow-md transition-shadow text-sm"
              >
                ดาวน์โหลดคู่มือการใช้งาน
              </a>
              <div className="flex items-center justify-center gap-2 w-full py-3 text-emerald-700 font-bold text-xs opacity-70">
                สอบถามเพิ่มเติม โทร. 02-555-2000 (3234)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 🎫 Modal สไตล์ E-Ticket ─── */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-50 rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90dvh]">
            {/* Header ของตั๋ว */}
            <div className="bg-slate-900 p-6 sm:p-8 flex justify-between items-start text-white shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              <div className="relative z-10 space-y-1">
                <p className="text-emerald-400 font-bold text-xs tracking-widest uppercase">
                  Request Details
                </p>
                <h3 className="text-2xl font-black">ข้อมูลคำร้อง</h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="relative z-10 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* รอยประตรงกลางตั๋ว */}
            <div className="h-4 w-full bg-slate-50 relative flex items-center shrink-0 overflow-hidden">
              <div className="absolute left-0 -ml-2 w-4 h-4 bg-slate-900/40 rounded-full"></div>
              <div className="w-full border-t-2 border-dashed border-slate-200"></div>
              <div className="absolute right-0 -mr-2 w-4 h-4 bg-slate-900/40 rounded-full"></div>
            </div>

            {/* ข้อมูลด้านในตั๋ว */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              <div className="flex flex-col items-center py-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
                  สถานะปัจจุบัน
                </p>
                <RequestTimeline status={selectedRequest.status} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    รหัสอ้างอิง (REF)
                  </span>
                  <p className="font-mono font-bold text-slate-700 text-sm">
                    {selectedRequest.id.substring(0, 8).toUpperCase()}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    วันที่ส่งเรื่อง
                  </span>
                  <p className="font-bold text-slate-700 text-sm">
                    {selectedRequest.createdAt
                      ? new Date(
                          selectedRequest.createdAt.seconds * 1000,
                        ).toLocaleDateString("th-TH")
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    ประเภทเอกสาร
                  </span>
                  <p className="font-bold text-emerald-600 text-sm">
                    {selectedRequest.docType || "-"}
                  </p>
                </div>
                <div>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    ชื่อเรื่อง / รายวิชา
                  </span>
                  <p className="font-bold text-slate-800 text-sm leading-relaxed">
                    {selectedRequest.academicWork?.workTitle || "-"}
                  </p>
                </div>
                <div>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    ความประสงค์
                  </span>
                  <p className="font-bold text-slate-700 text-sm leading-relaxed">
                    ขอ
                    {selectedRequest.requestDetails?.purpose === "อื่นๆ"
                      ? selectedRequest.requestDetails?.purposeOther
                      : selectedRequest.requestDetails?.purpose}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
