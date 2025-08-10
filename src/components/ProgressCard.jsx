import React, { useEffect, useState } from "react";
import { CircleCheck, BookOpen, PlaySquare } from "lucide-react";

const ProgressCard = () => {
  const [progress, setProgress] = useState(0);
  const [completedModules, setCompletedModules] = useState(0);

  const totalModules = 9; // fixed 9 modules

  useEffect(() => {
    const storedProgress =
      JSON.parse(localStorage.getItem("moduleProgress")) || [];

    // compute total progress
    const totalProgress = storedProgress.reduce(
      (sum, val) => sum + (val || 0),
      0
    );
    const averageProgress = totalProgress / totalModules; // percent overall

    // compute completed modules
    const finishedCount = storedProgress.filter((val) => val === 100).length;

    setProgress(Math.round(averageProgress));
    setCompletedModules(finishedCount);
  }, []);

  return (
    <div className="bg-base-200 p-4 rounded-xl shadow-md">
      <div className="flex items-center gap-4">
        <div
          className="radial-progress text-primary"
          style={{ "--value": progress }}
          role="progressbar"
        >
          {progress}%
        </div>

        <div>
          <h2 className="text-lg font-bold">Overall Progress</h2>
          <p className="text-sm text-gray-500">
            Keep going! You're doing great.
          </p>
        </div>
      </div>

      <div className="divider my-4"></div>

      <div className="grid grid-cols-3 gap-4 text-center text-sm font-medium">
        <div className="flex flex-col items-center">
          <BookOpen className="w-6 h-6 text-primary mb-1" />
          <span>Lessons</span>
          <span className="text-xs text-gray-500">0 / 50</span>
          {/* Placeholder pa to, depende sa logic mo */}
        </div>

        <div className="flex flex-col items-center">
          <PlaySquare className="w-6 h-6 text-primary mb-1" />
          <span>Modules</span>
          <span className="text-xs text-gray-500">
            {completedModules} / {totalModules}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <CircleCheck className="w-6 h-6 text-primary mb-1" />
          <span>Assessment</span>
          <span className="text-xs text-gray-500">0 / 25</span>
          {/* Placeholder pa to */}
        </div>
      </div>
    </div>
  );
};

export default ProgressCard;
