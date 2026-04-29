"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import {
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  FileText,
  LogOut,
  LayoutDashboard,
  Eye,
  ShieldCheck,
  Download,
  Printer,
  X,
} from "lucide-react";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import { useReactToPrint } from "react-to-print";

// ─── ฟังก์ชันแปลงเลขอารบิกเป็นเลขไทย ───
const toThaiNumerals = (numStr) => {
  const thaiNumbers = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];
  return String(numStr).replace(/[0-9]/g, (match) => thaiNumbers[match]);
};

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
        <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
          {status}
        </span>
      );
  }
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminName, setAdminName] = useState("");

  const [docNumber, setDocNumber] = useState("อว ๐๖๐๑.๑๒/");

  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `คำร้อง_${selectedRequest?.studentInfo?.fullName}`,
  });

  useEffect(() => {
    const fetchAllData = async (user) => {
      const adminDoc = await getDoc(doc(db, "users", user.uid));
      if (adminDoc.exists())
        setAdminName(adminDoc.data().firstNameTH || "แอดมิน");

      const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      setRequests(
        querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
      setIsLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchAllData(user);
      else router.push("/login");
    });
    return () => unsubscribe();
  }, [router]);

  const handleOpenModal = (req) => {
    setSelectedRequest(req);
    setDocNumber("อว ๐๖๐๑.๑๒/");
  };

  // ─── ฟังก์ชันสร้าง Word แบบที่ 1 (บันทึกข้อความ) ───
  const generateWord = async (data) => {
    try {
      const response = await fetch("/templates/template-memo.docx");
      const content = await response.arrayBuffer();
      const zip = new PizZip(content);

      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: "{{", end: "}}" },
      });

      const rawDate = new Date().toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const degree = data.studentInfo?.degree || "";

      let eduLevel = "ปริญญาตรี";
      if (degree === "ครุศาสตร์อุตสาหกรรมมหาบัณฑิต") {
        eduLevel = "ปริญญาโท";
      } else if (degree.includes("ดุษฎีบัณฑิต")) {
        eduLevel = "ปริญญาเอก";
      }

      let finalWorkType = data.academicWork?.workType || "";
      if (degree === "ครุศาสตร์อุตสาหกรรมบัณฑิต") {
        finalWorkType = "ปริญญานิพนธ์";
      }

      const templateData = {
        docNumber: docNumber,
        dateStr: toThaiNumerals(rawDate),
        prefix: data.studentInfo?.prefix || "",
        fullName: data.studentInfo?.fullName || "",
        studentId: toThaiNumerals(
          data.studentId || data.studentInfo?.studentId || "",
        ),
        eduLevel: eduLevel,
        degree: degree,
        department: data.studentInfo?.department || "",
        major: data.studentInfo?.major || "",
        studyPlan: data.studentInfo?.studyPlan || "",
        hasStudyPlan: !!data.studentInfo?.studyPlan,
        phoneMobile: data.studentInfo?.phoneMobile || "",
        workTitle: data.academicWork?.workTitle || "",
        workType: finalWorkType,
        mainAdvisor: data.academicWork?.advisors?.[0] || "",
        advisors: data.academicWork?.advisors
          ? data.academicWork.advisors
              .filter((n) => n.trim() !== "")
              .map((n) => ({ name: n }))
          : [],
      };

      try {
        doc.render(templateData);
      } catch (error) {
        error.properties?.errors?.forEach((e) => {
          console.error("❌ Tag เสีย:", JSON.stringify(e.properties));
        });
        throw error;
      }

      const out = doc.getZip().generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      saveAs(out, `บันทึกข้อความ_${data.studentInfo?.fullName}.docx`);
    } catch (error) {
      console.error("Error generating word:", error);
      alert("เกิดข้อผิดพลาดในการสร้างไฟล์ Word กรุณาตรวจสอบไฟล์ Template");
    }
  };

  // ─── ฟังก์ชันสร้าง Word แบบที่ 2 (จดหมายเชิญผู้เชี่ยวชาญ) แบบแยกไฟล์ Template ───
  const generateExpertWord = async (data) => {
    try {
      const degree = data.studentInfo?.degree || "";
      let templateFileName = "template-expert-bachelor.docx";

      if (degree === "ครุศาสตร์อุตสาหกรรมมหาบัณฑิต") {
        templateFileName = "template-expert-master.docx";
      } else if (degree.includes("ดุษฎีบัณฑิต")) {
        templateFileName = "template-expert-doctoral.docx";
      }

      const response = await fetch(`/templates/${templateFileName}`);
      if (!response.ok) {
        throw new Error(
          `ไม่พบไฟล์ ${templateFileName} ในโฟลเดอร์ public/templates/`,
        );
      }

      const content = await response.arrayBuffer();
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: "{{", end: "}}" },
      });

      const expertMap = new Map();

      // ตรวจสอบด้านเนื้อหา
      data.experts?.content?.forEach((e) => {
        const name = e.name.trim();
        if (name !== "") {
          expertMap.set(name, { name: name, isContent: true, isTech: false });
        }
      });

      // ตรวจสอบด้านเทคนิค
      data.experts?.technical?.forEach((e) => {
        const name = e.name.trim();
        if (name !== "") {
          if (expertMap.has(name)) {
            expertMap.get(name).isTech = true;
          } else {
            expertMap.set(name, { name: name, isContent: false, isTech: true });
          }
        }
      });

      const combinedExperts = Array.from(expertMap.values()).map((e) => {
        let typeStr = "";
        if (e.isContent && e.isTech) {
          typeStr = "ด้านเนื้อหาและด้านเทคนิค";
        } else if (e.isContent) {
          typeStr = "ด้านเนื้อหา";
        } else if (e.isTech) {
          typeStr = "ด้านเทคนิค";
        }

        return {
          expertName: e.name,
          expertType: typeStr,
        };
      });

      const allExpertsList = combinedExperts.map((e, index) => ({
        index: toThaiNumerals(index + 1),
        expertName: e.expertName,
      }));

      const rawDate = new Date().toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      let eduLevel = "ปริญญาตรี";
      if (degree === "ครุศาสตร์อุตสาหกรรมมหาบัณฑิต") {
        eduLevel = "ปริญญาโท";
      } else if (degree.includes("ดุษฎีบัณฑิต")) {
        eduLevel = "ปริญญาเอก";
      }

      let finalWorkType = data.academicWork?.workType || "";
      if (degree === "ครุศาสตร์อุตสาหกรรมบัณฑิต") {
        finalWorkType = "ปริญญานิพนธ์";
      }

      const templateData = {
        docNumber: docNumber,
        dateStr: toThaiNumerals(rawDate),
        prefix: data.studentInfo?.prefix || "",
        fullName: data.studentInfo?.fullName || "",
        studentId: toThaiNumerals(
          data.studentId || data.studentInfo?.studentId || "",
        ),
        eduLevel: eduLevel,
        degree: degree,
        department: data.studentInfo?.department || "",
        major: data.studentInfo?.major || "",
        studyPlan: data.studentInfo?.studyPlan || "",
        workTitle: data.academicWork?.workTitle || "",
        workType: finalWorkType,
        mainAdvisor: data.academicWork?.advisors?.[0] || "",
        advisors: data.academicWork?.advisors
          ? data.academicWork.advisors
              .filter((n) => n.trim() !== "")
              .map((n) => ({ name: n }))
          : [],
        experts: combinedExperts,
        allExperts: allExpertsList,
      };

      try {
        doc.render(templateData);
      } catch (error) {
        error.properties?.errors?.forEach((e) => {
          console.error("❌ Tag เสีย:", JSON.stringify(e.properties));
        });
        throw error;
      }

      const out = doc.getZip().generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      saveAs(out, `จดหมายเชิญผู้เชี่ยวชาญ_${data.studentInfo?.fullName}.docx`);
    } catch (error) {
      console.error("Error generating Expert word:", error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  };

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      await updateDoc(doc(db, "requests", requestId), { status: newStatus });
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: newStatus } : req,
        ),
      );
      if (selectedRequest?.id === requestId)
        setSelectedRequest((prev) => ({ ...prev, status: newStatus }));
    } catch (error) {
      alert("อัปเดตสถานะไม่สำเร็จ");
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex font-sans">
      <aside className="w-72 bg-slate-900 text-slate-300 flex-col hidden lg:flex shrink-0">
        <div className="h-20 flex items-center justify-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30 text-emerald-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="font-black text-white text-lg leading-tight">
                Admin Panel
              </h2>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                ComEdu System
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 py-6 px-4 space-y-2">
          <div className="flex items-center gap-3 px-4 py-3.5 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20">
            <LayoutDashboard size={20} /> จัดการคำร้อง
          </div>
        </div>
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => signOut(auth).then(() => router.push("/login"))}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-400/10 rounded-xl font-bold transition-colors"
          >
            <LogOut size={18} /> ออกจากระบบ
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center px-8 sm:px-10 sticky top-0 z-10">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            รายการคำร้องของนักศึกษา
          </h1>
        </header>

        <div className="p-6 sm:p-10">
          <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                    วันที่
                  </th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                    ผู้ยื่นคำร้อง
                  </th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                    เรื่อง
                  </th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">
                    สถานะ
                  </th>
                  <th className="px-6 py-5 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {req.createdAt
                        ? new Date(
                            req.createdAt.seconds * 1000,
                          ).toLocaleDateString("th-TH")
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
                    <td className="px-6 py-4 text-sm font-bold text-slate-700 truncate max-w-[250px]">
                      {req.academicWork?.workTitle}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleOpenModal(req)}
                        className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all flex items-center gap-2 mx-auto shadow-md"
                      >
                        <Eye size={16} /> ตรวจสอบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
              <div className="p-6 sm:px-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-[2.5rem]">
                <h3 className="text-xl font-black text-slate-800">
                  รายละเอียดคำร้อง
                </h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 text-slate-400 hover:text-slate-800 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 sm:p-10 overflow-y-auto flex-1 custom-scrollbar space-y-8">
                <div
                  ref={componentRef}
                  className="p-10 bg-white font-['TH_Sarabun_New'] text-black hidden print:block"
                >
                  <h1 className="text-center text-[29pt] font-bold mb-8">
                    บันทึกข้อความ
                  </h1>
                  <p className="text-[16pt] mb-4">
                    <b>ส่วนราชการ:</b> ภาควิชาคอมพิวเตอร์ศึกษา
                    คณะครุศาสตร์อุตสาหกรรม โทร. ๓๒๓๔
                  </p>
                  <div className="flex justify-between text-[16pt] mb-4">
                    <p>
                      <b>ที่:</b>{" "}
                      {docNumber || "........................................"}
                    </p>
                    <p>
                      <b>วันที่:</b>{" "}
                      {new Date().toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <p className="text-[16pt] mb-4">
                    <b>เรื่อง:</b> {selectedRequest.academicWork?.workTitle}
                  </p>
                  <p className="text-[16pt] mt-8 indent-[2.5cm] leading-relaxed">
                    ด้วย {selectedRequest.studentInfo?.prefix}
                    {selectedRequest.studentInfo?.fullName} รหัสนักศึกษา{" "}
                    {selectedRequest.studentInfo?.studentId} นักศึกษา
                    {selectedRequest.studentInfo?.degree}
                    มีความประสงค์ขอ
                    {selectedRequest.requestDetails?.purpose === "อื่นๆ"
                      ? selectedRequest.requestDetails?.purposeOther
                      : selectedRequest.requestDetails?.purpose}{" "}
                    สำหรับจัดทำ{selectedRequest.academicWork?.workType}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <section>
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        นักศึกษา
                      </label>
                      <p className="text-lg font-bold text-slate-800 mt-1">
                        {selectedRequest.studentInfo?.prefix}
                        {selectedRequest.studentInfo?.fullName}
                      </p>
                      <p className="text-sm font-bold text-slate-500">
                        รหัส: {selectedRequest.studentInfo?.studentId}
                      </p>
                    </section>
                    <section>
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        ความประสงค์
                      </label>
                      <p className="text-md font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl mt-2 inline-block border border-emerald-100">
                        ขอ
                        {selectedRequest.requestDetails?.purpose === "อื่นๆ"
                          ? selectedRequest.requestDetails?.purposeOther
                          : selectedRequest.requestDetails?.purpose}
                      </p>
                    </section>
                  </div>

                  <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <section>
                      <label className="text-[11px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                        <FileText size={14} /> สำหรับเจ้าหน้าที่
                      </label>

                      <div className="mt-4 space-y-2">
                        <label className="text-sm font-bold text-slate-700">
                          เลขที่เอกสาร (ที่)
                        </label>
                        <input
                          type="text"
                          value={docNumber}
                          onChange={(e) => setDocNumber(e.target.value)}
                          placeholder="เช่น อว ๐๖๐๑.๑๒/๑๒๓๔"
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-blue-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm"
                        />
                      </div>

                      <div className="mt-4 space-y-2">
                        <label className="text-sm font-bold text-slate-700">
                          อัปเดตสถานะคำร้อง
                        </label>
                        <select
                          value={selectedRequest.status}
                          onChange={(e) =>
                            handleStatusChange(
                              selectedRequest.id,
                              e.target.value,
                            )
                          }
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-500 shadow-sm"
                        >
                          <option value="รอดำเนินการ">รอดำเนินการ</option>
                          <option value="กำลังตรวจสอบ">กำลังตรวจสอบ</option>
                          <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
                          <option value="ถูกปฏิเสธ">ถูกปฏิเสธ</option>
                        </select>
                      </div>
                    </section>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:px-10 border-t border-slate-100 bg-slate-50/50 rounded-b-[2.5rem] flex flex-wrap gap-3 justify-end items-center">
                <div className="flex gap-2 mr-auto">
                  <button
                    onClick={() => generateWord(selectedRequest)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-bold transition-all shadow-sm hover:shadow"
                  >
                    <Download size={18} /> โหลดฟอร์ม 1 (บันทึกข้อความ)
                  </button>
                  <button
                    onClick={() => generateExpertWord(selectedRequest)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl font-bold transition-all shadow-sm hover:shadow"
                  >
                    <Download size={18} /> โหลดฟอร์ม 2 (จดหมายเชิญ)
                  </button>
                </div>

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 active:scale-95 transition-all ml-4"
                >
                  <Printer size={18} /> พิมพ์หน้าคำร้อง PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
