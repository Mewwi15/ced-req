/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  ChevronLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  MailCheck,
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
          className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl border border-transparent focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-700 font-medium placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
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
          className="w-full pl-4 pr-10 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl border border-transparent focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-700 font-medium appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [modal, setModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    buttonText: "ตกลง",
    onClose: null,
  });

  const [isGoogleSignup, setIsGoogleSignup] = useState(false);
  const [googleUid, setGoogleUid] = useState(null);

  const [formData, setFormData] = useState({
    prefix: "นาย",
    firstNameTH: "",
    lastNameTH: "",
    studentId: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const showModal = (
    type,
    title,
    message,
    buttonText = "ตกลง",
    onCloseCallback = null,
  ) => {
    setModal({
      isOpen: true,
      type,
      title,
      message,
      buttonText,
      onClose:
        onCloseCallback ||
        (() => setModal((prev) => ({ ...prev, isOpen: false }))),
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
  let strengthText = "กรุณากรอกรหัสผ่าน";
  if (strengthScore === 1 || strengthScore === 2) {
    strengthColor = "bg-orange-400";
    strengthText = "คาดเดาง่าย";
  } else if (strengthScore === 3) {
    strengthColor = "bg-amber-400";
    strengthText = "ปลอดภัย";
  } else if (strengthScore === 4) {
    strengthColor = "bg-emerald-500";
    strengthText = "รัดกุมมาก";
  }

  // ─── 🌟 ฟังก์ชันสมัครสมาชิกแบบปกติ ───
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isGoogleSignup) {
      if (!isPasswordSecure || !isPasswordMatch) {
        showModal(
          "error",
          "ข้อมูลไม่ถูกต้อง",
          "กรุณาตั้งรหัสผ่านให้ครบ 8 ตัวอักษร (มีพิมพ์เล็ก, พิมพ์ใหญ่ และตัวเลข) และตรงกัน",
        );
        setIsLoading(false);
        return;
      }

      const allowedDomains = [
        "@kmutnb.ac.th",
        "@email.kmutnb.ac.th",
        "@fte.kmutnb.ac.th",
      ];
      const isKmutnbEmail = allowedDomains.some((domain) =>
        formData.email.endsWith(domain),
      );

      if (!isKmutnbEmail) {
        showModal(
          "error",
          "อีเมลไม่ถูกต้อง",
          "กรุณาใช้อีเมลของมหาวิทยาลัย (@kmutnb.ac.th, @email.kmutnb.ac.th หรือ @fte.kmutnb.ac.th) เท่านั้นครับ",
        );
        setIsLoading(false);
        return;
      }
    }

    if (formData.studentId.length < 13) {
      showModal(
        "error",
        "ข้อมูลไม่ถูกต้อง",
        "รหัสนักศึกษา/บุคลากรต้องครบ 13 หลัก",
      );
      setIsLoading(false);
      return;
    }

    try {
      // ─── กรณี Email/Password signup ───
      if (!isGoogleSignup) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password,
        );
        await sendEmailVerification(userCredential.user);

        // 🌟 เซฟข้อมูลไว้ใน sessionStorage ชั่วคราว
        //    ยัง "ไม่" setDoc ลง Firestore จนกว่าจะกด verify ในอีเมล
        const emailPrefix = formData.email.split("@")[0];
        const isStaffEmail =
          formData.email.endsWith("@kmutnb.ac.th") &&
          !emailPrefix.startsWith("s");

        sessionStorage.setItem(
          "pendingUser",
          JSON.stringify({
            uid: userCredential.user.uid,
            email: formData.email,
            prefix: formData.prefix,
            firstNameTH: formData.firstNameTH,
            lastNameTH: formData.lastNameTH,
            studentId: formData.studentId,
            phoneNumber: formData.phoneNumber,
            roles: [isStaffEmail ? "staff" : "student"],
          }),
        );

        setIsLoading(false);
        router.push("/verify-email");
        return;
      }

      // ─── กรณี Google signup: verified แล้ว → setDoc ได้เลย ───
      const emailPrefix = formData.email.split("@")[0];
      const isStaffEmail =
        formData.email.endsWith("@kmutnb.ac.th") &&
        !emailPrefix.startsWith("s");

      await setDoc(doc(db, "users", googleUid), {
        uid: googleUid,
        email: formData.email,
        prefix: formData.prefix,
        firstNameTH: formData.firstNameTH,
        lastNameTH: formData.lastNameTH,
        studentId: formData.studentId,
        phoneNumber: formData.phoneNumber,
        roles: [isStaffEmail ? "staff" : "student"],
        createdAt: new Date(),
        pdpaConsent: true,
        emailVerified: true,
      });

      setIsLoading(false);
      showModal(
        "success",
        "ลงทะเบียนสำเร็จ!",
        "บันทึกข้อมูลเข้าสู่ระบบเรียบร้อยแล้วครับ",
        "เข้าสู่หน้าหลัก",
        () => router.push("/"),
      );
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        showModal(
          "error",
          "ลงทะเบียนไม่สำเร็จ",
          "อีเมลนี้ซ้ำแล้ว กรุณาลองใหม่อีกครั้ง",
          "ลองใหม่อีกครั้ง",
        );
      } else {
        showModal(
          "error",
          "เกิดข้อผิดพลาด",
          "ไม่สามารถสร้างบัญชีได้ กรุณาตรวจสอบข้อมูลอีกครั้ง",
        );
      }
      setIsLoading(false);
    }
  };

  // ─── 🌟 ฟังก์ชันเชื่อมต่อ Google ───
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const allowedDomains = [
        "@kmutnb.ac.th",
        "@email.kmutnb.ac.th",
        "@fte.kmutnb.ac.th",
      ];
      const isKmutnbEmail = allowedDomains.some((domain) =>
        user.email.endsWith(domain),
      );

      if (!isKmutnbEmail) {
        await auth.signOut();
        showModal(
          "error",
          "โดเมนไม่ถูกต้อง",
          "ไม่อนุญาตให้ใช้อีเมลส่วนตัว กรุณาใช้อีเมลของมหาวิทยาลัย (@kmutnb.ac.th, @email.kmutnb.ac.th หรือ @fte.kmutnb.ac.th) เท่านั้นครับ",
        );
        setIsLoading(false);
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        await auth.signOut();
        showModal(
          "error",
          "ลงทะเบียนไม่สำเร็จ",
          "อีเมลนี้ซ้ำแล้ว กรุณาลองใหม่อีกครั้ง",
          "ลองใหม่อีกครั้ง",
        );
        setIsLoading(false);
        return;
      }

      let autoStudentId = "";
      const emailPrefix = user.email.split("@")[0];
      if (emailPrefix.startsWith("s") && emailPrefix.length > 1) {
        autoStudentId = emailPrefix.substring(1);
      }

      setFormData((prev) => ({
        ...prev,
        email: user.email,
        studentId: autoStudentId,
      }));
      setGoogleUid(user.uid);
      setIsGoogleSignup(true);

      showModal(
        "info",
        "ยืนยันอีเมลสำเร็จ!",
        "กรุณากรอกชื่อ-นามสกุล และเบอร์โทรศัพท์ให้ครบถ้วนเพื่อเสร็จสิ้นการลงทะเบียน",
        "ดำเนินการต่อ",
      );
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      showModal(
        "error",
        "เกิดข้อผิดพลาด",
        "เกิดข้อผิดพลาดในการลงทะเบียนด้วย Google หรือคุณกดยกเลิกการทำงาน",
      );
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-10px); }
          40%, 80% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>

      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] font-sans p-4 sm:p-6 py-10 relative">
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
              กรอกข้อมูลหรือใช้อีเมลมหาวิทยาลัยเพื่อลงทะเบียน
            </p>
          </div>

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
                  disabled={isLoading}
                />
              </div>
              <div className="sm:col-span-4">
                <InputField
                  label="ชื่อจริง (ภาษาไทย)"
                  name="firstNameTH"
                  placeholder="ชื่อ.."
                  value={formData.firstNameTH}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="sm:col-span-5">
                <InputField
                  label="นามสกุล (ภาษาไทย)"
                  name="lastNameTH"
                  placeholder="นามสกุล.."
                  value={formData.lastNameTH}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
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
                disabled={isLoading}
              />
              <InputField
                label="เบอร์โทรศัพท์"
                name="phoneNumber"
                type="tel"
                placeholder="08X-XXX-XXXX"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                disabled={isLoading}
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
              disabled={isLoading || isGoogleSignup}
            />

            {!isGoogleSignup && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <InputField
                    label="รหัสผ่าน"
                    name="password"
                    isPassword
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                  <InputField
                    label="ยืนยันรหัสผ่าน"
                    name="confirmPassword"
                    isPassword
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>

                {formData.password && (
                  <div className="space-y-1.5 mt-2 px-1">
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-slate-500">
                        ความปลอดภัยรหัสผ่าน
                      </span>
                      <span
                        className={
                          strengthScore === 4
                            ? "text-emerald-600"
                            : "text-slate-500"
                        }
                      >
                        {strengthText}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${strengthColor}`}
                        style={{ width: `${strengthPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={
                isLoading ||
                (!isGoogleSignup && (!isPasswordSecure || !isPasswordMatch))
              }
              className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>กำลังดำเนินการ...</span>
                </>
              ) : (
                <span>
                  {isGoogleSignup
                    ? "บันทึกข้อมูลและเข้าสู่ระบบ"
                    : "ยืนยันการลงทะเบียน"}
                </span>
              )}
            </button>
          </form>

          {!isGoogleSignup && (
            <>
              <div className="relative flex items-center py-4 mt-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium">
                  หรือ
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full bg-white border border-slate-200 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google Icon"
                  className="w-5 h-5"
                />
                <span>ลงทะเบียนด้วยอีเมลมหาลัย (@kmutnb)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── 📍 MODAL CUSTOM UI ─── */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center flex flex-col items-center animate-in zoom-in-95 duration-300 ${
              modal.type === "error" ? "animate-shake" : ""
            }`}
          >
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${
                modal.type === "error"
                  ? "bg-red-50 text-red-500"
                  : modal.type === "success"
                    ? "bg-emerald-50 text-emerald-500"
                    : modal.type === "mail"
                      ? "bg-blue-50 text-blue-500"
                      : "bg-blue-50 text-blue-500"
              }`}
            >
              {modal.type === "error" && (
                <AlertCircle size={40} strokeWidth={2} />
              )}
              {modal.type === "success" && (
                <CheckCircle2 size={40} strokeWidth={2} />
              )}
              {modal.type === "mail" && <MailCheck size={40} strokeWidth={2} />}
              {modal.type === "info" && <Info size={40} strokeWidth={2} />}
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {modal.title}
            </h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
              {modal.message}
            </p>

            <button
              type="button"
              onClick={modal.onClose}
              className={`w-full py-3.5 rounded-xl font-bold transition-all active:scale-95 ${
                modal.type === "error"
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                  : modal.type === "success"
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20"
              }`}
            >
              {modal.buttonText}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
