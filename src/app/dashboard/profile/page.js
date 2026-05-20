"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/lib/AuthContext";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Save,
  Loader2,
  CheckCircle2,
  CreditCard,
  AlertCircle,
} from "lucide-react";

export default function ProfileEditPage() {
  const { user, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: '' }

  const [formData, setFormData] = useState({
    prefix: "นาย",
    firstNameTH: "",
    lastNameTH: "",
    phoneNumber: "",
  });

  // โหลดข้อมูลเดิมมาใส่ฟอร์ม
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            prefix: data.prefix || "นาย",
            firstNameTH: data.firstNameTH || "",
            lastNameTH: data.lastNameTH || "",
            phoneNumber: data.phoneNumber || "",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setNotification(null);

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        prefix: formData.prefix,
        firstNameTH: formData.firstNameTH,
        lastNameTH: formData.lastNameTH,
        phoneNumber: formData.phoneNumber,
        updatedAt: new Date(),
      });

      setNotification({
        type: "success",
        message: "บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว",
      });

      // ซ่อนแจ้งเตือนอัตโนมัติหลัง 3 วินาที
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setNotification({
        type: "error",
        message: "เกิดข้อผิดพลาด ไม่สามารถบันทึกข้อมูลได้",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[60vh]">
        <div className="relative flex justify-center items-center">
          <div className="absolute animate-ping w-16 h-16 rounded-full bg-emerald-400/20"></div>
          <div className="w-8 h-8 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto w-full flex-1 flex flex-col gap-6 lg:gap-8 pb-28 lg:pb-12 p-4 sm:p-6 lg:p-8">
      {/* ─── 🌟 Header ─── */}
      <div className="flex flex-col gap-2 animate-in fade-in duration-500 mb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold tracking-widest uppercase w-max">
          <User size={14} /> My Profile
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
          จัดการข้อมูลส่วนตัว
        </h1>
        <p className="text-slate-500 font-medium">
          อัปเดตข้อมูลการติดต่อ เพื่อให้เจ้าหน้าที่สามารถติดต่อคุณได้รวดเร็วขึ้น
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-700 delay-100">
        {/* ─── 🛡️ ฝั่งซ้าย: ข้อมูลที่ห้ามแก้ไข (Read-only Profile Card) ─── */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
            {/* พื้นหลังตกแต่งการ์ด */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-emerald-500 to-teal-700"></div>

            {/* รูปโปรไฟล์แบบตัวย่อ */}
            <div className="relative z-10 w-28 h-28 bg-white rounded-full p-2 mt-4 shadow-lg mb-4">
              <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-3xl font-black text-slate-400">
                {formData.firstNameTH.substring(0, 1) || "พ"}
              </div>
            </div>

            <h2 className="text-xl font-black text-slate-800 relative z-10 mb-1">
              {formData.prefix} {formData.firstNameTH} {formData.lastNameTH}
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold mb-6">
              <ShieldCheck size={14} /> นักศึกษาได้รับการยืนยัน
            </div>

            {/* ข้อมูลที่ล็อกไว้ */}
            <div className="w-full space-y-3">
              <div className="flex flex-col text-left p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Mail size={12} /> อีเมลมหาวิทยาลัย
                </span>
                <span className="text-sm font-bold text-slate-700">
                  {user?.email || "-"}
                </span>
              </div>
              <div className="flex flex-col text-left p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <CreditCard size={12} /> รหัสนักศึกษา
                </span>
                <span className="text-sm font-bold text-slate-700">
                  {userProfile?.studentId || "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── ✏️ ฝั่งขวา: ฟอร์มสำหรับแก้ไขข้อมูล ─── */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[2rem] border border-slate-100 p-6 sm:p-10 shadow-sm flex flex-col h-full"
          >
            <h3 className="text-xl font-black text-slate-800 mb-6 pb-4 border-b border-slate-100">
              ข้อมูลที่สามารถแก้ไขได้
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {/* คำนำหน้า */}
              <div className="sm:col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  คำนำหน้า
                </label>
                <div className="relative">
                  <select
                    name="prefix"
                    value={formData.prefix}
                    onChange={handleChange}
                    className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl outline-none transition-all font-bold text-slate-700 appearance-none"
                  >
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    ▼
                  </div>
                </div>
              </div>

              {/* เบอร์โทรศัพท์ */}
              <div className="sm:col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  เบอร์โทรศัพท์ติดต่อ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Phone size={18} />
                  </div>
                  <input
                    type="tel"
                    name="phoneNumber"
                    required
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="08X-XXX-XXXX"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl outline-none transition-all font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-medium"
                  />
                </div>
              </div>

              {/* ชื่อจริง */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  ชื่อจริง (ภาษาไทย) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstNameTH"
                  required
                  value={formData.firstNameTH}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl outline-none transition-all font-bold text-slate-700"
                />
              </div>

              {/* นามสกุล */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  นามสกุล (ภาษาไทย) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastNameTH"
                  required
                  value={formData.lastNameTH}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl outline-none transition-all font-bold text-slate-700"
                />
              </div>
            </div>

            {/* แจ้งเตือน Success / Error */}
            {notification && (
              <div
                className={`flex items-center gap-3 p-4 rounded-xl mb-6 font-bold text-sm animate-in fade-in slide-in-from-bottom-2 ${
                  notification.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {notification.type === "success" ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
                {notification.message}
              </div>
            )}

            {/* ปุ่มบันทึก */}
            <div className="mt-auto pt-6 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 active:scale-95 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />{" "}
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save size={18} /> บันทึกการเปลี่ยนแปลง
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
