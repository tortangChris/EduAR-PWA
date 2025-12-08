import React, { useState } from "react";
import StackQueueAssessment from "./StackQueueAssessment";
import ARButtonAssessement from "./ARButtonAssessement";

const PageInteractive = ({ onAssessmentPassStatusChange }) => {
  const [activeView, setActiveView] = useState(null);
  // null = default buttons screen

  return (
    <div className="bg-base-200 rounded-xl shadow-md h-[calc(82vh-6.5rem)] overflow-y-auto p-6 text-left flex flex-col items-center">
      {/* If nothing is selected, show the two buttons */}
      {!activeView && (
        <div className="space-y-6 flex flex-col items-center">
          {/* TOP BUTTON → Assessment */}
          <button
            onClick={() => setActiveView("assessment")}
            className="w-55 h-48 bg-gray-900 rounded-xl shadow-lg flex flex-col items-center justify-center p-4 hover:scale-105 transition-transform"
          >
            <div className="w-20 h-20 bg-gray-300 rounded-md mb-2"></div>
            <span className="text-sm font-semibold text-center">
              3D AR Assessment
            </span>
          </button>

          {/* BOTTOM BUTTON → ARButtonAssessment */}
          <button
            onClick={() => setActiveView("real")}
            className="w-55 h-48 bg-gray-900 rounded-xl shadow-lg flex flex-col items-center justify-center p-4 hover:scale-105 transition-transform"
          >
            <div className="w-20 h-20 bg-gray-300 rounded-md mb-2"></div>
            <span className="text-sm font-semibold text-center">
              Real-Objects AR Assessment
            </span>
          </button>
        </div>
      )}

      {/* If activeView === "assessment", show Assessment component */}
      {activeView === "assessment" && (
        <div className="w-full h-[300px] bg-gray-900 rounded-xl flex items-center justify-center relative">
          <StackQueueAssessment
            passingRatio={0.75} // generic passing rule
            onPassStatusChange={onAssessmentPassStatusChange} // inform parent (Arrays)
          />

          {activeView === "real" && (
            <div className="w-full h-[300px] rounded-xl flex items-center justify-center relative">
              <ARButtonAssessement />

              <button
                onClick={() => setActiveView(null)}
                className="absolute top-3 right-3 bg-white px-3 py-1 rounded-md text-black text-sm shadow"
              >
                Back
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PageInteractive;
