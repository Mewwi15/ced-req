import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

export const toThaiNumerals = (numStr) => {
  const thaiNumbers = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];
  return String(numStr).replace(/[0-9]/g, (match) => thaiNumbers[match]);
};

export const generateWord = async (data, docNumber) => {
  try {
    const response = await fetch("/templates/template-memo.docx");
    const content = await response.arrayBuffer();
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{{", end: "}}" },
    });

    const rawDate = new Date().toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const degree = data.studentInfo?.degree || "";

    let eduLevel = "ปริญญาตรี";
    if (degree === "ครุศาสตร์อุตสาหกรรมมหาบัณฑิต") {
      eduLevel = "ปริญญาโท";
    } else if (degree.includes("ดุษฎีบัณฑิต")) {
      eduLevel = "ปริญญาเอก";
    }

    let finalWorkType = data.academicWork?.workType || "";
    if (degree === "ครุศาสตร์อุตสาหกรรมบัณฑิต") {
      finalWorkType = "ปริญญานิพนธ์";
    }

    const templateData = {
      docNumber: docNumber,
      dateStr: toThaiNumerals(rawDate),
      prefix: data.studentInfo?.prefix || "",
      fullName: data.studentInfo?.fullName || "",
      studentId: toThaiNumerals(
        data.studentId || data.studentInfo?.studentId || "",
      ),
      eduLevel: eduLevel,
      degree: degree,
      department: data.studentInfo?.department || "",
      major: data.studentInfo?.major || "",
      studyPlan: data.studentInfo?.studyPlan || "",
      hasStudyPlan: !!data.studentInfo?.studyPlan,
      phoneMobile: data.studentInfo?.phoneMobile || "",
      workTitle: data.academicWork?.workTitle || "",
      workType: finalWorkType,
      mainAdvisor: data.academicWork?.advisors?.[0] || "",
      advisors: data.academicWork?.advisors
        ? data.academicWork.advisors
            .filter((n) => n.trim() !== "")
            .map((n) => ({ name: n }))
        : [],
    };

    try {
      doc.render(templateData);
    } catch (error) {
      error.properties?.errors?.forEach((e) => {
        console.error("❌ Tag เสีย:", JSON.stringify(e.properties));
      });
      throw error;
    }

    const out = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    saveAs(out, `บันทึกข้อความ_${data.studentInfo?.fullName}.docx`);
  } catch (error) {
    console.error("Error generating word:", error);
    alert("เกิดข้อผิดพลาดในการสร้างไฟล์ Word กรุณาตรวจสอบไฟล์ Template");
  }
};

export const generateExpertWord = async (data, docNumber) => {
  try {
    const degree = data.studentInfo?.degree || "";
    let templateFileName = "template-expert-bachelor.docx";

    if (degree === "ครุศาสตร์อุตสาหกรรมมหาบัณฑิต") {
      templateFileName = "template-expert-master.docx";
    } else if (degree.includes("ดุษฎีบัณฑิต")) {
      templateFileName = "template-expert-doctoral.docx";
    }

    const response = await fetch(`/templates/${templateFileName}`);
    if (!response.ok) {
      throw new Error(
        `ไม่พบไฟล์ ${templateFileName} ในโฟลเดอร์ public/templates/`,
      );
    }

    const content = await response.arrayBuffer();
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{{", end: "}}" },
    });

    const expertMap = new Map();

    // ตรวจสอบด้านเนื้อหา
    data.experts?.content?.forEach((e) => {
      const name = e.name.trim();
      if (name !== "") {
        expertMap.set(name, { name: name, isContent: true, isTech: false });
      }
    });

    // ตรวจสอบด้านเทคนิค
    data.experts?.technical?.forEach((e) => {
      const name = e.name.trim();
      if (name !== "") {
        if (expertMap.has(name)) {
          expertMap.get(name).isTech = true;
        } else {
          expertMap.set(name, { name: name, isContent: false, isTech: true });
        }
      }
    });

    const combinedExperts = Array.from(expertMap.values()).map((e) => {
      let typeStr = "";
      if (e.isContent && e.isTech) {
        typeStr = "ด้านเนื้อหาและด้านเทคนิค";
      } else if (e.isContent) {
        typeStr = "ด้านเนื้อหา";
      } else if (e.isTech) {
        typeStr = "ด้านเทคนิค";
      }

      return {
        expertName: e.name,
        expertType: typeStr,
      };
    });

    const allExpertsList = combinedExperts.map((e, index) => ({
      index: toThaiNumerals(index + 1),
      expertName: e.expertName,
    }));

    const rawDate = new Date().toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let eduLevel = "ปริญญาตรี";
    if (degree === "ครุศาสตร์อุตสาหกรรมมหาบัณฑิต") {
      eduLevel = "ปริญญาโท";
    } else if (degree.includes("ดุษฎีบัณฑิต")) {
      eduLevel = "ปริญญาเอก";
    }

    let finalWorkType = data.academicWork?.workType || "";
    if (degree === "ครุศาสตร์อุตสาหกรรมบัณฑิต") {
      finalWorkType = "ปริญญานิพนธ์";
    }

    const templateData = {
      docNumber: docNumber,
      dateStr: toThaiNumerals(rawDate),
      prefix: data.studentInfo?.prefix || "",
      fullName: data.studentInfo?.fullName || "",
      studentId: toThaiNumerals(
        data.studentId || data.studentInfo?.studentId || "",
      ),
      eduLevel: eduLevel,
      degree: degree,
      department: data.studentInfo?.department || "",
      major: data.studentInfo?.major || "",
      studyPlan: data.studentInfo?.studyPlan || "",
      workTitle: data.academicWork?.workTitle || "",
      workType: finalWorkType,
      mainAdvisor: data.academicWork?.advisors?.[0] || "",
      advisors: data.academicWork?.advisors
        ? data.academicWork.advisors
            .filter((n) => n.trim() !== "")
            .map((n) => ({ name: n }))
        : [],
      experts: combinedExperts,
      allExperts: allExpertsList,
    };

    try {
      doc.render(templateData);
    } catch (error) {
      error.properties?.errors?.forEach((e) => {
        console.error("❌ Tag เสีย:", JSON.stringify(e.properties));
      });
      throw error;
    }

    const out = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    saveAs(out, `จดหมายเชิญผู้เชี่ยวชาญ_${data.studentInfo?.fullName}.docx`);
  } catch (error) {
    console.error("Error generating Expert word:", error);
    alert(`เกิดข้อผิดพลาด: ${error.message}`);
  }
};

const handleStatusChange = async (requestId, newStatus) => {
  try {
    await updateDoc(doc(db, "requests", requestId), { status: newStatus });
    setRequests((prev) =>
      prev.map((req) =>
        req.id === requestId ? { ...req, status: newStatus } : req,
      ),
    );
    if (selectedRequest?.id === requestId)
      setSelectedRequest((prev) => ({ ...prev, status: newStatus }));
  } catch (error) {
    alert("อัปเดตสถานะไม่สำเร็จ");
  }
};
