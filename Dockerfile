# 1. เลือก OS และ Node.js เวอร์ชั่น 18 ขนาดเล็ก (alpine)
FROM node:24-alpine

# 2. สร้างโฟลเดอร์ชื่อ /app ในกล่อง แล้วเข้าไปทำงานในนั้น
WORKDIR /app

# 3. ก๊อปปี้ไฟล์รายชื่อ Library เข้าไปก่อน
COPY package.json package-lock.json ./

# 4. สั่งติดตั้ง Library ทั้งหมด
RUN npm install

# 5. ก๊อปปี้โค้ดทั้งหมดของเราตามเข้าไป
COPY . .

# 6. สั่ง Build โปรเจกต์ให้พร้อมใช้งานจริง
RUN npm run build

# 7. เจาะรูพอร์ต 3000 ให้คนภายนอกเข้าถึงได้
EXPOSE 3000

# 8. คำสั่งเริ่มเปิดเซิร์ฟเวอร์
CMD ["npm", "start"]