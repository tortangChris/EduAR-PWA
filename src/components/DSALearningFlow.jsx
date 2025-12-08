// src/components/DSALearningFlow.jsx
import React, { useEffect, useMemo, useState } from "react";
import ObjectDection from "../components/ObjectDetection"; // adjust path kung iba
import {
  DSA_MODES,
  loadDSAProgress,
  saveDSAProgress,
  finishDSAMode,
  isDSAModeUnlocked,
} from "../utils/dsaModeProgress"; // adjust path kung iba

// UI list: kasama si "Off" sa buttons
const UI_MODES = ["Off", ...DSA_MODES];

const DSALearningFlow = () => {
  // 🔹 DSA progress per module (Array, Queue, Stack, Linked List, Auto)
  const [modules, setModules] = useState(() => loadDSAProgress());

  // 🔹 Currently selected mode for AR view
  // internalSelected = "Off" | "Array" | "Queue" | ...
  const [internalSelected, setInternalSelected] = useState("Off");

  // 🔹 Derive unlocked DSA modes using progress (localStorage-based)
  const unlockedDSAModes = useMemo(() => {
    return modules
      .map((m, idx) => (isDSAModeUnlocked(modules, idx) ? m.name : null))
      .filter(Boolean);
  }, [modules]);

  // 🔹 Helper: check if a given UI mode is unlocked
  const isModeUnlocked = (mode) => {
    if (mode === "Off") return true; // Off is always usable
    return unlockedDSAModes.includes(mode);
  };

  // 🔹 Map internalSelected string to prop value for ObjectDection
  const selectedForObjectDetection =
    internalSelected === "Off" ? "none" : internalSelected;

  // 🧠 Persist progress to localStorage whenever modules change
  useEffect(() => {
    saveDSAProgress(modules);
  }, [modules]);

  // 🔘 User clicks mode button (Off, Array, Queue, Stack, Linked List, Auto)
  const handleSelectMode = (mode) => {
    if (!isModeUnlocked(mode)) return; // ignore locked mode clicks
    setInternalSelected(mode);
  };

  // 🔥 Called by ObjectDection kapag natapos na assessment ng isang module
  // moduleName: "Array" | "Queue" | "Stack" | "Linked List"
  const handleModuleComplete = (moduleName) => {
    setModules((prev) => {
      const idx = prev.findIndex((m) => m.name === moduleName);
      if (idx === -1) return prev;

      const updated = finishDSAMode(prev, idx); // sets progress=100 + save to LS
      return updated;
    });
  };

  return (
    <div className="flex flex-col gap-3 w-full h-full">
      {/* Top controls: mode buttons with lock / unlock */}
      <div className="flex flex-wrap items-center gap-2">
        {UI_MODES.map((mode) => {
          const unlocked = isModeUnlocked(mode);
          const isActive = internalSelected === mode;

          return (
            <button
              key={mode}
              onClick={() => handleSelectMode(mode)}
              disabled={!unlocked}
              className={[
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition",
                unlocked
                  ? "border-slate-500 hover:border-sky-400 hover:text-sky-200"
                  : "border-slate-700 text-slate-500 cursor-not-allowed opacity-60",
                isActive
                  ? "bg-sky-600/30 border-sky-400 text-sky-100"
                  : "bg-slate-900/70 text-slate-200",
              ].join(" ")}
            >
              {mode}
              {!unlocked && " 🔒"}
            </button>
          );
        })}
      </div>

      {/* Small progress text (optional for debugging / UX) */}
      <div className="text-[11px] text-slate-300 space-y-0.5">
        <div>
          Selected mode:{" "}
          <span className="font-mono text-sky-300">{internalSelected}</span>
        </div>
        <div>
          Progress:{" "}
          {modules.map((m) => `${m.name}:${m.progress}%`).join("  · ")}
        </div>
      </div>

      {/* Main AR area */}
      <div className="flex-1 min-h-[320px] rounded-xl overflow-hidden bg-black">
        <ObjectDection
          selectedDSA={selectedForObjectDetection}
          onModuleComplete={handleModuleComplete}
        />
      </div>
    </div>
  );
};

export default DSALearningFlow;
