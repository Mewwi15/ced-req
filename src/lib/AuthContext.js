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
    setMounted(true);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // 📍 สร้างรายการหน้าเว็บที่คนยังไม่ล็อกอินก็เข้าได้
      const publicPaths = ["/login", "/login/", "/register", "/register/"];
      const isPublicPage = publicPaths.includes(pathname);

      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const profileData = docSnap.data();
            setUserProfile(profileData);

            const isAdmin =
              profileData.roles && profileData.roles.includes("admin");

            // 🚦 กฎจราจรข้อ 1: ถ้าล็อกอินแล้ว แต่ดันมาอยู่หน้า Login/Register
            // ให้ส่งตัวไปยังบ้านของแต่ละคนทันที
            if (isPublicPage) {
              router.push(isAdmin ? "/admin" : "/dashboard");
            }
            // 🚦 กฎจราจรข้อ 2: ถ้าไม่ใช่แอดมิน แต่พยายามเข้าห้องแอดมิน
            else if (pathname.startsWith("/admin") && !isAdmin) {
              router.push("/dashboard");
            }
            // 🚦 กฎจราจรข้อ 3: ถ้าเป็นแอดมิน แต่ไปเดินเล่นห้องนักศึกษา
            else if (pathname.startsWith("/dashboard") && isAdmin) {
              router.push("/admin");
            }
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      } else {
        // 🚦 กฎจราจรข้อ 4: ถ้ายังไม่ล็อกอิน แต่พยายามเข้าหน้าอื่นๆ ที่ไม่ใช่หน้า Public
        setUser(null);
        setUserProfile(null);

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
