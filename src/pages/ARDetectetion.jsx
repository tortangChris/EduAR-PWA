// pages/ARDetection.jsx (or kung nasaan man itong file)
import React, { useState } from "react";
import { ScanIcon } from "lucide-react";
import ModulesContent from "../components/ModulesContent";
import BottomNav from "../components/BottomNav";
import ARSupportChecker from "./ARSupportChecker";
import ObjectDection from "../components/ObjectDetection";

const ARDetection = () => {
  const [selectedDSA, setSelectedDSA] = useState("none");

  const dsaModes = [
    { value: "none", label: "Off" },
    { value: "Auto", label: "Auto" },
    { value: "Array", label: "Array" },
    { value: "Stack", label: "Stack" },
    { value: "Queue", label: "Queue" },
    { value: "Linked List", label: "Linked List" },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto p-4 bg-base-100 space-y-4">
      <div className="sticky top-0 z-10">
        <div className="bg-base-200 rounded-2xl shadow-md p-5 flex items-center justify-between backdrop-blur-sm">
          {/* Left side: icon + title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <ScanIcon className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Scan Objects</h2>
              <p className="text-sm text-gray-500">
                Find the Real-Object of Data Structure
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN AR CARD */}
      <div className="bg-base-200 rounded-2xl shadow-md h-[calc(70vh-6.5rem)] p-3 flex flex-col gap-3">
        {/* 🔥 DSA MODE BUTTONS – nasa labas na ng camera */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-gray-500">DSA Mode</span>
          <div className="flex flex-wrap gap-1 justify-start">
            {dsaModes.map((m) => {
              const active = selectedDSA === m.value;
              return (
                <button
                  key={m.value}
                  onClick={() => setSelectedDSA(m.value)}
                  className={[
                    "px-3 py-1 rounded-full border text-[0.7rem] transition-colors",
                    active
                      ? "bg-emerald-400 text-slate-900 border-emerald-400"
                      : "bg-slate-900/60 text-gray-100 border-slate-600 hover:bg-slate-800"
                  ].join(" ")}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* CAMERA CONTAINER */}
        <div className="flex-1 rounded-xl overflow-hidden bg-black">
          <ObjectDection selectedDSA={selectedDSA} />
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ARDetection;
