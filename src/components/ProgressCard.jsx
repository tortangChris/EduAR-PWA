import React, { useEffect, useState } from "react";
import { CircleCheck, PlaySquare, ScanIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import modulesConfig from "../config/modulesConfig";

// 🔹 DSA AR helpers
import {
  DSA_MODES, // ["Array", "Queue", "Stack", "Linked List", "Auto"]
  loadDSAProgress, // returns [{ name, progress }]
} from "../services/dsaModeProgress";

const ProgressCard = () => {
  const [modulePercent, setModulePercent] = useState(0);
  const [completedModules, setCompletedModules] = useState(0);

  const [arPercent, setArPercent] = useState(0);
  const [completedDSAModes, setCompletedDSAModes] = useState(0);

  const navigate = useNavigate();

  const totalModules = modulesConfig.length;
  const totalDSAModes = DSA_MODES.length;

  useEffect(() => {
    // ---------- MODULE PROGRESS (content modules) ----------
    const storedProgress =
      JSON.parse(localStorage.getItem("moduleProgress")) || {};

    const values = modulesConfig.map((m) => storedProgress[m.route] ?? 0);
    const totalProgress = values.reduce((sum, val) => sum + val, 0);
    const averageProgress = values.length ? totalProgress / totalModules : 0;
    const finishedCount = values.filter((val) => val === 100).length;

    setModulePercent(Math.round(averageProgress));
    setCompletedModules(finishedCount);

    // ---------- DSA AR PROGRESS (Array, Queue, Stack, Linked List, Auto) ----------
    const dsaModules = loadDSAProgress(); // [{ name, progress }]
    const totalDsaProgress = dsaModules.reduce(
      (sum, m) => sum + (m.progress ?? 0),
      0
    );
    const averageDsaProgress = dsaModules.length
      ? totalDsaProgress / totalDSAModes
      : 0;
    const finishedDSA = dsaModules.filter((m) => m.progress === 100).length;

    setArPercent(Math.round(averageDsaProgress));
    setCompletedDSAModes(finishedDSA);
  }, []);

  return (
    <div className="bg-base-200 p-5 rounded-2xl shadow-lg">
      {/* HEADER: TWO RADIAL PROGRESS (Modules + AR Detect) */}
      <div className="flex flex-wrap items-center justify-between gap-6">
        {/* Modules radial */}
        <div className="flex items-center gap-4">
          <div
            className="radial-progress text-primary shadow-lg shadow-primary/40"
            style={{
              "--value": modulePercent,
              "--size": "5rem",
              "--thickness": "6px",
            }}
            role="progressbar"
          >
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold">{modulePercent}%</span>
              <span className="text-xs text-gray-400">Modules</span>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold">Overall Progress</h2>
            <p className="text-sm text-gray-500">
              Keep going! You're doing great.
            </p>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-primary/40 to-transparent my-5" />

      {/* BOTTOM GRID: MODULES / ASSESSMENT / AR DETECT */}
      <div className="grid grid-cols-3 gap-6 text-center text-sm font-medium">
        {/* CLICKABLE MODULES */}
        <div
          className="flex flex-col items-center hover:scale-105 transition-transform cursor-pointer"
          onClick={() => navigate("/modules")}
        >
          <PlaySquare className="w-7 h-7 text-primary mb-1" />
          <span>Modules</span>
          <span className="text-xs text-gray-500">
            {completedModules} / {totalModules}
          </span>
        </div>

        {/* Assessment (can still mirror modules for now) */}
        <div className="flex flex-col items-center hover:scale-105 transition-transform">
          <CircleCheck className="w-7 h-7 text-primary mb-1" />
          <span>Assessment</span>
          <span className="text-xs text-gray-500">
            {completedModules} / {totalModules}
          </span>
        </div>

        {/* AR Detect – DSA AR modes + ScanIcon */}
        <div
          className="flex flex-col items-center hover:scale-105 transition-transform cursor-pointer"
          onClick={() => navigate("/arDetection")} // 🔁 adjust route if needed
        >
          <ScanIcon className="w-7 h-7 text-secondary mb-1" />
          <span>AR Detect</span>
          <span className="text-xs text-gray-500">
            {completedDSAModes} / {totalDSAModes}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProgressCard;
