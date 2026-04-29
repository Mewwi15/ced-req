"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/lib/AuthContext";
import {
  ChevronLeft,
  ChevronRight,
  User,
  BookOpen,
  FileText,
  CheckCircle,
  Loader2,
  AlertCircle,
  Check,
  Send,
  CheckCircle2,
  Users,
  Plus,
  Trash2,
  ChevronDown,
  GraduationCap,
  MapPin,
  X,
  Search,
} from "lucide-react";

import Stepper from "@/components/Stepper";

// ─── 📍 ฐานข้อมูลรายชื่ออาจารย์ในภาควิชา ───
const ADVISOR_LIST = [
  "ผู้ช่วยศาสตราจารย์ ดร. ธัญญรัตน์ น้อมพลกรัง",
  "อาจารย์ ดร. พุทธิดา สกุลวิริยกิจกุล",
  "ผู้ช่วยศาสตราจารย์ ดร. จิรพันธุ์ ศรีสมพันธุ์",
  "อาจารย์ ดร. วิทวัส ทิพย์สุวรรณ",
  "อาจารย์ ดร. สมคิด แซ่หลี",
  "ผู้ช่วยศาสตราจารย์ ดร. สรเดช ครุฑจ้อน",
  "ผู้ช่วยศาสตราจารย์ ดร. จรัญ แสนราช",
  "ผู้ช่วยศาสตราจารย์ ดร. วรรณชัย วรรณสวัสดิ์",
  "ผู้ช่วยศาสตราจารย์ ดร. กฤช สินธนะกุล",
  "ผู้ช่วยศาสตราจารย์ ดร. สุธิดา ชัยชมชื่น",
  "ผู้ช่วยศาสตราจารย์ ดร. วาทินี นุ้ยเพียร",
  "ผู้ช่วยศาสตราจารย์ ดร. เทวา คำปาเชื้อ",
  "ผู้ช่วยศาสตราจารย์ ดร.ดวงกมล โพธิ์นาค",
  "อาจารย์ ดร. ธีราทร สมิทธิวาณิช",
  "อาจารย์ พนเมษ ญาณฐิติรัตน์",
];

// ─── 🧩 Reusable Input Component ───
const InputField = ({ label, error, readOnly, ...props }) => (
  <div className="flex flex-col w-full">
    {label && (
      <label className="mb-1.5 text-sm font-bold text-slate-700">{label}</label>
    )}
    <input
      {...props}
      readOnly={readOnly}
      className={`w-full p-3.5 border rounded-xl outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400 ${
        readOnly
          ? "bg-slate-100/70 border-slate-200 text-slate-500 focus:outline-none cursor-not-allowed shadow-inner inset-shadow-sm"
          : error
            ? "border-red-300 focus:ring-4 focus:ring-red-500/10 bg-red-50/50"
            : "bg-white border-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 hover:border-slate-300 shadow-sm"
      }`}
    />
    {error && (
      <span className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1 animate-in slide-in-from-top-1">
        <AlertCircle size={14} /> {error}
      </span>
    )}
  </div>
);

