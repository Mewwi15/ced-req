/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";

//

const InputField = ({ label, isPassword, ...props }) => {
  const [show, setShow] = useState(false);
  const inputType = isPassword
    ? show
      ? "text"
      : "password"
    : props.type || "text";

  return (
    <div className="space-y-1.5 w-full">
      <label className="block text-[13px] font-bold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          type={inputType}
          className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl border border-transparent focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-700 text-sm font-medium placeholder:text-slate-400"
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
};

const SelectField = ({ label, options, ...props }) => {
  return (
    <div className="space-y-1.5 w-full">
      <label className="block text-[13px] font-bold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <select
          className="w-full pl-4 pr-10 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl border border-transparent focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-700 text-sm font-medium appearance-none cursor-pointer"
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </div>
      </div>
    </div>
  );
};

// ─── 🎨 Helper: Checklist Item ───
const ValidationItem = ({ isValid, text }) => (
  <div className="flex items-center gap-1.5 text-[11px] font-medium transition-colors duration-300">
    {isValid ? (
      <CheckCircle2 className="text-emerald-500" size={14} />
    ) : (
      <XCircle className="text-slate-300" size={14} />
    )}
    <span className={isValid ? "text-emerald-700" : "text-slate-400"}>
      {text}
    </span>
  </div>
);

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    prefix: "นาย",
    firstNameTH: "",
    lastNameTH: "",
    studentId: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const hasLength = formData.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(formData.password);
  const hasLowercase = /[a-z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);

  const isPasswordSecure =
    hasLength && hasUppercase && hasLowercase && hasNumber;
  const isPasswordMatch =
    formData.password !== "" && formData.password === formData.confirmPassword;

  const strengthScore = [
    hasLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
  ].filter(Boolean).length;
  const strengthPercentage = (strengthScore / 4) * 100;

  let strengthColor = "bg-slate-200";
  if (strengthScore === 1 || strengthScore === 2)
    strengthColor = "bg-orange-400";
  else if (strengthScore === 3) strengthColor = "bg-amber-400";
  else if (strengthScore === 4) strengthColor = "bg-emerald-500";

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!isPasswordSecure || !isPasswordMatch) {
      setError("กรุณาตั้งรหัสผ่านให้ปลอดภัยและตรงกัน");
      setIsLoading(false);
      return;
    }

    if (formData.studentId.length < 13) {
      setError("รหัสนักศึกษาต้องครบ 13 หลัก");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: formData.email,
        prefix: formData.prefix,
        firstNameTH: formData.firstNameTH,
        lastNameTH: formData.lastNameTH,
        studentId: formData.studentId,
        phoneNumber: formData.phoneNumber,
        roles: [formData.role],
        createdAt: new Date(),
        pdpaConsent: true,
      });

      setSuccess(true);
      setTimeout(() => router.push("/"), 1500);
    } catch (err) {
      setError(
        err.code === "auth/email-already-in-use"
          ? "อีเมลนี้มีในระบบแล้ว"
          : "เกิดข้อผิดพลาด กรุณาลองใหม่",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] font-sans p-4 py-10">
      {/* ─── 📦 การ์ดลงทะเบียน บีบให้แคบลง (max-w-[460px]) ─── */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-slate-100 w-full max-w-[460px] relative">
        <Link
          href="/login"
          className="absolute left-6 top-6 sm:left-8 sm:top-8 flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft size={16} /> กลับ
        </Link>

        <div className="flex flex-col items-center text-center mt-6 sm:mt-2 mb-6">
          <img
            src="https://ced.kmutnb.ac.th/image/banner/28997822520250908_111639.png"
            alt="CED KMUTNB Logo"
            className="h-12 w-auto object-contain mb-4"
          />
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            สร้างบัญชีใหม่
          </h1>
          <p className="text-[13px] font-medium text-slate-500 mt-1">
            ระบบจัดการเอกสารคำร้อง CED
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
            <p className="text-red-600 text-xs font-medium leading-relaxed">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
            <p className="text-emerald-700 text-xs font-medium">
              ลงทะเบียนสำเร็จ! กำลังเข้าสู่ระบบ...
            </p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* ข้อมูลส่วนตัว - จัด Grid ให้อ่านง่ายขึ้น */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <SelectField
                label="คำนำหน้า"
                name="prefix"
                value={formData.prefix}
                onChange={handleChange}
                options={[
                  { label: "นาย", value: "นาย" },
                  { label: "นาง", value: "นาง" },
                  { label: "นางสาว", value: "นางสาว" },
                ]}
                disabled={isLoading || success}
              />
            </div>
            <div className="col-span-2">
              <InputField
                label="ชื่อจริง"
                name="firstNameTH"
                placeholder="พงศกร"
                value={formData.firstNameTH}
                onChange={handleChange}
                required
                disabled={isLoading || success}
              />
            </div>
          </div>

          <InputField
            label="นามสกุล"
            name="lastNameTH"
            placeholder="ศรีสระเกษ"
            value={formData.lastNameTH}
            onChange={handleChange}
            required
            disabled={isLoading || success}
          />

          <InputField
            label="รหัสนักศึกษา / บุคลากร"
            name="studentId"
            maxLength="13"
            placeholder="รหัส 13 หลัก"
            value={formData.studentId}
            onChange={handleChange}
            required
            disabled={isLoading || success}
          />

          <InputField
            label="เบอร์โทรศัพท์"
            name="phoneNumber"
            type="tel"
            placeholder="08X-XXX-XXXX"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
            disabled={isLoading || success}
          />

          {/* เส้นแบ่ง */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 border-t border-slate-100"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              ข้อมูลล็อกอิน
            </span>
            <div className="flex-1 border-t border-slate-100"></div>
          </div>

          <InputField
            label="อีเมล (Email)"
            name="email"
            type="email"
            placeholder="example@kmutnb.ac.th"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isLoading || success}
          />

          <InputField
            label="รหัสผ่าน"
            name="password"
            isPassword
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={isLoading || success}
          />

          <InputField
            label="ยืนยันรหัสผ่าน"
            name="confirmPassword"
            isPassword
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={isLoading || success}
          />

          {/* 📍 แถบเช็คความปลอดภัยย่อส่วน (Compact) */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                ความปลอดภัย
              </p>
              <div className="h-1.5 w-16 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${strengthColor}`}
                  style={{ width: `${strengthPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-1.5 gap-x-2">
              <ValidationItem isValid={hasLength} text="8 ตัวอักษร" />
              <ValidationItem isValid={hasUppercase} text="พิมพ์ใหญ่ (A-Z)" />
              <ValidationItem isValid={hasLowercase} text="พิมพ์เล็ก (a-z)" />
              <ValidationItem isValid={hasNumber} text="ตัวเลข (0-9)" />
              <div className="col-span-2 pt-1 mt-1 border-t border-slate-200/60">
                <ValidationItem
                  isValid={isPasswordMatch}
                  text="รหัสผ่านตรงกัน"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={
              isLoading || success || !isPasswordSecure || !isPasswordMatch
            }
            className="w-full bg-slate-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>กำลังสร้างบัญชี...</span>
              </>
            ) : success ? (
              <span>สำเร็จแล้ว</span>
            ) : (
              <span>ยืนยันลงทะเบียน</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
