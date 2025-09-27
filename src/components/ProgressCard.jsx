// ProgressCard.jsx
import React, { useEffect, useState } from "react";
import { CircleCheck, PlaySquare } from "lucide-react";
import modulesConfig from "../config/modulesConfig";

const ProgressCard = () => {
  const [progress, setProgress] = useState(0);
  const [completedModules, setCompletedModules] = useState(0);

  const totalModules = modulesConfig.length;

  useEffect(() => {
    const storedProgress =
      JSON.parse(localStorage.getItem("moduleProgress")) || {};

    const values = modulesConfig.map((m) => storedProgress[m.route] ?? 0);
    const totalProgress = values.reduce((sum, val) => sum + val, 0);
    const averageProgress = totalProgress / totalModules;
    const finishedCount = values.filter((val) => val === 100).length;

    setProgress(Math.round(averageProgress));
    setCompletedModules(finishedCount);
  }, []);

  return (
    <div className="bg-base-200 p-5 rounded-2xl shadow-lg">
      <div className="flex items-center gap-6">
        <div
          className="radial-progress text-primary shadow-lg shadow-primary/40"
          style={{
            "--value": progress,
            "--size": "5rem",
            "--thickness": "6px",
          }}
          role="progressbar"
        >
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold">{progress}%</span>
            <span className="text-xs text-gray-400">Completed</span>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold">Overall Progress</h2>
          <p className="text-sm text-gray-500">
            Keep going! You're doing great.
          </p>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-primary/40 to-transparent my-5"></div>

      <div className="grid grid-cols-2 gap-6 text-center text-sm font-medium">
        <div className="flex flex-col items-center hover:scale-105 transition-transform">
          <PlaySquare className="w-7 h-7 text-primary mb-1" />
          <span>Modules</span>
          <span className="text-xs text-gray-500">
            {completedModules} / {totalModules}
          </span>
        </div>

        <div className="flex flex-col items-center hover:scale-105 transition-transform">
          <CircleCheck className="w-7 h-7 text-primary mb-1" />
          <span>Assessment</span>
          <span className="text-xs text-gray-500">- / -</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressCard;
