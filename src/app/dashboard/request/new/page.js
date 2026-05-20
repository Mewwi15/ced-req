"use client";
import React, { useState, useRef } from "react";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  X,
  FileText,
  Download,
  ChevronDown,
  CheckCircle2,
  Clock,
  Search as SearchIcon,
  XCircle,
  User,
  Phone,
  GraduationCap,
  BookOpen,
  Briefcase,
  Layers,
} from "lucide-react";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

// ─── 🎨 Helper 1: แปลงตัวย่อเป็นคำเต็ม ───
const expandPrefix = (name) => {
  if (!name) return "-";
  let newName = name.trim();
  // แทนที่ตัวย่อ (ใส่ space เว้นวรรคเผื่อไว้ให้ด้วย)
  newName = newName.replace(/ผศ\./g, "ผู้ช่วยศาสตราจารย์ ");
  newName = newName.replace(/รศ\./g, "รองศาสตราจารย์ ");
  newName = newName.replace(/ศ\./g, "ศาสตราจารย์ ");
  return newName;
};

// ─── 🎨 Helper 2: บวกเลขที่เอกสาร +1 (รองรับทั้งอารบิกและเลขไทย) ───
const incrementDocNum = (baseDoc, incrementValue) => {
  if (incrementValue === 0) return baseDoc; // ใบแรกไม่ต้องบวก

  const thaiDigits = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];
  const thaiToArabic = (str) =>
    str.replace(/[๐-๙]/g, (d) => thaiDigits.indexOf(d));
  const arabicToThai = (numStr) =>
    String(numStr).replace(/\d/g, (d) => thaiDigits[d]);

  // 1. แปลงเป็นอารบิกชั่วคราวเพื่อคำนวณ
  const arabicDoc = thaiToArabic(baseDoc);
  const parts = arabicDoc.split("/");
  if (parts.length < 2) return baseDoc; // ถ้าแอดมินลืมพิมพ์เครื่องหมาย / ให้ส่งค่าเดิมกลับ

  // 2. ดึงตัวเลขหลังเครื่องหมาย / มาบวกเพิ่ม
  const prefix = parts[0];
  const numMatch = parts[1].match(/\d+/);
  if (!numMatch) return baseDoc;

  const baseNumber = parseInt(numMatch[0], 10);
  const newNumber = baseNumber + incrementValue;
  const restOfString = parts[1].substring(numMatch[0].length); // เผื่อมีข้อความต่อท้าย

  // 3. ประกอบกลับ (ถ้าต้นฉบับพิมพ์เลขไทยมา ก็แปลงกลับเป็นเลขไทยให้)
  const newDocStr = `${prefix}/${newNumber}${restOfString}`;
  return /[๐-๙]/.test(baseDoc) ? arabicToThai(newDocStr) : newDocStr;
};

// ─── 🎨 Helper 3: ไอคอนสถานะ ───
const StatusIcon = ({ status }) => {
  if (status === "อนุมัติแล้ว")
    return <CheckCircle2 size={18} className="text-emerald-500" />;
  if (status === "รอดำเนินการ")
    return <Clock size={18} className="text-amber-500" />;
  if (status === "กำลังตรวจสอบ")
    return <SearchIcon size={18} className="text-blue-500" />;
  if (status === "ถูกปฏิเสธ")
    return <XCircle size={18} className="text-rose-500" />;
  return null;
};

