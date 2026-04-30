/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,

  // เพิ่มบรรทัดนี้เพื่อบอก Next.js ว่าเรากำลังรันบน sub-path /reqform
  basePath: "/reqform",
};

export default nextConfig;
