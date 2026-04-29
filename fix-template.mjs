// fix-template.mjs
// รันด้วย: node fix-template.mjs

import AdmZip from "adm-zip";

const INPUT = "./public/templates/template-memo.docx";
const OUTPUT = "./public/templates/template-memo-fixed.docx";

const zip = new AdmZip(INPUT);
let xml = zip.readAsText("word/document.xml");

// ปัญหา: Word แยก {{ และ }} ออกเป็น XML runs หลายอัน
// เช่น <w:t>{</w:t></w:r>...<w:t>{dateStr}}</w:t>
//
// วิธีแก้: หา { ที่อยู่ปลาย </w:t> แล้วตามด้วย { ในอีก <w:t> ถัดไป
// (โดยที่ XML ระหว่างนั้นไม่มี { หรือ } เลย) แล้ว merge เป็น {{

function fixTags(xml) {
  let prev = "";
  // วนซ้ำจนกว่าจะไม่มีอะไรเปลี่ยน (กรณี 3 levels)
  while (prev !== xml) {
    prev = xml;

    // merge { ... { → {{  (ข้าม XML runs)
    xml = xml.replace(/\{(<\/w:t>(?:(?!\{|\})[\s\S])*?<w:t[^>]*>)\{/g, "{{$1");

    // merge } ... } → }}  (ข้าม XML runs)
    xml = xml.replace(/\}(<\/w:t>(?:(?!\{|\})[\s\S])*?<w:t[^>]*>)\}/g, "}}$1");
  }
  return xml;
}

console.log("🔧 กำลังแก้ไข XML...");
const fixedXml = fixTags(xml);

const openCount = (fixedXml.match(/\{\{/g) || []).length;
const closeCount = (fixedXml.match(/\}\}/g) || []).length;
console.log(`✅ {{ จำนวน ${openCount} อัน | }} จำนวน ${closeCount} อัน`);

zip.updateFile("word/document.xml", Buffer.from(fixedXml, "utf8"));
zip.writeZip(OUTPUT);

console.log(`\n📁 ไฟล์ที่แก้แล้ว: ${OUTPUT}`);
console.log("📌 ถ้าใช้งานได้ ให้เปลี่ยนชื่อแทนไฟล์เดิม");
