// pages/ARDetection.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ScanIcon } from "lucide-react";
import ModulesContent from "../components/ModulesContent";
import BottomNav from "../components/BottomNav";
import ARSupportChecker from "./ARSupportChecker";
import ObjectDection from "../components/ObjectDetection";

import {
  DSA_MODES, // ["Array", "Queue", "Stack", "Linked List", "Auto"]
  loadDSAProgress,
  saveDSAProgress,
  finishDSAMode,
  isDSAModeUnlocked,
} from "../utils/dsaModeProgress"; // 🔁 adjust path kung iba

const ARDetection = () => {
  // 🔹 Progress per DSA mode (Array, Queue, Stack, Linked List, Auto)
  const [modules, setModules] = useState(() => loadDSAProgress());

  // 🔹 Current selected mode for AR (internal value: "none", "Array", ...)
  const [selectedDSA, setSelectedDSA] = useState("none");

  // 🔹 UI buttons: Off + all DSA_MODES (including Auto)
  const dsaModes = useMemo(
    () => [
      { value: "none", label: "Off" },
      ...DSA_MODES.map((name) => ({ value: name, label: name })),
    ],
    []
  );

  // 🔹 Compute unlocked DSA modes based on saved progress
  const unlockedDSAModes = useMemo(() => {
    return modules
      .map((m, idx) => (isDSAModeUnlocked(modules, idx) ? m.name : null))
      .filter(Boolean);
  }, [modules]);

  // 🔹 Helper: is this button unlocked?
  const isModeUnlocked = (value) => {
    if (value === "none") return true; // Off always unlocked
    return unlockedDSAModes.includes(value);
  };

  // 🔹 Persist progress to localStorage whenever modules state changes
  useEffect(() => {
    saveDSAProgress(modules);
  }, [modules]);

  // 🔘 Click handler for DSA mode buttons
  const handleSelectMode = (value) => {
    if (!isModeUnlocked(value)) return; // ignore locked modes
    setSelectedDSA(value);
  };

  // 🔥 Called by ObjectDection when a module assessment is finished
  // moduleName: "Array" | "Queue" | "Stack" | "Linked List"
  const handleModuleComplete = (moduleName) => {
    setModules((prev) => {
      const idx = prev.findIndex((m) => m.name === moduleName);
      if (idx === -1) return prev;
      return finishDSAMode(prev, idx); // sets progress=100 + save to LS
    });
  };

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
                Find the Real-Object of DSA
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN AR CARD */}
      <div className="bg-base-200 rounded-2xl shadow-md h-[calc(70vh-6.5rem)] p-3 flex flex-col gap-3">
        {/* 🔥 DSA MODE BUTTONS – with lock/unlock + Auto mode */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-gray-500">DSA Mode</span>
          <div className="flex flex-wrap gap-1 justify-start">
            {dsaModes.map((m) => {
              const active = selectedDSA === m.value;
              const unlocked = isModeUnlocked(m.value);

              return (
                <button
                  key={m.value}
                  onClick={() => handleSelectMode(m.value)}
                  disabled={!unlocked}
                  className={[
                    "px-3 py-1 rounded-full border text-[0.7rem] transition-colors",
                    unlocked
                      ? "bg-slate-900/60 text-gray-100 border-slate-600 hover:bg-slate-800"
                      : "bg-slate-900/40 text-gray-500 border-slate-700 cursor-not-allowed opacity-60",
                    active &&
                      "bg-emerald-400 text-slate-900 border-emerald-400",
                  ].join(" ")}
                >
                  {m.label}
                  {!unlocked && " 🔒"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional: maliit na text to see progress / debug */}
        <div className="text-[11px] text-gray-400">
          Progress: {modules.map((m) => `${m.name}:${m.progress}%`).join(" · ")}
        </div>

        {/* CAMERA CONTAINER */}
        <div className="flex-1 rounded-xl overflow-hidden bg-black">
          <ObjectDection
            selectedDSA={selectedDSA}
            onModuleComplete={handleModuleComplete}
          />
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ARDetection;
