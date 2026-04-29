"use client";
import { Check } from "lucide-react";

export default function Stepper({ currentStep, steps }) {
  return (
    <div className="flex items-center justify-center w-full mb-12">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          {/* วงกลมลำดับขั้นตอน */}
          <div className="flex flex-col items-center relative">
            <div
              className={`
              w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
              ${
                currentStep > index + 1
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : currentStep === index + 1
                    ? "border-emerald-500 text-emerald-600 bg-white shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    : "border-slate-200 text-slate-400 bg-white"
              }
            `}
            >
              {currentStep > index + 1 ? (
                <Check size={20} strokeWidth={3} />
              ) : (
                index + 1
              )}
            </div>
            <span
              className={`absolute -bottom-7 text-xs font-bold whitespace-nowrap ${currentStep === index + 1 ? "text-slate-800" : "text-slate-400"}`}
            >
              {step}
            </span>
          </div>

          {/* เส้นเชื่อมระหว่างวงกลม */}
          {index !== steps.length - 1 && (
            <div
              className={`w-16 sm:w-24 h-0.5 mx-2 transition-colors duration-500 ${currentStep > index + 1 ? "bg-emerald-500" : "bg-slate-200"}`}
            ></div>
          )}
        </div>
      ))}
    </div>
  );
}
