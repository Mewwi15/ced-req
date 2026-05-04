import { Clock, Search, CheckCircle2, XCircle } from "lucide-react";

export const getStatusBadge = (status) => {
  switch (status) {
    case "รอดำเนินการ":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
          <Clock size={14} /> รอดำเนินการ
        </span>
      );
    case "กำลังตรวจสอบ":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
          <Search size={14} /> กำลังตรวจสอบ
        </span>
      );
    case "อนุมัติแล้ว":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
          <CheckCircle2 size={14} /> อนุมัติแล้ว
        </span>
      );
    case "ถูกปฏิเสธ":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-200">
          <XCircle size={14} /> ถูกปฏิเสธ
        </span>
      );
    default:
      return (
        <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
          {status}
        </span>
      );
  }
};
