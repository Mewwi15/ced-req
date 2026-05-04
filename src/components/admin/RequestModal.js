"use client";
import React, { useState, useRef } from "react";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  X,
  FileText,
  Download,
  Printer,
  ChevronDown,
  CheckCircle2,
  Clock,
  Search as SearchIcon,
  XCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

// ─── ฟังก์ชันแปลงเลขอารบิกเป็นเลขไทย ───
const toThaiNumerals = (numStr) => {
  const thaiNumbers = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];
  return String(numStr).replace(/[0-9]/g, (match) => thaiNumbers[match]);
};

// ─── Component ไอคอนสถานะสำหรับแสดงใน Modal ───
const StatusIcon = ({ status }) => {
  if (status === "อนุมัติแล้ว")
    return <CheckCircle2 size={18} className="text-emerald-500" />;
  if (status === "รอดำเนินการ")
    return <Clock size={18} className="text-amber-500" />;
  if (status === "กำลังตรวจสอบ")
    return <SearchIcon size={18} className="text-blue-500" />;
  if (status === "ถูกปฏิเสธ")
    return <XCircle size={18} className="text-red-500" />;
  return null;
};

export default function RequestModal({ request, onClose, setRequests }) {
  const [docNumber, setDocNumber] = useState("อว ๐๖๐๑.๑๒/");
  const [currentStatus, setCurrentStatus] = useState(request.status);
  const [isUpdating, setIsUpdating] = useState(false);

  // ─── State รายชื่อผู้เชี่ยวชาญ (แอดมินกรอกเอง) ───
  const [experts, setExperts] = useState([{ name: "", type: "ด้านเนื้อหา" }]);

  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `คำร้อง_${request?.studentInfo?.fullName}`,
  });

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, "requests", request.id), { status: newStatus });
      setCurrentStatus(newStatus);
      setRequests((prev) =>
        prev.map((req) =>
          req.id === request.id ? { ...req, status: newStatus } : req,
        ),
      );
    } catch (error) {
      alert("อัปเดตสถานะไม่สำเร็จ");
    } finally {
      setIsUpdating(false);
    }
  };

  // ─── ฟังก์ชันจัดการผู้เชี่ยวชาญ ───
  const addExpert = () =>
    setExperts([...experts, { name: "", type: "ด้านเนื้อหา" }]);

  const removeExpert = (i) => setExperts(experts.filter((_, idx) => idx !== i));

  const updateExpert = (i, field, value) => {
    const updated = [...experts];
    updated[i][field] = value;
    setExperts(updated);
  };

  // ─── ฟังก์ชันอัจฉริยะ โหลดได้ทุกฟอร์ม ───
  const generateDocument = async (templateFileName, outputName, data) => {
    try {
      const response = await fetch(`/reqform/templates/${templateFileName}`);

      if (!response.ok) {
        throw new Error(
          `ไม่พบไฟล์ ${templateFileName} ในระบบ (HTTP ${response.status})`,
        );
      }

      const content = await response.arrayBuffer();
      const zip = new PizZip(content);
      const docx = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: "{{", end: "}}" },
      });

      const requestDate = data.createdAt
        ? new Date(data.createdAt.seconds * 1000)
        : new Date();
      const thaiDateFormatter = new Intl.DateTimeFormat("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // กรองเฉพาะผู้เชี่ยวชาญที่กรอกชื่อแล้ว
      const filteredExperts = experts.filter((e) => e.name.trim() !== "");

      docx.render({
        docNumber: docNumber || "อว ๐๖๐๑.๑๒/",
        dateStr: thaiDateFormatter.format(requestDate),

        prefix: data.studentInfo?.prefix || "",
        fullName: data.studentInfo?.fullName || "",
        studentId: data.studentInfo?.studentId || "",
        degree: data.studentInfo?.degree || "",
        eduLevel: data.studentInfo?.degree || "",
        department: data.studentInfo?.department || "",
        major: data.studentInfo?.major || "",
        phoneMobile: data.studentInfo?.phoneMobile || "",
        studyPlan: data.studentInfo?.studyPlan || "",
        hasStudyPlan: !!data.studentInfo?.studyPlan,

        workTitle: data.academicWork?.workTitle || "",
        workType: data.academicWork?.workType || "",
        mainAdvisor:
          data.academicWork?.advisors?.find((a) => a.trim() !== "") || "",
        advisors: (data.academicWork?.advisors || [])
          .filter((n) => n.trim() !== "")
          .map((n) => ({ name: n })),

        // ผู้เชี่ยวชาญที่แอดมินกรอก
        experts: filteredExperts.map((e) => ({
          expertName: e.name,
          expertType: e.type,
        })),
        allExperts: filteredExperts.map((e, i) => ({
          index: i + 1,
          expertName: e.name,
        })),
      });

      const out = docx.getZip().generate({ type: "arraybuffer" });
      const blob = new Blob([out], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      saveAs(blob, `${outputName}_${data.studentInfo?.fullName}.docx`);
    } catch (error) {
      console.error("Error generating document:", error);
      alert(
        `เกิดข้อผิดพลาดในการโหลดไฟล์ ${templateFileName}\n${error.message}`,
      );
    }
  };

  // ─── เช็คระดับการศึกษาแล้วโหลดไฟล์อัตโนมัติ ───
  const handleDownloadDegreeForm = () => {
    const degree = request.studentInfo?.degree || "";

    if (
      degree.includes("ดุษฎีบัณฑิต") ||
      degree.includes("ปริญญาเอก") ||
      degree.includes("ป.เอก")
    ) {
      generateDocument("doctorate_template.docx", "คำร้อง_", request);
    } else if (
      degree.includes("มหาบัณฑิต") ||
      degree.includes("ปริญญาโท") ||
      degree.includes("ป.โท")
    ) {
      generateDocument("template-expert.docx", "คำร้อง_", request);
    } else if (
      degree.includes("บัณฑิต") ||
      degree.includes("ปริญญาตรี") ||
      degree.includes("ป.ตรี")
    ) {
      generateDocument("template-expert-bachelor.docx", "คำร้อง_", request);
    } else {
      alert(
        `ไม่สามารถระบุระดับการศึกษาจากคำว่า "${degree}" ได้ กรุณาตรวจสอบข้อมูลนักศึกษา`,
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden ring-1 ring-slate-900/5">
        {/* ─── Header ─── */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-xl z-10 sticky top-0">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              รายละเอียดคำร้อง
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-1">
              ตรวจสอบและดำเนินการเอกสารของนักศึกษา
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all duration-200"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* ─── Body ─── */}
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          <div
            ref={componentRef}
            className="p-10 bg-white font-['TH_Sarabun_New'] text-black hidden print:block"
          >
            {/* โค้ด Print ซ่อนไว้ */}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* ─── ซ้าย: ข้อมูลนักศึกษา ─── */}
            <div className="lg:col-span-3 space-y-8">
              <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                    {request.studentInfo?.firstNameTH?.charAt(0) || "น"}
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">
                      ผู้ยื่นคำร้อง
                    </h4>
                    <p className="text-lg font-bold text-slate-800">
                      {request.studentInfo?.prefix}
                      {request.studentInfo?.fullName}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                  <div>
                    <p className="text-slate-400 font-medium mb-1">
                      รหัสนักศึกษา
                    </p>
                    <p className="font-bold text-slate-700">
                      {request.studentInfo?.studentId}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium mb-1">
                      เบอร์โทรศัพท์
                    </p>
                    <p className="font-bold text-slate-700">
                      {request.studentInfo?.phoneMobile || "-"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400 font-medium mb-1">
                      ระดับการศึกษา
                    </p>
                    <p className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg inline-block border border-emerald-100/50">
                      {request.studentInfo?.degree || "ไม่ได้ระบุ"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  หัวข้อและรายละเอียดงาน
                </h4>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-slate-400 font-medium mb-1">
                      เรื่องที่ขอ
                    </p>
                    <p className="font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl inline-block border border-emerald-100/50">
                      ขอ
                      {request.requestDetails?.purpose === "อื่นๆ"
                        ? request.requestDetails?.purposeOther
                        : request.requestDetails?.purpose}
                    </p>
                  </div>
                  <div className="pt-2">
                    <p className="text-slate-400 font-medium mb-1">
                      ชื่องานวิจัย / ปริญญานิพนธ์
                    </p>
                    <p className="font-bold text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {request.academicWork?.workTitle}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* ─── ขวา: สำหรับเจ้าหน้าที่ ─── */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-200">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <FileText size={18} />
                  </div>
                  <h4 className="font-black text-slate-800">
                    สำหรับเจ้าหน้าที่
                  </h4>
                </div>

                {/* เลขที่เอกสาร */}
                <div className="space-y-2 mb-5">
                  <label className="text-sm font-bold text-slate-700">
                    เลขที่เอกสาร (ที่)
                  </label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="เช่น อว ๐๖๐๑.๑๒/๑๒๓๔"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-blue-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                  />
                </div>

                {/* รายชื่อผู้เชี่ยวชาญ */}
                <div className="space-y-2 mb-5">
                  <label className="text-sm font-bold text-slate-700">
                    รายชื่อผู้เชี่ยวชาญ
                  </label>
                  <div className="space-y-2">
                    {experts.map((exp, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={exp.name}
                          onChange={(e) =>
                            updateExpert(i, "name", e.target.value)
                          }
                          placeholder={`ชื่อผู้เชี่ยวชาญ ${i + 1}`}
                          className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                        />
                        <select
                          value={exp.type}
                          onChange={(e) =>
                            updateExpert(i, "type", e.target.value)
                          }
                          className="px-2 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 text-slate-600"
                        >
                          <option value="ด้านเนื้อหา">เนื้อหา</option>
                          <option value="ด้านเทคนิค">เทคนิค</option>
                        </select>
                        {experts.length > 1 && (
                          <button
                            onClick={() => removeExpert(i)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addExpert}
                    className="flex items-center gap-1.5 text-sm text-blue-600 font-bold hover:text-blue-700 mt-1"
                  >
                    <Plus size={15} /> เพิ่มผู้เชี่ยวชาญ
                  </button>
                </div>

                {/* อัปเดตสถานะ */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    อัปเดตสถานะคำร้อง
                    {isUpdating && (
                      <span className="text-[10px] text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full animate-pulse">
                        กำลังบันทึก...
                      </span>
                    )}
                  </label>

                  <div className="relative group">
                    <select
                      value={currentStatus}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={isUpdating}
                      className={`w-full appearance-none pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all cursor-pointer shadow-sm disabled:opacity-50 ${
                        currentStatus === "อนุมัติแล้ว"
                          ? "text-emerald-700 border-emerald-200 bg-emerald-50/50"
                          : currentStatus === "ถูกปฏิเสธ"
                            ? "text-red-700 border-red-200 bg-red-50/50"
                            : ""
                      }`}
                    >
                      <option value="รอดำเนินการ">รอดำเนินการ</option>
                      <option value="กำลังตรวจสอบ">กำลังตรวจสอบ</option>
                      <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
                      <option value="ถูกปฏิเสธ">ถูกปฏิเสธ</option>
                    </select>

                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <StatusIcon status={currentStatus} />
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={18} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Footer ─── */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3 justify-between items-center z-10 rounded-b-[2rem]">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() =>
                generateDocument("template-memo.docx", "บันทึกข้อความ", request)
              }
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-bold transition-all shadow-sm"
            >
              <Download size={18} /> บันทึกข้อความ
            </button>

            <button
              onClick={handleDownloadDegreeForm}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
            >
              <Download size={18} /> โหลดแบบฟอร์มคำร้อง
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 active:scale-95 transition-all"
          >
            <Printer size={18} /> พิมพ์ใบปะหน้า
          </button>
        </div>
      </div>
    </div>
  );
}