// ─── 🧩 Custom Dropdown Component ───
const CustomSelect = ({ label, options, value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="flex flex-col w-full relative" ref={wrapperRef}>
      {label && (
        <label className="mb-1.5 text-sm font-bold text-slate-700">
          {label}
        </label>
      )}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full p-3.5 border rounded-xl flex justify-between items-center transition-all ${
          disabled
            ? "bg-slate-100/70 border-slate-200 text-slate-500 cursor-not-allowed"
            : "bg-white border-slate-200 hover:border-slate-300 cursor-pointer shadow-sm focus:ring-4 focus:ring-emerald-500/10"
        } ${isOpen ? "border-emerald-500 ring-4 ring-emerald-500/10" : ""}`}
      >
        <span
          className={`font-medium ${selectedOption ? "text-slate-800" : "text-slate-400"}`}
        >
          {selectedOption ? selectedOption.label : "กรุณาเลือก..."}
        </span>
        <ChevronDown
          size={18}
          className={`text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-emerald-500" : ""}`}
        />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full top-[calc(100%+8px)] bg-white border border-slate-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-xl py-2 animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto custom-scrollbar">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${
                value === opt.value
                  ? "bg-emerald-50 text-emerald-700 font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
              }`}
            >
              {opt.label}
              {value === opt.value && (
                <Check size={16} className="text-emerald-600" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function NewRequestPage() {
  const router = useRouter();

  // 📍 ดึงข้อมูล User จาก AuthContext
  const { user, userProfile } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});

  // State สำหรับจัดการ Modal เลือกอาจารย์ที่ปรึกษา
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);
  const [currentEditingAdvisor, setCurrentEditingAdvisor] = useState(null);
  const [advisorSearchQuery, setAdvisorSearchQuery] = useState("");

  const steps = [
    "ข้อมูลส่วนตัว",
    "งานวิชาการ",
    "ความประสงค์",
    "ผู้เชี่ยวชาญ",
    "ตรวจสอบ",
  ];

  // 📍 ดึงค่าเริ่มต้นลง State ทันที โดยใช้ข้อมูลจาก userProfile
  const [formData, setFormData] = useState({
    docType: "บันทึกข้อความขอความอนุเคราะห์",
    studentInfo: {
      prefix: userProfile?.prefix || "นาย",
      fullName:
        `${userProfile?.firstNameTH || ""} ${userProfile?.lastNameTH || ""}`.trim(),
      studentId: userProfile?.studentId || "",
      degree: "ครุศาสตร์อุตสาหกรรมบัณฑิต",
      department: "เทคโนโลยีคอมพิวเตอร์",
      major: "ไม่มี",
      studyPlan: "",
      address: "",
      phoneMobile: userProfile?.phoneNumber || "",
    },
    academicWork: {
      workType: "ปริญญานิพนธ์",
      workTitle: "",
      advisors: [{ selection: "", custom: "" }],
    },
    requestDetails: {
      purpose: "เก็บรวบรวมข้อมูล",
      purposeOther: "",
      attachments: {
        hasQuestionnaire: false,
        questionnaireQty: "",
        hasEvalForm: false,
        evalFormQty: "",
        hasExpertList: false,
      },
    },
    experts: {
      content: [{ name: "", degree: "", workplace: "" }],
      technical: [{ name: "", degree: "", workplace: "" }],
    },
  });

  const clearError = (field) =>
    setErrors((prev) => ({ ...prev, [field]: null }));

  const updateStudent = (field, value) => {
    setFormData((p) => ({
      ...p,
      studentInfo: { ...p.studentInfo, [field]: value },
    }));
    clearError(field);
  };

  const updateAcademic = (field, value) => {
    setFormData((p) => ({
      ...p,
      academicWork: { ...p.academicWork, [field]: value },
    }));
    clearError(field);
  };

  const updateAdvisor = (index, field, value) => {
    const newAdvisors = [...formData.academicWork.advisors];
    newAdvisors[index][field] = value;
    if (field === "selection" && value !== "อื่นๆ") {
      newAdvisors[index].custom = "";
    }
    updateAcademic("advisors", newAdvisors);
    if (index === 0) clearError("advisor0");
  };

  const handleAddAdvisor = () => {
    updateAcademic("advisors", [
      ...formData.academicWork.advisors,
      { selection: "", custom: "" },
    ]);
  };

  const handleRemoveAdvisor = (index) => {
    updateAcademic(
      "advisors",
      formData.academicWork.advisors.filter((_, i) => i !== index),
    );
  };

  const updateRequest = (field, value) => {
    setFormData((p) => ({
      ...p,
      requestDetails: { ...p.requestDetails, [field]: value },
    }));
    clearError(field);
  };

  const updateAttachment = (field, value) => {
    setFormData((p) => ({
      ...p,
      requestDetails: {
        ...p.requestDetails,
        attachments: { ...p.requestDetails.attachments, [field]: value },
      },
    }));
    clearError(field);
  };

  const handleDegreeChange = (value) => {
    const newDegree = value;
    let newDepartment = "เทคโนโลยีคอมพิวเตอร์";
    let newMajor = "ไม่มี";
    let newStudyPlan = "";
    let newWorkType = "ปริญญานิพนธ์";

    if (newDegree === "ครุศาสตร์อุตสาหกรรมมหาบัณฑิต") {
      newMajor = "เทคโนโลยีคอมพิวเตอร์";
      newStudyPlan = "แผน ก (รอบเช้า)";
      newWorkType = "วิทยานิพนธ์";
    } else if (newDegree === "ครุศาสตร์อุตสาหกรรมดุษฎีบัณฑิต") {
      newMajor = "เทคโนโลยีคอมพิวเตอร์";
      newWorkType = "วิทยานิพนธ์";
    }

    setFormData((prev) => ({
      ...prev,
      studentInfo: {
        ...prev.studentInfo,
        degree: newDegree,
        department: newDepartment,
        major: newMajor,
        studyPlan: newStudyPlan,
      },
      academicWork: {
        ...prev.academicWork,
        workType: newWorkType,
      },
    }));
  };

  const handleAddExpert = (type) => {
    setFormData((prev) => ({
      ...prev,
      experts: {
        ...prev.experts,
        [type]: [
          ...prev.experts[type],
          { name: "", degree: "", workplace: "" },
        ],
      },
    }));
  };

  const handleRemoveExpert = (type, index) => {
    setFormData((prev) => ({
      ...prev,
      experts: {
        ...prev.experts,
        [type]: prev.experts[type].filter((_, i) => i !== index),
      },
    }));
  };

  const handleUpdateExpert = (type, index, field, value) => {
    setFormData((prev) => {
      const updatedExperts = [...prev.experts[type]];
      updatedExperts[index] = { ...updatedExperts[index], [field]: value };
      return { ...prev, experts: { ...prev.experts, [type]: updatedExperts } };
    });
    setErrors((prev) => ({ ...prev, [`${type}_${index}_${field}`]: null }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    let isValid = true;

    if (step === 1) {
      if (!formData.studentInfo.phoneMobile.trim())
        newErrors.phoneMobile = "กรุณากรอกเบอร์โทรศัพท์";
      if (!formData.studentInfo.address.trim())
        newErrors.address = "กรุณากรอกที่อยู่ให้ครบถ้วน";
    } else if (step === 2) {
      if (!formData.academicWork.workTitle.trim())
        newErrors.workTitle = "กรุณากรอกชื่อเรื่องวิชาการ";

      const firstAdv = formData.academicWork.advisors[0];
      if (
        !firstAdv.selection ||
        (firstAdv.selection === "อื่นๆ" && !firstAdv.custom.trim())
      ) {
        newErrors.advisor0 = "กรุณาระบุอาจารย์ที่ปรึกษาอย่างน้อย 1 ท่าน";
      }
    } else if (step === 3) {
      if (
        formData.requestDetails.purpose === "อื่นๆ" &&
        !formData.requestDetails.purposeOther.trim()
      ) {
        newErrors.purposeOther = "กรุณาระบุความประสงค์อื่นๆ";
      }
      if (
        formData.requestDetails.attachments.hasQuestionnaire &&
        !formData.requestDetails.attachments.questionnaireQty
      ) {
        newErrors.questionnaireQty = "โปรดระบุจำนวนชุด";
      }
      if (
        formData.requestDetails.attachments.hasEvalForm &&
        !formData.requestDetails.attachments.evalFormQty
      ) {
        newErrors.evalFormQty = "โปรดระบุจำนวนชุด";
      }
    } else if (step === 4) {
      formData.experts.content.forEach((expert, i) => {
        if (
          !expert.name.trim() ||
          !expert.degree.trim() ||
          !expert.workplace.trim()
        ) {
          if (!expert.name.trim())
            newErrors[`content_${i}_name`] = "กรุณากรอกชื่อ-นามสกุล";
          if (!expert.degree.trim())
            newErrors[`content_${i}_degree`] = "กรุณากรอกวุฒิการศึกษา";
          if (!expert.workplace.trim())
            newErrors[`content_${i}_workplace`] = "กรุณากรอกสถานที่ทำงาน";
          isValid = false;
        }
      });
      formData.experts.technical.forEach((expert, i) => {
        if (
          !expert.name.trim() ||
          !expert.degree.trim() ||
          !expert.workplace.trim()
        ) {
          if (!expert.name.trim())
            newErrors[`technical_${i}_name`] = "กรุณากรอกชื่อ-นามสกุล";
          if (!expert.degree.trim())
            newErrors[`technical_${i}_degree`] = "กรุณากรอกวุฒิการศึกษา";
          if (!expert.workplace.trim())
            newErrors[`technical_${i}_workplace`] = "กรุณากรอกสถานที่ทำงาน";
          isValid = false;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && isValid;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    setIsSubmitting(true);
    try {
      const finalAdvisors = formData.academicWork.advisors
        .map((a) => (a.selection === "อื่นๆ" ? a.custom : a.selection))
        .filter((name) => name && name.trim() !== "");

      const submitData = {
        ...formData,
        academicWork: {
          ...formData.academicWork,
          advisors: finalAdvisors,
        },
        userId: user?.uid,
        status: "รอดำเนินการ",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "requests"), submitData);
      setIsSuccess(true);
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("เกิดข้อผิดพลาดในการส่งคำร้อง");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-6 mt-16 animate-in fade-in duration-500">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-xl text-center max-w-lg w-full border border-slate-100">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={50} strokeWidth={3} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-3">
            ส่งคำร้องสำเร็จ!
          </h2>
          <p className="text-slate-500 mb-8 font-medium leading-relaxed">
            คำร้องของคุณถูกส่งเข้าระบบเรียบร้อยแล้ว
            <br />
            คุณสามารถติดตามสถานะได้ที่หน้าประวัติคำร้อง
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all active:scale-95"
          >
            กลับสู่หน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  const workTypeOptions = [
    "ปริญญานิพนธ์",
    "วิทยานิพนธ์",
    "ค้นคว้าอิสระ/สารนิพนธ์",
  ];

  const advisorOptions = [
    ...ADVISOR_LIST.map((name) => ({ label: name, value: name })),
    { label: "อื่นๆ (ระบุชื่อบุคคลภายนอก)", value: "อื่นๆ" },
  ];

  const filteredAdvisorOptions = advisorOptions.filter((opt) =>
    opt.label.toLowerCase().includes(advisorSearchQuery.toLowerCase()),
  );

  return (
    <>
      <div className="p-4 sm:p-8 lg:p-10 max-w-5xl mx-auto w-full flex-1">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            สร้างคำร้องใหม่
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            กรอกข้อมูลเพื่อจัดทำบันทึกข้อความขอความอนุเคราะห์
          </p>
        </div>

        <Stepper currentStep={currentStep} steps={steps} />

        <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 sm:p-10 lg:p-12 relative overflow-hidden min-h-[500px] flex flex-col">
          <div className="flex-1">
            {/* ─── STEP 1 ─── */}
            {currentStep === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                <div className="bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                    <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                      <User size={20} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">
                      ข้อมูลผู้ยื่นคำร้อง
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InputField
                      label="ชื่อ-นามสกุล (ดึงอัตโนมัติ)"
                      value={`${formData.studentInfo.prefix}${formData.studentInfo.fullName}`}
                      readOnly
                    />
                    <InputField
                      label="รหัสนักศึกษา (ดึงอัตโนมัติ)"
                      value={formData.studentInfo.studentId}
                      readOnly
                    />
                    <InputField
                      label="เบอร์โทรศัพท์มือถือ"
                      value={formData.studentInfo.phoneMobile}
                      onChange={(e) =>
                        updateStudent("phoneMobile", e.target.value)
                      }
                      error={errors.phoneMobile}
                      placeholder="08X-XXX-XXXX"
                    />
                  </div>
                </div>

                <div className="bg-blue-50/30 p-6 sm:p-8 rounded-3xl border border-blue-100/50">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-blue-100">
                    <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                      <GraduationCap size={20} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">
                      ข้อมูลหลักสูตรและการศึกษา
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-20">
                    <CustomSelect
                      label="ระดับการศึกษา"
                      value={formData.studentInfo.degree}
                      onChange={handleDegreeChange}
                      options={[
                        {
                          label: "ปริญญาตรี (ครุศาสตร์อุตสาหกรรมบัณฑิต)",
                          value: "ครุศาสตร์อุตสาหกรรมบัณฑิต",
                        },
                        {
                          label: "ปริญญาโท (ครุศาสตร์อุตสาหกรรมมหาบัณฑิต)",
                          value: "ครุศาสตร์อุตสาหกรรมมหาบัณฑิต",
                        },
                        {
                          label: "ปริญญาเอก (ครุศาสตร์อุตสาหกรรมดุษฎีบัณฑิต)",
                          value: "ครุศาสตร์อุตสาหกรรมดุษฎีบัณฑิต",
                        },
                      ]}
                    />

                    <CustomSelect
                      label="สาขาวิชา"
                      value={formData.studentInfo.department}
                      onChange={(val) => updateStudent("department", val)}
                      options={[
                        {
                          label: "เทคโนโลยีคอมพิวเตอร์",
                          value: "เทคโนโลยีคอมพิวเตอร์",
                        },
                        {
                          label: "คอมพิวเตอร์ศึกษา",
                          value: "คอมพิวเตอร์ศึกษา",
                        },
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 relative z-10">
                    {formData.studentInfo.degree ===
                      "ครุศาสตร์อุตสาหกรรมมหาบัณฑิต" ||
                    formData.studentInfo.degree ===
                      "ครุศาสตร์อุตสาหกรรมดุษฎีบัณฑิต" ? (
                      <CustomSelect
                        label="แขนงวิชา"
                        value={formData.studentInfo.major}
                        onChange={(val) => updateStudent("major", val)}
                        options={[
                          {
                            label: "เทคโนโลยีคอมพิวเตอร์",
                            value: "เทคโนโลยีคอมพิวเตอร์",
                          },
                          {
                            label: "คอมพิวเตอร์ศึกษา",
                            value: "คอมพิวเตอร์ศึกษา",
                          },
                        ]}
                      />
                    ) : (
                      <InputField
                        label="แขนงวิชา"
                        value={formData.studentInfo.major}
                        readOnly
                      />
                    )}

                    {formData.studentInfo.degree ===
                    "ครุศาสตร์อุตสาหกรรมมหาบัณฑิต" ? (
                      <CustomSelect
                        label="แผนการศึกษา"
                        value={formData.studentInfo.studyPlan}
                        onChange={(val) => updateStudent("studyPlan", val)}
                        options={[
                          {
                            label: "แผน ก (รอบเช้า)",
                            value: "แผน ก (รอบเช้า)",
                          },
                          {
                            label: "แผน ข (รอบเช้า)",
                            value: "แผน ข (รอบเช้า)",
                          },
                        ]}
                      />
                    ) : (
                      <div className="hidden sm:block"></div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                    <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
                      <MapPin size={20} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">
                      ที่อยู่ที่ติดต่อได้สะดวก
                    </h3>
                  </div>

                  <div className="flex flex-col w-full">
                    <textarea
                      rows={3}
                      placeholder="บ้านเลขที่ ซอย ถนน แขวง เขต จังหวัด รหัสไปรษณีย์"
                      value={formData.studentInfo.address}
                      onChange={(e) => updateStudent("address", e.target.value)}
                      className={`w-full p-4 bg-white border rounded-xl outline-none transition-all font-medium text-slate-800 resize-none shadow-sm ${errors.address ? "border-red-300 focus:ring-4 focus:ring-red-500/10 bg-red-50/50" : "border-slate-200 hover:border-slate-300 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"}`}
                    />
                    {errors.address && (
                      <span className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1 animate-in slide-in-from-top-1">
                        <AlertCircle size={14} /> {errors.address}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP 2 ─── */}
            {currentStep === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                    <BookOpen size={22} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">
                    รายละเอียดงานวิชาการ
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {workTypeOptions.map((type) => (
                    <label
                      key={type}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.academicWork.workType === type ? "border-emerald-500 bg-emerald-50" : "border-slate-100 hover:border-emerald-200"}`}
                    >
                      <input
                        type="radio"
                        className="hidden"
                        checked={formData.academicWork.workType === type}
                        onChange={() => updateAcademic("workType", type)}
                      />
                      <div
                        className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${formData.academicWork.workType === type ? "border-emerald-500" : "border-slate-300"}`}
                      >
                        <div
                          className={`w-2.5 h-2.5 rounded-full bg-emerald-500 transition-transform ${formData.academicWork.workType === type ? "scale-100" : "scale-0"}`}
                        ></div>
                      </div>
                      <span
                        className={`font-bold text-sm sm:text-base ${formData.academicWork.workType === type ? "text-emerald-700" : "text-slate-600"}`}
                      >
                        {type}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="space-y-1.5 flex flex-col w-full">
                  <label className="text-sm font-bold text-slate-700">
                    ชื่อเรื่อง (ภาษาไทย หรือ ภาษาอังกฤษ)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="ระบุชื่อเรื่องงานวิชาการของคุณ..."
                    value={formData.academicWork.workTitle}
                    onChange={(e) =>
                      updateAcademic("workTitle", e.target.value)
                    }
                    className={`w-full p-4 bg-white border rounded-xl outline-none transition-all font-medium text-slate-800 resize-none shadow-sm ${errors.workTitle ? "border-red-300 focus:ring-4 focus:ring-red-500/10 bg-red-50/50" : "border-slate-200 hover:border-slate-300 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"}`}
                  />
                  {errors.workTitle && (
                    <span className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1">
                      <AlertCircle size={14} /> {errors.workTitle}
                    </span>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-slate-700">
                      คณะกรรมการที่ปรึกษา (อย่างน้อย 1 ท่าน)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddAdvisor}
                      className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus size={16} /> เพิ่มท่านอื่น
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.academicWork.advisors.map((advisor, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-3 p-5 border border-slate-200 rounded-xl bg-slate-50 relative"
                      >
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAdvisor(index)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors z-10"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}

                        <div className="flex flex-col w-full">
                          <label className="mb-1.5 text-sm font-bold text-slate-700">
                            ที่ปรึกษาท่านที่ {index + 1}
                          </label>
                          <div
                            onClick={() => {
                              setCurrentEditingAdvisor(index);
                              setAdvisorSearchQuery("");
                              setIsAdvisorModalOpen(true);
                            }}
                            className={`w-full p-3.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-emerald-400 shadow-sm flex items-center justify-between transition-all ${index > 0 ? "pr-10" : ""}`}
                          >
                            <span
                              className={`font-medium line-clamp-1 ${advisor.selection ? "text-slate-800" : "text-slate-400"}`}
                            >
                              {advisor.selection
                                ? advisor.selection
                                : "คลิกเพื่อเลือกชื่ออาจารย์..."}
                            </span>
                            <ChevronDown
                              size={18}
                              className="text-slate-400 shrink-0"
                            />
                          </div>
                        </div>

                        {advisor.selection === "อื่นๆ" && (
                          <div className="animate-in slide-in-from-top-2">
                            <InputField
                              placeholder="ระบุ คำนำหน้า ชื่อ นามสกุล ของอาจารย์ที่ปรึกษา"
                              value={advisor.custom}
                              onChange={(e) =>
                                updateAdvisor(index, "custom", e.target.value)
                              }
                              error={
                                index === 0 &&
                                errors.advisor0 &&
                                !advisor.custom.trim()
                                  ? errors.advisor0
                                  : null
                              }
                            />
                          </div>
                        )}

                        {index === 0 &&
                          errors.advisor0 &&
                          advisor.selection !== "อื่นๆ" &&
                          !advisor.selection && (
                            <span className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1">
                              <AlertCircle size={14} /> {errors.advisor0}
                            </span>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP 3 ─── */}
            {currentStep === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
                    <FileText size={22} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">
                    ความประสงค์และเอกสารแนบ
                  </h2>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    จุดประสงค์หลักที่ต้องการให้ออกหนังสือ
                  </label>
                  {["เก็บรวบรวมข้อมูล", "แต่งตั้งผู้เชี่ยวชาญ", "อื่นๆ"].map(
                    (purpose) => (
                      <label
                        key={purpose}
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${formData.requestDetails.purpose === purpose ? "border-emerald-500 bg-emerald-50 shadow-sm ring-1 ring-emerald-500" : "border-slate-200 hover:border-emerald-300"}`}
                      >
                        <input
                          type="radio"
                          className="hidden"
                          checked={formData.requestDetails.purpose === purpose}
                          onChange={() => updateRequest("purpose", purpose)}
                        />
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.requestDetails.purpose === purpose ? "border-emerald-500" : "border-slate-300"}`}
                        >
                          <div
                            className={`w-2.5 h-2.5 rounded-full bg-emerald-500 transition-transform ${formData.requestDetails.purpose === purpose ? "scale-100" : "scale-0"}`}
                          ></div>
                        </div>
                        <span
                          className={`font-bold ${formData.requestDetails.purpose === purpose ? "text-emerald-700" : "text-slate-600"}`}
                        >
                          ขอ{purpose}
                        </span>
                      </label>
                    ),
                  )}
                  {formData.requestDetails.purpose === "อื่นๆ" && (
                    <div className="pl-12 pt-2 animate-in slide-in-from-top-2">
                      <InputField
                        placeholder="โปรดระบุความประสงค์อื่นๆ..."
                        value={formData.requestDetails.purposeOther}
                        onChange={(e) =>
                          updateRequest("purposeOther", e.target.value)
                        }
                        error={errors.purposeOther}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-4 pt-4">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    สิ่งที่ส่งมาด้วย (ถ้ามี)
                  </label>
                  {/* แบบสอบถาม */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <label className="flex items-center gap-3 cursor-pointer group min-w-[200px]">
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={
                          formData.requestDetails.attachments.hasQuestionnaire
                        }
                        onChange={(e) =>
                          updateAttachment("hasQuestionnaire", e.target.checked)
                        }
                      />
                      <div
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${formData.requestDetails.attachments.hasQuestionnaire ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 bg-slate-50 group-hover:border-emerald-400"}`}
                      >
                        {formData.requestDetails.attachments
                          .hasQuestionnaire && (
                          <Check size={16} strokeWidth={3} />
                        )}
                      </div>
                      <span className="font-bold text-slate-700">
                        แบบสอบถาม
                      </span>
                    </label>
                    {formData.requestDetails.attachments.hasQuestionnaire && (
                      <div className="flex items-center gap-2 pl-9 sm:pl-0 animate-in slide-in-from-left-2">
                        <span className="text-sm font-bold text-slate-500">
                          จำนวน:
                        </span>
                        <input
                          type="number"
                          className={`w-20 p-2 border rounded-lg text-center outline-none font-bold text-slate-700 ${errors.questionnaireQty ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-emerald-500"}`}
                          value={
                            formData.requestDetails.attachments.questionnaireQty
                          }
                          onChange={(e) =>
                            updateAttachment("questionnaireQty", e.target.value)
                          }
                        />
                        <span className="text-sm font-bold text-slate-500">
                          ชุด
                        </span>
                      </div>
                    )}
                  </div>
                  {/* แบบประเมิน */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <label className="flex items-center gap-3 cursor-pointer group min-w-[200px]">
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={
                          formData.requestDetails.attachments.hasEvalForm
                        }
                        onChange={(e) =>
                          updateAttachment("hasEvalForm", e.target.checked)
                        }
                      />
                      <div
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${formData.requestDetails.attachments.hasEvalForm ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 bg-slate-50 group-hover:border-emerald-400"}`}
                      >
                        {formData.requestDetails.attachments.hasEvalForm && (
                          <Check size={16} strokeWidth={3} />
                        )}
                      </div>
                      <span className="font-bold text-slate-700">
                        แบบประเมิน
                      </span>
                    </label>
                    {formData.requestDetails.attachments.hasEvalForm && (
                      <div className="flex items-center gap-2 pl-9 sm:pl-0 animate-in slide-in-from-left-2">
                        <span className="text-sm font-bold text-slate-500">
                          จำนวน:
                        </span>
                        <input
                          type="number"
                          className={`w-20 p-2 border rounded-lg text-center outline-none font-bold text-slate-700 ${errors.evalFormQty ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-emerald-500"}`}
                          value={
                            formData.requestDetails.attachments.evalFormQty
                          }
                          onChange={(e) =>
                            updateAttachment("evalFormQty", e.target.value)
                          }
                        />
                        <span className="text-sm font-bold text-slate-500">
                          ชุด
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP 4 ─── */}
            {currentStep === 4 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                      <Users size={22} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">
                      รายนามผู้เชี่ยวชาญ
                    </h2>
                  </div>
                </div>
                {/* ผู้เชี่ยวชาญด้านเนื้อหา */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-lg">
                      ผู้เชี่ยวชาญด้านเนื้อหา
                    </h3>
                    <button
                      onClick={() => handleAddExpert("content")}
                      className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus size={16} /> เพิ่ม
                    </button>
                  </div>
                  <div className="space-y-4">
                    {formData.experts.content.map((expert, index) => (
                      <div
                        key={index}
                        className="bg-slate-50 border border-slate-200 p-5 rounded-2xl relative"
                      >
                        {formData.experts.content.length > 0 && (
                          <button
                            onClick={() => handleRemoveExpert("content", index)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <InputField
                              label={`ชื่อ-นามสกุล (ท่านที่ ${index + 1})`}
                              placeholder="ระบุ คำนำหน้า ชื่อ นามสกุล"
                              value={expert.name}
                              onChange={(e) =>
                                handleUpdateExpert(
                                  "content",
                                  index,
                                  "name",
                                  e.target.value,
                                )
                              }
                              error={errors[`content_${index}_name`]}
                            />
                          </div>
                          <InputField
                            label="วุฒิการศึกษา"
                            placeholder="เช่น ปร.ด. (วิทยาการคอมพิวเตอร์)"
                            value={expert.degree}
                            onChange={(e) =>
                              handleUpdateExpert(
                                "content",
                                index,
                                "degree",
                                e.target.value,
                              )
                            }
                            error={errors[`content_${index}_degree`]}
                          />
                          <InputField
                            label="สถานที่ทำงาน"
                            placeholder="เช่น มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ"
                            value={expert.workplace}
                            onChange={(e) =>
                              handleUpdateExpert(
                                "content",
                                index,
                                "workplace",
                                e.target.value,
                              )
                            }
                            error={errors[`content_${index}_workplace`]}
                          />
                        </div>
                      </div>
                    ))}
                    {formData.experts.content.length === 0 && (
                      <p className="text-center text-slate-400 text-sm py-4 border-2 border-dashed border-slate-200 rounded-xl">
                        ไม่มีผู้เชี่ยวชาญด้านเนื้อหา
                        (กดปุ่มเพิ่มด้านบนหากต้องการระบุ)
                      </p>
                    )}
                  </div>
                </div>
                {/* ผู้เชี่ยวชาญด้านเทคนิค */}
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-lg">
                      ผู้เชี่ยวชาญด้านเทคนิค
                    </h3>
                    <button
                      onClick={() => handleAddExpert("technical")}
                      className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus size={16} /> เพิ่ม
                    </button>
                  </div>
                  <div className="space-y-4">
                    {formData.experts.technical.map((expert, index) => (
                      <div
                        key={index}
                        className="bg-slate-50 border border-slate-200 p-5 rounded-2xl relative"
                      >
                        {formData.experts.technical.length > 0 && (
                          <button
                            onClick={() =>
                              handleRemoveExpert("technical", index)
                            }
                            className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <InputField
                              label={`ชื่อ-นามสกุล (ท่านที่ ${index + 1})`}
                              placeholder="ระบุ คำนำหน้า ชื่อ นามสกุล"
                              value={expert.name}
                              onChange={(e) =>
                                handleUpdateExpert(
                                  "technical",
                                  index,
                                  "name",
                                  e.target.value,
                                )
                              }
                              error={errors[`technical_${index}_name`]}
                            />
                          </div>
                          <InputField
                            label="วุฒิการศึกษา"
                            placeholder="เช่น ปร.ด. (วิทยาการคอมพิวเตอร์)"
                            value={expert.degree}
                            onChange={(e) =>
                              handleUpdateExpert(
                                "technical",
                                index,
                                "degree",
                                e.target.value,
                              )
                            }
                            error={errors[`technical_${index}_degree`]}
                          />
                          <InputField
                            label="สถานที่ทำงาน"
                            placeholder="บริษัท Tech จำกัด"
                            value={expert.workplace}
                            onChange={(e) =>
                              handleUpdateExpert(
                                "technical",
                                index,
                                "workplace",
                                e.target.value,
                              )
                            }
                            error={errors[`technical_${index}_workplace`]}
                          />
                        </div>
                      </div>
                    ))}
                    {formData.experts.technical.length === 0 && (
                      <p className="text-center text-slate-400 text-sm py-4 border-2 border-dashed border-slate-200 rounded-xl">
                        ไม่มีผู้เชี่ยวชาญด้านเทคนิค
                        (กดปุ่มเพิ่มด้านบนหากต้องการระบุ)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP 5 ─── */}
            {currentStep === 5 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
                    <CheckCircle size={22} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">
                    ตรวจสอบความถูกต้อง
                  </h2>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex gap-4">
                  <AlertCircle className="text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-800 font-medium leading-relaxed">
                    กรุณาตรวจสอบข้อมูลด้านล่างให้ถูกต้องก่อนกดยืนยัน
                    หากพบข้อผิดพลาดสามารถกดย้อนกลับเพื่อแก้ไขได้
                  </p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 space-y-4">
                  <div className="grid grid-cols-3 border-b border-slate-200 pb-4">
                    <span className="text-slate-500 font-bold text-sm">
                      ผู้ยื่นคำร้อง
                    </span>
                    <span className="col-span-2 font-bold text-slate-800">
                      {formData.studentInfo.prefix}
                      {formData.studentInfo.fullName}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-200 pb-4">
                    <span className="text-slate-500 font-bold text-sm">
                      การศึกษา
                    </span>
                    <span className="col-span-2 font-bold text-slate-800">
                      {formData.studentInfo.degree} <br />
                      <span className="text-slate-500 text-sm font-medium">
                        สาขาวิชา:
                      </span>{" "}
                      {formData.studentInfo.department} <br />
                      <span className="text-slate-500 text-sm font-medium">
                        แขนงวิชา:
                      </span>{" "}
                      {formData.studentInfo.major}
                      {formData.studentInfo.degree ===
                        "ครุศาสตร์อุตสาหกรรมมหาบัณฑิต" &&
                        formData.studentInfo.studyPlan && (
                          <>
                            <br />
                            <span className="text-blue-500 text-sm font-medium">
                              แผนการศึกษา:
                            </span>{" "}
                            <span className="text-blue-700">
                              {formData.studentInfo.studyPlan}
                            </span>
                          </>
                        )}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-200 pb-4">
                    <span className="text-slate-500 font-bold text-sm">
                      เรื่อง ({formData.academicWork.workType})
                    </span>
                    <span className="col-span-2 font-bold text-slate-800">
                      {formData.academicWork.workTitle}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-200 pb-4">
                    <span className="text-slate-500 font-bold text-sm">
                      ความประสงค์
                    </span>
                    <span className="col-span-2 font-bold text-emerald-700">
                      ขอ
                      {formData.requestDetails.purpose === "อื่นๆ"
                        ? formData.requestDetails.purposeOther
                        : formData.requestDetails.purpose}
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-500 font-bold text-sm">
                      ผู้เชี่ยวชาญ
                    </span>
                    <span className="col-span-2 font-bold text-slate-800">
                      ด้านเนื้อหา:{" "}
                      {formData.experts.content.filter((e) => e.name).length}{" "}
                      ท่าน
                      <br />
                      ด้านเทคนิค:{" "}
                      {
                        formData.experts.technical.filter((e) => e.name).length
                      }{" "}
                      ท่าน
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── ปุ่ม Navigation ด้านล่าง ─── */}
          <div className="flex justify-between mt-12 pt-8 border-t border-slate-100">
            <button
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold transition-all ${currentStep === 1 ? "opacity-0 pointer-events-none" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}
            >
              <ChevronLeft size={20} /> ย้อนกลับ
            </button>

            {currentStep < 5 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all active:scale-95"
              >
                ถัดไป <ChevronRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-70 group"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />{" "}
                    กำลังส่งคำร้อง...
                  </>
                ) : (
                  <>
                    <Send
                      size={18}
                      className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform"
                    />{" "}
                    ยืนยันการส่งคำร้อง
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── 📍 MODAL ค้นหาและเลือกอาจารย์ที่ปรึกษา ─── */}
      {isAdvisorModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800">
                เลือกอาจารย์ที่ปรึกษา
              </h3>
              <button
                onClick={() => setIsAdvisorModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-800 bg-white shadow-sm border border-slate-200 hover:bg-slate-50 rounded-full transition-colors"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search size={18} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="ค้นหาชื่ออาจารย์..."
                  value={advisorSearchQuery}
                  onChange={(e) => setAdvisorSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 custom-scrollbar space-y-2 bg-slate-50/30">
              {filteredAdvisorOptions.length > 0 ? (
                filteredAdvisorOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      updateAdvisor(
                        currentEditingAdvisor,
                        "selection",
                        opt.value,
                      );
                      setIsAdvisorModalOpen(false);
                    }}
                    className={`w-full text-left px-5 py-4 rounded-xl transition-all font-medium flex items-center justify-between group ${
                      formData.academicWork.advisors[currentEditingAdvisor]
                        ?.selection === opt.value
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
                        : "bg-white text-slate-700 border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md"
                    }`}
                  >
                    <span className="line-clamp-1 pr-4">{opt.label}</span>
                    {formData.academicWork.advisors[currentEditingAdvisor]
                      ?.selection === opt.value ? (
                      <Check
                        size={20}
                        strokeWidth={3}
                        className="text-emerald-600 shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-emerald-300 shrink-0"></div>
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <FileText size={40} className="mx-auto mb-3 opacity-20" />
                  <p className="font-medium">ไม่พบชื่ออาจารย์ที่ค้นหา</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
