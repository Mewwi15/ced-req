"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { useAuth } from "@/lib/AuthContext";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Search,
  FileText,
  Inbox,
  ArrowRight,
  Hash,
  Calendar,
  Check,
} from "lucide-react";

// ─── 🎨 นำ Progress Tracker จากหน้าแรกมาใช้เพื่อให้ดีไซน์ต่อเนื่องกัน ───
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
          ถูกปฏิเสธ
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end sm:items-center gap-1.5">
      <div className="flex items-center justify-between w-28 sm:w-36 relative">
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
              className={`relative z-10 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center transition-all duration-500 ${
                isCompleted ? "bg-emerald-500 shadow-sm" : "bg-slate-200"
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
        className={`text-[10px] sm:text-[11px] font-bold tracking-wide ${currentStep === 3 ? "text-emerald-600" : "text-amber-600"}`}
      >
        {currentStep === 1 && "รอเจ้าหน้าที่รับเรื่อง"}
        {currentStep === 2 && "กำลังตรวจสอบ"}
        {currentStep === 3 && "เรียบร้อย"}
      </span>
    </div>
  );
};

export default function HistoryPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // 🌟 เพิ่ม State สำหรับระบบค้นหา
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      if (user) {
        try {
          const q = query(
            collection(db, "requests"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc"),
          );
          const querySnapshot = await getDocs(q);
          const data = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setRequests(data);
        } catch (error) {
          console.error("Error fetching requests:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchRequests();
  }, [user]);

  // 🌟 ฟังก์ชันกรองข้อมูลตามช่องค้นหา
  const filteredRequests = requests.filter((req) => {
    const titleMatch = req.academicWork?.workTitle
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const typeMatch = req.docType
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const idMatch = req.id.toLowerCase().includes(searchTerm.toLowerCase());
    return titleMatch || typeMatch || idMatch;
  });

  if (isLoading)
    return (
      <div className="h-full flex items-center justify-center min-h-[60vh]">
        <div className="relative flex justify-center items-center">
          <div className="absolute animate-ping w-16 h-16 rounded-full bg-emerald-400/20"></div>
          <div className="w-8 h-8 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>
      </div>
    );

  return (
    // 📍 คงการเว้น Padding สำหรับมือถือไว้
    <div className="max-w-[1400px] mx-auto w-full flex-1 flex flex-col gap-6 lg:gap-8 pb-28 lg:pb-12 p-4 sm:p-6 lg:p-8">
      {/* ─── 🌟 Header & Search Bar ─── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 animate-in fade-in duration-500">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold tracking-widest uppercase mb-3">
            <FileText size={14} /> My Documents
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-2">
            ประวัติคำร้องของคุณ
          </h1>
          <p className="text-slate-500 font-medium">
            ทั้งหมด {requests.length} รายการ (ค้นหาเจอ {filteredRequests.length}{" "}
            รายการ)
          </p>
        </div>

        {/* ช่องค้นหา */}
        <div className="relative w-full lg:w-96">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="ค้นหาชื่อเรื่อง, ประเภท หรือรหัสคำร้อง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-sm font-medium shadow-sm"
          />
        </div>
      </div>

      {/* ─── 📄 Modern List View (แทนที่ Table เดิม) ─── */}
      <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-8 duration-700 delay-100">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center py-20 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Inbox size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-700 font-bold text-xl mb-2">
              ไม่พบคำร้องที่คุณค้นหา
            </p>
            <p className="text-slate-400 font-medium">
              ลองเปลี่ยนคำค้นหา หรือสร้างคำร้องใหม่ดูสิ
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req.id}
              onClick={() => setSelectedRequest(req)}
              className="group flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-5 sm:p-6 rounded-[1.5rem] bg-white border border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-300 cursor-pointer"
            >
              {/* ข้อมูลหลัก */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors border border-slate-100">
                  <FileText size={22} strokeWidth={2} />
                </div>
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-md">
                      {req.docType}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 font-mono">
                      <Hash size={12} /> {req.id.substring(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg sm:text-base leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2">
                    {req.academicWork?.workTitle || "-"}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                    <Calendar size={14} />
                    <span>
                      {req.createdAt
                        ? new Date(
                            req.createdAt.seconds * 1000,
                          ).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "ไม่ระบุ"}
                    </span>
                  </div>
                </div>
              </div>

              {/* สถานะและปุ่มกด */}
              <div className="flex items-center justify-between lg:justify-end w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-50 gap-6 shrink-0 mt-2 lg:mt-0">
                <RequestTimeline status={req.status} />
                <button className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ))
        )}
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
                    {selectedRequest.docType}
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
