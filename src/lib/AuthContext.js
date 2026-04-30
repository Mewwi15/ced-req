/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false); // 📍 เพิ่มตัวแปรเช็คการโหลดครั้งแรก
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true); // 📍 บอกว่า Client พร้อมทำงานแล้ว

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      } else {
        setUser(null);
        setUserProfile(null);

        // เช็ค path แบบปลอดภัย (Next.js usePathname จะตัด basePath ออกให้แล้ว)
        const isPublicPage = pathname === "/login" || pathname === "/register";
        if (!isPublicPage) {
          router.push("/login");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  // ─── 🛡️ แก้ไขส่วนการ Render เพื่อฆ่า Error #310 ───
  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {/* 
         ถ้ายังไม่ได้ Mounted (ช่วง Server/First Load) 
         ให้แสดง children ไปก่อนเพื่อให้ HTML ตรงกัน 
      */}
      {!mounted ? (
        children
      ) : (
        <>
          {/* ถ้าโหลดเสร็จแล้วค่อยเลือกว่าจะโชว์ Spinner หรือ Content */}
          {loading ? (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <Loader2 className="animate-spin text-emerald-500" size={40} />
            </div>
          ) : (
            children
          )}
        </>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
