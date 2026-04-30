/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google");
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-[#F8FAFC]" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] font-sans p-4">
      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-100 w-full max-w-[400px]">
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src="https://ced.kmutnb.ac.th/image/banner/28997822520250908_111639.png"
            alt="CED KMUTNB Logo"
            className="h-14 w-auto object-contain mb-5"
          />
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            เข้าสู่ระบบ
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1.5">
            ComEdu Document System
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

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700">
              อีเมล
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl border border-transparent focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-700 font-medium"
              placeholder="example@kmutnb.ac.th"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700">
              รหัสผ่าน
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full pl-4 pr-12 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-xl border border-transparent focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-700 font-medium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <span>เข้าสู่ระบบ</span>
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 border-t border-slate-100"></div>
          <span className="text-xs font-medium text-slate-400">หรือ</span>
          <div className="flex-1 border-t border-slate-100"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-50 shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          ดำเนินการต่อด้วย Google
        </button>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 font-medium">
            ยังไม่มีบัญชีใช่หรือไม่?{" "}
            <Link
              href="/register"
              className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors"
            >
              สมัครสมาชิก
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