export default function RequestModal({ request, onClose, setRequests }) {
  const [docNumber, setDocNumber] = useState("อว ๐๖๐๑.๑๒/");
  const [currentStatus, setCurrentStatus] = useState(request.status);
  const [isUpdating, setIsUpdating] = useState(false);
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
      if (!response.ok) throw new Error(`ไม่พบไฟล์ ${templateFileName} ในระบบ`);

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

      const contentExperts = (data.experts?.content || []).filter(
        (e) => e.name?.trim() !== "",
      );
      const technicalExperts = (data.experts?.technical || []).filter(
        (e) => e.name?.trim() !== "",
      );

      // 🌟 นำข้อมูลสถานที่ทำงานติดไปด้วย เพื่อนำไปใช้ตอนสร้างหน้า
      const allExpertsCombined = [
        ...contentExperts.map((e) => ({
          expertName: e.name,
          expertWork: e.workplace,
          expertType: "ด้านเนื้อหา",
        })),
        ...technicalExperts.map((e) => ({
          expertName: e.name,
          expertWork: e.workplace,
          expertType: "ด้านเทคนิค",
        })),
      ];

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
      const degreeStr = data.studentInfo?.degree || "";

      // 🌟 สร้าง Array ใหม่สำหรับผู้เชี่ยวชาญ เพื่อให้ Word นำไปวนลูปสร้างหน้า
      const expertLetters = allExpertsCombined.map((exp, index) => {
        return {
          index: index + 1,
          docNumberAuto: incrementDocNum(docNumber || "อว ๐๖๐๑.๑๒/", index), // รันเลข +1
          expertNameFull: expandPrefix(exp.expertName), // แปลง ผศ. เป็น ผู้ช่วยศาสตราจารย์
          expertWorkplace: val(exp.expertWork),
          expertType: exp.expertType,
        };
      });

      docx.render({
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

        docDate: docDate,
        docMonth: docMonth,
        docYear: docYear,
        signName: val(data.studentInfo?.fullName),
        fullSignName: val(
          `${data.studentInfo?.prefix || ""}${data.studentInfo?.fullName || ""}`,
        ),
        branch: val(data.studentInfo?.department),
        address: val(data.studentInfo?.address),
        phoneWork: val(data.studentInfo?.phoneWork),
        phoneHome: val(data.studentInfo?.phoneHome),

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

        degMaster:
          degreeStr.includes("โท") || degreeStr.includes("มหาบัณฑิต")
            ? checked
            : unchecked,
        degDoc:
          degreeStr.includes("เอก") || degreeStr.includes("ดุษฎีบัณฑิต")
            ? checked
            : unchecked,
        workTypeThesis: (data.academicWork?.workType || "").includes(
          "วิทยานิพนธ์",
        )
          ? checked
          : unchecked,
        workTypeIS: (data.academicWork?.workType || "").includes("อิสระ")
          ? checked
          : unchecked,
        objCollect: (data.requestDetails?.purpose || "").includes("เก็บรวบรวม")
          ? checked
          : unchecked,
        objExpert: (data.requestDetails?.purpose || "").includes("ผู้เชี่ยวชาญ")
          ? checked
          : unchecked,
        objOther:
          data.requestDetails?.purpose === "อื่นๆ" ? checked : unchecked,

        adv1: val(advs[0]),
        adv2: val(advs[1]),
        adv3: val(advs[2]),
        adv4: val(advs[3]),
        cName1: val(cExp[0]?.name),
        cEdu1: val(cExp[0]?.degree),
        cWork1: val(cExp[0]?.workplace),
        cName2: val(cExp[1]?.name),
        cEdu2: val(cExp[1]?.degree),
        cWork2: val(cExp[1]?.workplace),
        cName3: val(cExp[2]?.name),
        cEdu3: val(cExp[2]?.degree),
        cWork3: val(cExp[2]?.workplace),
        tName1: val(tExp[0]?.name),
        tEdu1: val(tExp[0]?.degree),
        tWork1: val(tExp[0]?.workplace),
        tName2: val(tExp[1]?.name),
        tEdu2: val(tExp[1]?.degree),
        tWork2: val(tExp[1]?.workplace),
        tName3: val(tExp[2]?.name),
        tEdu3: val(tExp[2]?.degree),
        tWork3: val(tExp[2]?.workplace),

        // 🌟 ส่ง Array ชุดใหม่เข้าไปให้ Word วนลูปสร้างหน้า
        expertsList: expertLetters,
      });

      const out = docx.getZip().generate({ type: "arraybuffer" });
      const blob = new Blob([out], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      saveAs(blob, `${outputName}_${data.studentInfo?.fullName}.docx`);
    } catch (error) {
      alert(`เกิดข้อผิดพลาดในการโหลดไฟล์\n${error.message}`);
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
      alert(`ไม่สามารถระบุระดับการศึกษาจากคำว่า "${degree}" ได้`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[1100px] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden ring-1 ring-slate-900/5 max-h-[95dvh]">
        {/* ─── 🌟 Header ─── */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center">
              <Layers size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                รายละเอียดคำร้อง
              </h3>
              <p className="text-sm font-medium text-slate-500 mt-0.5 font-mono uppercase tracking-wider">
                REF: {request.id.substring(0, 8)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all active:scale-95"
          >
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* ─── 📝 Body Content ─── */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* ─── ฝั่งซ้าย: ข้อมูลนักศึกษาและคำร้อง (กว้าง 7 ส่วน) ─── */}
            <div className="xl:col-span-7 space-y-6">
              {/* Card 1: ผู้ยื่นคำร้อง */}
              <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-50 text-indigo-600 flex items-center justify-center font-black text-2xl shadow-sm shrink-0">
                    {request.studentInfo?.firstNameTH?.charAt(0) || "น"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">
                      ข้อมูลนักศึกษา
                    </p>
                    <h4 className="text-2xl font-black text-slate-800 truncate">
                      {request.studentInfo?.prefix}
                      {request.studentInfo?.fullName}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            รหัสนักศึกษา
                          </p>
                          <p className="font-bold text-slate-700 text-sm font-mono">
                            {request.studentInfo?.studentId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                          <Phone size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            เบอร์โทรศัพท์
                          </p>
                          <p className="font-bold text-slate-700 text-sm">
                            {request.studentInfo?.phoneMobile || "-"}
                          </p>
                        </div>
                      </div>
                      <div className="col-span-1 sm:col-span-2 flex items-center gap-3 mt-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                          <GraduationCap size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-emerald-600/70 uppercase">
                            ระดับการศึกษา
                          </p>
                          <p className="font-bold text-emerald-700 text-sm">
                            {request.studentInfo?.degree || "ไม่ได้ระบุ"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: รายละเอียดงานวิจัย */}
              <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
                    <BookOpen size={16} />
                  </div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                    หัวข้อและรายละเอียดงาน
                  </h4>
                </div>

                <div className="space-y-5">
                  <div>
                    <span className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                      ความประสงค์ของคำร้อง
                    </span>
                    <span className="inline-flex font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100/50 text-sm">
                      ขอ
                      {request.requestDetails?.purpose === "อื่นๆ"
                        ? request.requestDetails?.purposeOther
                        : request.requestDetails?.purpose}
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      ชื่องานวิจัย / ปริญญานิพนธ์
                    </span>
                    <p className="font-bold text-slate-800 text-sm leading-relaxed">
                      {request.academicWork?.workTitle || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: รายชื่อผู้เชี่ยวชาญ */}
              {(request.experts?.content?.length > 0 ||
                request.experts?.technical?.length > 0) && (
                <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                      <Briefcase size={16} />
                    </div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                      รายชื่อผู้เชี่ยวชาญ
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {(request.experts?.content || [])
                      .filter((e) => e.name)
                      .map((e, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 bg-blue-50/50 px-3 py-2 rounded-xl border border-blue-100/50 text-sm"
                        >
                          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                          <span className="font-bold text-slate-700">
                            {e.name}
                          </span>
                          <span className="text-[10px] font-bold text-blue-500 ml-1">
                            (เนื้อหา)
                          </span>
                        </div>
                      ))}
                    {(request.experts?.technical || [])
                      .filter((e) => e.name)
                      .map((e, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 bg-indigo-50/50 px-3 py-2 rounded-xl border border-indigo-100/50 text-sm"
                        >
                          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                          <span className="font-bold text-slate-700">
                            {e.name}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-500 ml-1">
                            (เทคนิค)
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* ─── ฝั่งขวา: โซนจัดการสำหรับ Admin (กว้าง 5 ส่วน) ─── */}
            <div className="xl:col-span-5 flex flex-col gap-6">
              {/* โซนที่ 1: การจัดการเอกสาร (Downloads) */}
              <div className="bg-slate-900 rounded-[2rem] p-6 sm:p-8 shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                <h4 className="font-black text-lg mb-6 flex items-center gap-2">
                  <FileText className="text-emerald-400" size={20} /> ออกเอกสาร
                  (Generate)
                </h4>

                <div className="space-y-3 relative z-10">
                  <button
                    onClick={() =>
                      generateDocument(
                        "template-memo.docx",
                        "บันทึกข้อความ",
                        request,
                      )
                    }
                    className="w-full flex items-center justify-between px-5 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl font-bold transition-all group"
                  >
                    <span className="flex items-center gap-3">
                      <FileText size={18} className="text-slate-300" />{" "}
                      บันทึกข้อความ (ปะหน้า)
                    </span>
                    <Download
                      size={18}
                      className="text-emerald-400 group-hover:scale-110 transition-transform"
                    />
                  </button>

                  <button
                    onClick={handleDownloadDegreeForm}
                    className="w-full flex items-center justify-between px-5 py-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 group"
                  >
                    <span className="flex items-center gap-3">
                      <FileText size={18} /> ฟอร์มคำร้องหลัก
                    </span>
                    <Download
                      size={18}
                      className="group-hover:translate-y-1 transition-transform"
                    />
                  </button>

                  <button
                    onClick={() =>
                      generateDocument(
                        "template-data-collection.docx",
                        "ขอเก็บข้อมูลและแต่งตั้งผู้เชี่ยวชาญ",
                        request,
                      )
                    }
                    className="w-full flex items-center justify-between px-5 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl font-bold transition-all group"
                  >
                    <span className="flex items-center gap-3 text-sm">
                      <FileText size={18} className="text-purple-300" />{" "}
                      ฟอร์มเก็บข้อมูล / ตั้งผู้เชี่ยวชาญ
                    </span>
                    <Download
                      size={18}
                      className="text-purple-400 group-hover:scale-110 transition-transform"
                    />
                  </button>
                </div>
              </div>

              {/* โซนที่ 2: อัปเดตสถานะ */}
              <div className="bg-white rounded-[2rem] border border-slate-200 p-6 sm:p-8 shadow-sm flex-1">
                <h4 className="font-black text-slate-800 text-lg mb-6">
                  อัปเดตสถานะคำร้อง
                </h4>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      ใส่เลขที่เอกสาร
                    </label>
                    <input
                      type="text"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      placeholder="อว ๐๖๐๑.๑๒/..."
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                      เลือกสถานะใหม่
                      {isUpdating && (
                        <span className="text-[10px] text-emerald-500 animate-pulse">
                          กำลังบันทึก...
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <select
                        value={currentStatus}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={isUpdating}
                        className={`w-full appearance-none pl-12 pr-10 py-4 border rounded-xl font-bold outline-none transition-all cursor-pointer shadow-sm disabled:opacity-50
                          ${
                            currentStatus === "อนุมัติแล้ว"
                              ? "text-emerald-700 border-emerald-200 bg-emerald-50/50 focus:ring-emerald-500/20"
                              : currentStatus === "ถูกปฏิเสธ"
                                ? "text-rose-700 border-rose-200 bg-rose-50/50 focus:ring-rose-500/20"
                                : "text-slate-700 border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-500/20"
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
        </div>
      </div>
    </div>
  );
}
