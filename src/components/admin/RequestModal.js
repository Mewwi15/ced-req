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
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

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

  // ✅ แก้ไขให้ตรงกับเวอร์ชันใหม่ของ react-to-print
  const contentRef = useRef(null);

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

      // ดึงผู้เชี่ยวชาญจาก Firebase โดยตรง
      const contentExperts = (data.experts?.content || []).filter(
        (e) => e.name?.trim() !== "",
      );
      const technicalExperts = (data.experts?.technical || []).filter(
        (e) => e.name?.trim() !== "",
      );
      const allExpertsCombined = [
        ...contentExperts.map((e) => ({
          expertName: e.name,
          expertType: "ด้านเนื้อหา",
        })),
        ...technicalExperts.map((e) => ({
          expertName: e.name,
          expertType: "ด้านเทคนิค",
        })),
      ];

      // 🌟 ชุดตัวแปรใหม่สำหรับฟอร์ม "ขอเก็บข้อมูล/ผู้เชี่ยวชาญ"
      const val = (value) =>
        value && value.toString().trim() !== "" ? value : "-";
      const checked = "✓";
      const unchecked = " ";
      const docDate = requestDate.getDate().toString();
      const docMonth = new Intl.DateTimeFormat("th-TH", {
        month: "long",
      }).format(requestDate);
      const docYear = (requestDate.getFullYear() + 543).toString();

      const cExp = data.experts?.content || [];
      const tExp = data.experts?.technical || [];
      const advs = data.academicWork?.advisors || [];

      // ดึงตัวแปร degree มาไว้เช็คคำ
      const degreeStr = data.studentInfo?.degree || "";

      docx.render({
        // --- 🟢 ข้อมูลเดิม (สำหรับฟอร์มบันทึกข้อความและคำร้องทั่วไป) ---
        docNumber: docNumber || "อว ๐๖๐๑.๑๒/",
        dateStr: thaiDateFormatter.format(requestDate),
        prefix: data.studentInfo?.prefix || "",
        fullName: data.studentInfo?.fullName || "",
        studentId: data.studentInfo?.studentId || "",
        degree: degreeStr,
        eduLevel: degreeStr,
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
        experts: allExpertsCombined,
        allExperts: allExpertsCombined.map((e, i) => ({
          index: i + 1,
          expertName: e.expertName,
        })),

        // --- 🌟 ข้อมูลใหม่ (สำหรับฟอร์มขอเก็บข้อมูล/แต่งตั้งผู้เชี่ยวชาญ) ---
        docDate: docDate,
        docMonth: docMonth,
        docYear: docYear,

        signName: val(data.studentInfo?.fullName), // ชื่อสำหรับช่องเซ็น (ไม่มีคำนำหน้า)
        fullSignName: val(
          `${data.studentInfo?.prefix || ""}${data.studentInfo?.fullName || ""}`,
        ), // ชื่อเต็มในวงเล็บ

        branch: val(data.studentInfo?.department),
        address: val(data.studentInfo?.address),
        phoneWork: val(data.studentInfo?.phoneWork),
        phoneHome: val(data.studentInfo?.phoneHome),

        // Checkbox: เรื่อง
        reqTypeCollect: (data.requestDetails?.purpose || "").includes(
          "เก็บรวบรวม",
        )
          ? checked
          : unchecked,
        reqTypeExpert: (data.requestDetails?.purpose || "").includes(
          "ผู้เชี่ยวชาญ",
        )
          ? checked
          : unchecked,

        // Checkbox: สิ่งที่ส่งมาด้วย
        attQ: data.requestDetails?.questionnaireCount > 0 ? checked : unchecked,
        attQNum: val(data.requestDetails?.questionnaireCount),
        attEval: data.requestDetails?.evaluationCount > 0 ? checked : unchecked,
        attEvalNum: val(data.requestDetails?.evaluationCount),
        attExp: cExp.length > 0 || tExp.length > 0 ? checked : unchecked,
        attOther:
          data.requestDetails?.purpose === "อื่นๆ" ? checked : unchecked,
        attOtherDesc:
          data.requestDetails?.purpose === "อื่นๆ"
            ? val(data.requestDetails?.purposeOther)
            : "-",

        // 🌟 Checkbox: ระดับการศึกษา (รองรับทั้งชื่อย่อและชื่อเต็ม)
        degMaster:
          degreeStr.includes("โท") || degreeStr.includes("มหาบัณฑิต")
            ? checked
            : unchecked,
        degDoc:
          degreeStr.includes("เอก") || degreeStr.includes("ดุษฎีบัณฑิต")
            ? checked
            : unchecked,

        // Checkbox: ขณะนี้กำลังทำ
        workTypeThesis: (data.academicWork?.workType || "").includes(
          "วิทยานิพนธ์",
        )
          ? checked
          : unchecked,
        workTypeIS: (data.academicWork?.workType || "").includes("อิสระ")
          ? checked
          : unchecked,

        // Checkbox: มีความประสงค์
        objCollect: (data.requestDetails?.purpose || "").includes("เก็บรวบรวม")
          ? checked
          : unchecked,
        objExpert: (data.requestDetails?.purpose || "").includes("ผู้เชี่ยวชาญ")
          ? checked
          : unchecked,
        objOther:
          data.requestDetails?.purpose === "อื่นๆ" ? checked : unchecked,

        // รายชื่อกรรมการที่ปรึกษา
        adv1: val(advs[0]),
        adv2: val(advs[1]),
        adv3: val(advs[2]),
        adv4: val(advs[3]),

        // รายชื่อผู้เชี่ยวชาญด้านเนื้อหา (หน้า 2)
        cName1: val(cExp[0]?.name),
        cEdu1: val(cExp[0]?.education),
        cWork1: val(cExp[0]?.workplace),
        cName2: val(cExp[1]?.name),
        cEdu2: val(cExp[1]?.education),
        cWork2: val(cExp[1]?.workplace),
        cName3: val(cExp[2]?.name),
        cEdu3: val(cExp[2]?.education),
        cWork3: val(cExp[2]?.workplace),

        // รายชื่อผู้เชี่ยวชาญด้านเทคนิค (หน้า 2)
        tName1: val(tExp[0]?.name),
        tEdu1: val(tExp[0]?.education),
        tWork1: val(tExp[0]?.workplace),
        tName2: val(tExp[1]?.name),
        tEdu2: val(tExp[1]?.education),
        tWork2: val(tExp[1]?.workplace),
        tName3: val(tExp[2]?.name),
        tEdu3: val(tExp[2]?.education),
        tWork3: val(tExp[2]?.workplace),
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
          {/* ✅ เปลี่ยนชื่อ ref ตรงนี้ให้ตรงกับด้านบน */}
          <div
            ref={contentRef}
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

              {/* ─── แสดงรายชื่อผู้เชี่ยวชาญจาก Firebase ─── */}
              {(request.experts?.content?.length > 0 ||
                request.experts?.technical?.length > 0) && (
                <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">
                    รายชื่อผู้เชี่ยวชาญ
                  </h4>
                  <div className="space-y-3 text-sm">
                    {(request.experts?.content || [])
                      .filter((e) => e.name)
                      .map((e, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100"
                        >
                          <span className="text-[10px] font-black text-blue-500 bg-blue-100 px-2 py-0.5 rounded-md">
                            เนื้อหา
                          </span>
                          <span className="font-bold text-slate-700">
                            {e.name}
                          </span>
                        </div>
                      ))}
                    {(request.experts?.technical || [])
                      .filter((e) => e.name)
                      .map((e, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 bg-indigo-50 px-4 py-2.5 rounded-xl border border-indigo-100"
                        >
                          <span className="text-[10px] font-black text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-md">
                            เทคนิค
                          </span>
                          <span className="font-bold text-slate-700">
                            {e.name}
                          </span>
                        </div>
                      ))}
                  </div>
                </section>
              )}
            </div>

            {/* ─── ขวา: สำหรับเจ้าหน้าที่ ─── */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 h-full">
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
            {/* 🌟 ปุ่มใหม่สำหรับโหลดฟอร์มเก็บข้อมูลและแต่งตั้งผู้เชี่ยวชาญ */}
            <button
              onClick={() =>
                generateDocument(
                  "template-data-collection.docx",
                  "ขอเก็บข้อมูลและแต่งตั้งผู้เชี่ยวชาญ",
                  request,
                )
              }
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
            >
              <Download size={18} /> ฟอร์มขอเก็บข้อมูลฯ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
