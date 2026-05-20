"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { sendEmailVerification, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  MailCheck,
  RefreshCw,
  LogOut,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";

const RESEND_COOLDOWN = 60; // วินาที
const POLL_INTERVAL = 4000; // ms

export default function VerifyEmailPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [error, setError] = useState("");

  const pollRef = useRef(null);
  const cooldownRef = useRef(null);

  // ─── ติดตาม Auth State ───
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (!u) {
        router.replace("/login");
        return;
      }
      if (u.emailVerified) {
        // verified แล้วแต่อาจยังไม่มีข้อมูลใน Firestore (เช่น กลับมาเปิดหน้านี้ใหม่)
        // ให้ไปหน้าหลักได้เลย
        router.replace("/");
        return;
      }
      setUser(u);
    });
    return () => unsubscribe();
  }, [router]);

  // ─── Auto-poll: reload + ตรวจ verified + บันทึก Firestore ───
  const checkVerification = useCallback(async () => {
    if (!auth.currentUser) return;
    setIsChecking(true);
    try {
      await auth.currentUser.reload();

      if (auth.currentUser.emailVerified) {
        clearInterval(pollRef.current);

        // 🌟 อ่านข้อมูลที่ค้างไว้ใน sessionStorage แล้วเขียนลง Firestore
        const raw = sessionStorage.getItem("pendingUser");
        if (raw) {
          const pending = JSON.parse(raw);
          await setDoc(doc(db, "users", pending.uid), {
            ...pending,
            createdAt: new Date(),
            pdpaConsent: true,
            emailVerified: true,
          });
          sessionStorage.removeItem("pendingUser");
        }

        setIsVerified(true);
        setTimeout(() => router.replace("/"), 2500);
      }
    } catch {
      // silent fail — จะลองใหม่รอบถัดไป
    } finally {
      setIsChecking(false);
    }
  }, [router]);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkVerification();
    pollRef.current = setInterval(checkVerification, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [user, checkVerification]);

  // ─── Cooldown Timer ───
  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  // ─── ส่งอีเมลยืนยันใหม่ ───
  const handleResend = async () => {
    if (!auth.currentUser || cooldown > 0 || isSending) return;
    setIsSending(true);
    setError("");
    setSendSuccess(false);
    try {
      await sendEmailVerification(auth.currentUser);
      setSendSuccess(true);
      startCooldown();
      setTimeout(() => setSendSuccess(false), 4000);
    } catch (err) {
      if (err.code === "auth/too-many-requests") {
        setError("ส่งบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่ครับ");
      } else {
        setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      setIsSending(false);
    }
  };

  // ─── ออกจากระบบ (ยกเลิกการสมัคร) ───
  const handleSignOut = async () => {
    sessionStorage.removeItem("pendingUser");
    await signOut(auth);
    router.replace("/login");
  };

  // ─── Loading state ───
  if (!user && !isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  // ─── Verified! ───
  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10 max-w-sm w-full text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-5">
            <CheckCircle2
              size={42}
              className="text-emerald-500"
              strokeWidth={2}
            />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            ยืนยันอีเมลสำเร็จ!
          </h2>
          <p className="text-sm font-medium text-slate-500 mb-4">
            กำลังพาคุณไปหน้าหลัก…
          </p>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full animate-[progress_2.5s_linear_forwards]" />
          </div>
          <style>{`
            @keyframes progress {
              from { width: 0% }
              to   { width: 100% }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // ─── Main — รอยืนยัน ───
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] font-sans p-4">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 sm:p-10 max-w-sm w-full text-center flex flex-col items-center">
        {/* ─── Icon ─── */}
        <div className="relative w-24 h-24 mb-6">
          <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center">
            <MailCheck size={44} className="text-blue-500" strokeWidth={1.8} />
          </div>
          <span className="absolute inset-0 rounded-full border-2 border-blue-300 animate-ping opacity-30" />
        </div>

        <h1 className="text-xl font-bold text-slate-800 mb-2">
          ตรวจสอบกล่องจดหมายของคุณ
        </h1>
        <p className="text-sm font-medium text-slate-500 leading-relaxed">
          ระบบส่งลิงก์ยืนยันไปที่
        </p>
        <p className="text-sm font-bold text-slate-700 mt-1 mb-6 break-all">
          {user?.email}
        </p>

        {/* ─── Status bar ─── */}
        <div className="w-full bg-slate-50 rounded-2xl p-4 mb-5 flex items-center gap-3">
          {isChecking ? (
            <Loader2
              size={18}
              className="text-slate-400 animate-spin shrink-0"
            />
          ) : (
            <Clock size={18} className="text-slate-400 shrink-0" />
          )}
          <p className="text-xs font-medium text-slate-500 text-left">
            {isChecking
              ? "กำลังตรวจสอบสถานะ…"
              : "ระบบตรวจสอบอัตโนมัติทุก 4 วินาที กดลิงก์ในอีเมลก่อนได้เลยครับ"}
          </p>
        </div>

        {/* ─── Feedback ─── */}
        {sendSuccess && (
          <div className="w-full bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl px-4 py-2.5 mb-4 flex items-center justify-center gap-2">
            <CheckCircle2 size={14} />
            ส่งอีเมลยืนยันใหม่แล้วครับ!
          </div>
        )}
        {error && (
          <div className="w-full bg-red-50 text-red-600 text-xs font-bold rounded-xl px-4 py-2.5 mb-4">
            {error}
          </div>
        )}

        {/* ─── Resend Button ─── */}
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || isSending}
          className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mb-3"
        >
          {isSending ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              <span>กำลังส่ง…</span>
            </>
          ) : cooldown > 0 ? (
            <>
              <Clock size={17} />
              <span>ส่งใหม่ได้ในอีก {cooldown} วินาที</span>
            </>
          ) : (
            <>
              <RefreshCw size={17} />
              <span>ส่งลิงก์ยืนยันใหม่อีกครั้ง</span>
            </>
          )}
        </button>

        {/* ─── Sign out ─── */}
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors py-2"
        >
          <LogOut size={15} />
          ใช้อีเมลอื่น / ออกจากระบบ
        </button>
      </div>
    </div>
  );
}
