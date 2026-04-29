import { redirect } from "next/navigation";

export default function Home() {
  // สั่งให้ระบบวิ่งไปที่หน้า /login ทันทีเมื่อมีคนเข้าเว็บหน้าแรก (http://localhost:3000)
  redirect("/login");
}
