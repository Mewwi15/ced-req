"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { useAuth } from "@/lib/AuthContext"; // 📍 ดึง Context มาใช้
import {
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  FileText,
  Inbox,
  Eye,
} from "lucide-react";

// ─── 🎨 Helper: ฟังก์ชันเลือกสีป้ายสถานะ ───
const getStatusBadge = (status) => {
  switch (status) {
    case "รอดำเนินการ":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
          <Clock size={14} /> รอดำเนินการ
        </span>
      );
    case "กำลังตรวจสอบ":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
          <Search size={14} /> กำลังตรวจสอบ
        </span>
      );
    case "อนุมัติแล้ว":
    case "เสร็จสิ้น":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
          <CheckCircle2 size={14} /> อนุมัติแล้ว
        </span>
      );
    case "ถูกปฏิเสธ":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-200">
          <XCircle size={14} /> ถูกปฏิเสธ
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
          {status}
        </span>
      );
  }
};

export default function HistoryPage() {
  // 📍 เรียกใช้ user จาก Context ได้เลย
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null); // สำหรับเปิดดูรายละเอียด

  // 📍 โหลดประวัติคำร้องทันทีเมื่อมีข้อมูล user
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
          // หมายเหตุ: ถ้าเจอ Error ใน Console เรื่อง Index ให้กดลิงก์ที่ Firebase ให้มาเพื่อสร้าง Composite Index
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchRequests();
  }, [user]);

  if (isLoading)
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );

  return (
    // 📍 ลบ div ครอบ Navbar/Sidebar ออก เหลือแค่ Container หลัก
    <div className="p-4 sm:p-8 lg:p-10 max-w-6xl mx-auto w-full flex-1">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
            ประวัติคำร้อง
          </h1>
          <p className="text-slate-500 font-medium">
            ติดตามสถานะคำร้องที่คุณได้ส่งให้ภาควิชาดำเนินการ
          </p>
        </div>
        <div className="bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm text-sm font-bold text-slate-600 flex items-center gap-2">
          <FileText size={18} className="text-emerald-500" />
          ทั้งหมด {requests.length} รายการ
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  วันที่ส่งคำร้อง
                </th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  ประเภท
                </th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                  เรื่อง
                </th>
                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  สถานะ
                </th>
                <th className="px-8 py-5 text-center text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  รายละเอียด
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-24 text-center">
                    <Inbox size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500 font-bold text-lg mb-1">
                      ยังไม่มีประวัติการส่งคำร้อง
                    </p>
                    <p className="text-slate-400 text-sm">
                      เมื่อคุณสร้างคำร้องใหม่ ข้อมูลจะมาปรากฏที่นี่
                    </p>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-8 py-6 text-sm text-slate-500 font-medium whitespace-nowrap">
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
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-700 whitespace-nowrap">
                      {req.docType}
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-800 max-w-xs truncate">
                      {req.academicWork?.workTitle || "-"}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-sm transition-colors border border-slate-200"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal Popup สำหรับดูข้อมูลเบื้องต้น ─── */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800">
                รายละเอียดคำร้อง
              </h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-slate-500 font-bold text-sm">
                  สถานะปัจจุบัน
                </span>
                {getStatusBadge(selectedRequest.status)}
              </div>
              <div className="space-y-4">
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    ประเภทคำร้อง
                  </span>
                  <p className="font-bold text-slate-800">
                    {selectedRequest.docType}
                  </p>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    เรื่อง
                  </span>
                  <p className="font-bold text-slate-800">
                    {selectedRequest.academicWork?.workTitle}
                  </p>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    ความประสงค์
                  </span>
                  <p className="font-bold text-slate-800 text-emerald-700">
                    ขอ
                    {selectedRequest.requestDetails?.purpose === "อื่นๆ"
                      ? selectedRequest.requestDetails?.purposeOther
                      : selectedRequest.requestDetails?.purpose}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                    <FileText size={16} /> ข้อมูลเพิ่มเติม
                  </p>
                  <p className="text-sm text-slate-600 mt-2 font-medium">
                    หากต้องการแก้ไขข้อมูลหรือยกเลิกคำร้อง
                    กรุณาติดต่อแอดมินภาควิชาคอมพิวเตอร์ศึกษา
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
