/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
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

// ─── 🧩 Reusable Input Component ───
const InputField = ({ label, isPassword, ...props }) => {
  const [show, setShow] = useState(false);
  const inputType = isPassword
    ? show
      ? "text"
      : "password"
    : props.type || "text";

  return (
    <div className="space-y-1.5 w-full">
      <label className="block text-sm font-bold text-slate-700">{label}</label>
      <div className="relative">
        <input
          type={inputType}
          className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl border border-transparent focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-700 font-medium placeholder:text-slate-400"
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── 🧩 Reusable Select Component ───
const SelectField = ({ label, options, ...props }) => {
  return (
    <div className="space-y-1.5 w-full">
      <label className="block text-sm font-bold text-slate-700">{label}</label>
      <div className="relative">
        <select
          className="w-full pl-4 pr-10 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl border border-transparent focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-700 font-medium appearance-none cursor-pointer"
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
  <div className="flex items-center gap-2 text-xs font-medium transition-colors duration-300">
    {isValid ? (
      <CheckCircle2 className="text-emerald-500" size={16} />
    ) : (
      <XCircle className="text-slate-300" size={16} />
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
      setError("รหัสนักศึกษา/บุคลากรต้องครบ 13 หลัก");
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
          ? "อีเมลนี้ถูกลงทะเบียนในระบบเรียบร้อยแล้ว"
          : "ไม่สามารถสร้างบัญชีได้ กรุณาตรวจสอบข้อมูลอีกครั้ง",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] font-sans p-4 sm:p-6 py-10">
      <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-100 w-full max-w-[600px] relative">
        <Link
          href="/login"
          className="absolute left-6 top-6 sm:left-8 sm:top-8 flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft size={16} /> กลับ
        </Link>

        <div className="flex flex-col items-center text-center mt-6 sm:mt-0 mb-8">
          <img
            src="https://ced.kmutnb.ac.th/image/banner/28997822520250908_111639.png"
            alt="CED KMUTNB Logo"
            className="h-14 w-auto object-contain mb-5"
          />
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            สร้างบัญชีใหม่
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1.5">
            กรอกข้อมูลเพื่อลงทะเบียนใช้งานระบบ
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-red-600 text-sm font-medium leading-relaxed">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2.5">
            <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
            <p className="text-emerald-700 text-sm font-medium">
              ลงทะเบียนสำเร็จ! กำลังเข้าสู่ระบบ...
            </p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
            <div className="sm:col-span-3">
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
            <div className="sm:col-span-4">
              <InputField
                label="ชื่อจริง"
                name="firstNameTH"
                placeholder="ชื่อ.."
                value={formData.firstNameTH}
                onChange={handleChange}
                required
                disabled={isLoading || success}
              />
            </div>
            <div className="sm:col-span-5">
              <InputField
                label="นามสกุล"
                name="lastNameTH"
                placeholder="นามสกุล.."
                value={formData.lastNameTH}
                onChange={handleChange}
                required
                disabled={isLoading || success}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InputField
              label="รหัสนักศึกษา / บุคลากร"
              name="studentId"
              maxLength="13"
              placeholder="13 หลัก"
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
          </div>

          <div className="pt-2 border-t border-slate-100 mt-6 mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4 mb-2">
              ข้อมูลการเข้าสู่ระบบ
            </p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
          </div>

          {/* 📍 แถบเช็คความปลอดภัยของรหัสผ่าน (Password Strength) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 mt-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                ความปลอดภัยรหัสผ่าน
              </p>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${strengthScore === 4 ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}
              >
                {strengthScore}/4
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${strengthColor}`}
                style={{ width: `${strengthPercentage}%` }}
              ></div>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <ValidationItem isValid={hasLength} text="อย่างน้อย 8 ตัวอักษร" />
              <ValidationItem
                isValid={hasUppercase}
                text="ตัวพิมพ์ใหญ่ (A-Z)"
              />
              <ValidationItem
                isValid={hasLowercase}
                text="ตัวพิมพ์เล็ก (a-z)"
              />
              <ValidationItem isValid={hasNumber} text="ตัวเลข (0-9)" />
              <div className="sm:col-span-2 border-t border-slate-200/60 my-1 pt-2">
                <ValidationItem
                  isValid={isPasswordMatch}
                  text="รหัสผ่านและการยืนยันตรงกัน"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={
              isLoading || success || !isPasswordSecure || !isPasswordMatch
            }
            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>กำลังสร้างบัญชี...</span>
              </>
            ) : success ? (
              <span>ลงทะเบียนสำเร็จแล้ว</span>
            ) : (
              <span>ยืนยันการลงทะเบียน</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
